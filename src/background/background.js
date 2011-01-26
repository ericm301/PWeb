/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @constructor
 */
var Background = function() {
  /**
   * @type {!Preferences}
   * @private
   */
  this.preferences_ = new Preferences();

  /**
   * @type {?Tab}
   * @private
   */
  this.lastSelectedTab_ = null;

  /**
   * @type {?Object}
   * @private
   */
  this.parsedRules_ = null;

  /**
   * @type {number}
   * @private
   */
  this.lastParseTime_ = 0;

  /**
   * @type {!TabMask}
   * @private
   */
  this.tabMask_ = new TabMask();
};


/**
 * @param {Tab} tab
 * @private
 */
Background.prototype.showPageAction_ = function(tab) {
  if (!this.preferences_.getShowPageAction()) {
    return;
  }
  chrome.pageAction.show(tab.id);
};


/**
 * @param {Tab} tab
 * @private
 */
Background.prototype.updateSelectedTab_ = function(tab) {
  if (tab && tab.selected) {
    this.lastSelectedTab_ = tab;
  }
};


/**
 * @param {Tab} tab
 * @private
 */
Background.prototype.moveTab_ = function(tab) {
  if (this.lastSelectedTab_ &&
      this.lastSelectedTab_.windowId == tab.windowId &&
      this.lastSelectedTab_.index + 1 < tab.index &&
      this.preferences_.getOpenTabsToTheRight()) {
    /** @type {!Background} */
    var self = this;
    chrome.tabs.move(tab.id, {
      'windowId': tab.windowId,
      'index': (this.lastSelectedTab_.index + 1)
    }, function(movedTab) {
      self.updateSelectedTab_(movedTab);
    });
  }
  this.updateSelectedTab_(tab);
};


/**
 * @private
 */
Background.prototype.maybeUpdateParsedRules_ = function() {
  if (!this.parsedRules_ ||
      this.lastParseTime_ != this.preferences_.getFiltersUpdateTime()) {
    this.parsedRules_ = [];
    this.lastParseTime_ = this.preferences_.getFiltersUpdateTime();

    var rules = this.preferences_.getRulesJson() || [];
    for (var i = 0, rule; rule = rules[i]; ++i) {
      if (!rule['enabled'] || !rule['urlRegex']) continue;

      var regex;
      /** @preserveTry */
      try {
        regex = new RegExp(rule['urlRegex'], 'i');
      } catch (e) {}

      var exclRegex;
      /** @preserveTry */
      try {
        exclRegex = rule['urlExcludeRegex'] &&
                    new RegExp(rule['urlExcludeRegex'], 'i');
      } catch (e) {}

      if (regex) {
        rule['urlRegex'] = regex;
        rule['urlExcludeRegex'] = exclRegex;
        this.parsedRules_.push(rule);
      }
    }
  }
};


/**
 * @param {string} url
 * @return {?Object}
 */
Background.prototype.getMatchedRule_ = function(url) {
  this.maybeUpdateParsedRules_();

  var compositeRule = {
    'preserveDocWrite': true,
    'filters': [],
    'css': '',
    'html': '',
    'js': ''
  };

  var isRuleEmpty = true;
  for (var i = 0, rule; rule = this.parsedRules_[i]; ++i) {
    var regex = rule['urlRegex'];
    var exclRegex = rule['urlExcludeRegex'];
    if (regex.test(url) && (!exclRegex || !exclRegex.test(url))) {
      isRuleEmpty = false;
      if (!rule['preserveDocWrite']) {
        compositeRule['preserveDocWrite'] = false;
      }
      if (rule['filters']) {
        compositeRule['filters'] = compositeRule['filters'].concat(rule['filters']);
      }
      if (rule['css']) {
        compositeRule['css'] += rule['css'];
      }
      if (rule['html']) {
        compositeRule['html'] += rule['html'];
      }
      if (rule['js']) {
        compositeRule['js'] += rule['js'];
      }
    }
  }
  return (isRuleEmpty ? null : compositeRule);
};


/**
 * Runs the background page.
 */
Background.prototype.run = function() {
  /** @type {!Background} */
  var self = this;

  // Iterate through open tabs to put the icon back on modified pages.
  // This is needed when the extension gets updated.
  chrome.windows.getAll({'populate': true}, function(wins) {
    for (var i = 0, win; win = wins[i]; ++i) {
      for (var j = 0, tab; tab = win.tabs[j]; ++j) {
        console.log('[PersonalizedWeb] Sending initial request to ' + tab.url +
                    ', tabId=' + tab.id);
        /** @preserveTry */
        try {
          chrome.tabs.sendRequest(tab.id, {} /*no rule*/);
        } catch(e) {};
      }
    }
  });

  //====================================================================
  chrome.tabs.getSelected(null, function(tab) {
    self.updateSelectedTab_(tab);
  });

  chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tab) {
      self.updateSelectedTab_(tab);
    });
  });

  chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
    chrome.tabs.get(tabId, function(tab) {
      self.updateSelectedTab_(tab);
    });
  });

  chrome.windows.onFocusChanged.addListener(function(windowId) {
    chrome.tabs.getSelected(windowId, function(tab) {
      self.updateSelectedTab_(tab);
    });
  });
 
  // Open new tabs next to the right of the selected one.
  chrome.tabs.onCreated.addListener(function(tab) {
    self.moveTab_(tab);
  });

  //====================================================================
  chrome.pageAction.onClicked.addListener(function(tab) {
    self.tabMask_.mask(tab.id);
    chrome.tabs.update(tab.id, {'url': tab.url});
  });

  chrome.tabs.onRemoved.addListener(function(tabId) {
    self.tabMask_.onTabClosed(tabId);
  });

  //====================================================================
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log('[PersonalizedWeb] chrome.tabs.onUpdated.addListener: tabId=' + tab.id + ', ' + changeInfo['status']);

    if (changeInfo['status'] == 'loading') {
      chrome.pageAction.hide(tab.id);

      if (self.tabMask_.maybeUnmask(tab.id)) {
        // Tell the content script to ignore subsequent requests until the page
        // gets reloaded. This is necessary, because the "onUpdated" event can
        // be fired multiple times without the web page being reloaded (e.g. by
        // changing the #hash portion of the URL). We should prevent silent and
        // unobvious modifications of web pages.
        chrome.tabs.sendRequest(tab.id, {
          'disabled': true
        });
        return;
      }

      var rule = self.getMatchedRule_(tab.url);
      if (rule) {
        console.log('[PersonalizedWeb] Tweaking web page: ' + tab.url + ', tabId=' + tab.id);
        chrome.tabs.sendRequest(tab.id, {
          'rule': rule
        });
      }
    } else {
      // A strange behavior of Chrome browser would sometimes hide the icon for
      // an unknown reason while loading some dynamic content. We just ask the
      // content script again if it has been modified or not, just in case.
      chrome.tabs.sendRequest(tab.id, {} /*no rule*/);
    }
  });

  chrome.extension.onRequest.addListener(function(request, sender, sendResponseFunc) {
    var tab = sender.tab;
    if (request['modifiedEvent']) {
      console.log('[PersonalizedWeb] Received onModifiedEvent from ' + tab.url);
      self.showPageAction_(tab);
    } else {
      console.log('[PersonalizedWeb] Tweaking iframe: ' + request.url + ', tabId=' + tab.id);
      if (self.tabMask_.wasRecentlyMasked(tab.id)) {
        return;
      }
      if (sendResponseFunc) {
        var rule = request.url && self.getMatchedRule_(request.url);
        sendResponseFunc(rule || null);
      }
    }
  });

  //====================================================================
  chrome.extension.onRequestExternal.addListener(function(msg, sender, sendResponseFunc) {
    if (msg && msg['pwebProviderRules']) {
      console.log('[PersonalizedWeb] Received external request from: ' + sender.id);
      if (sendResponseFunc) {
        sendResponseFunc();
      }
    } else {
      console.log('[PersonalizedWeb] Ignored external request from: ' + sender.id);
    }
  });

};


// Entry point.
new Background().run();
