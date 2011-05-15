/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @constructor
 */
var OptionsLayout = function() {
  /**
   * @type {boolean}
   * @private
   */
  this.saved_ = true;

  /**
   * @type {!Preferences}
   * @private
   */
  this.preferences_ = new Preferences();

  /**
   * @type {?Node}
   * @private
   */
  this.lastPopupMenuMoreElm_ = null;

  this.setSaved_(true);
  this.initialize_();
  this.display(this.preferences_.getRulesJson(), true);
};


/**
 * @enum {string}
 * @private
 */
OptionsLayout.Ids_ = {
  RULES_CONTAINER: 'rules-container',
  RULE_TEMPLATE: 'rule-template'
};


/**
 * @enum {string}
 * @private
 */
OptionsLayout.Classes_ = {
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed',
  DISABLED: 'disabled',
  ADBLOCKER: 'adblocker',
  RULE_EXPANDER: 'rule-expander',
  RULE_HEADER: 'rule-header',
  RULE_URL_PATTERN: 'input-url-pattern',
  RULE_EXCLUDE_URL_PATTERN: 'input-url-exclude',
  RULE_CSS: 'rule-css',
  RULE_JS: 'rule-js',
  RULE_HTML: 'rule-html'
};


/**
 * @private
 */
OptionsLayout.prototype.initialize_ = function() {
  /** @type {!OptionsLayout} */
  var self = this;

  var callback = function() {
    self.onSaveBehaviorPreferences_();
  };
  dom.$('tab-open').addEventListener('click', callback, false);
  dom.$('show-page-action').addEventListener('click', callback, false);

  dom.$('add-new-rule').addEventListener('click', function() {
    self.onAddNewRule_();
  }, false);

  dom.$('save-changes').addEventListener('click', function() {
    self.onSave_();
  }, false);

  dom.$('dump-rules').addEventListener('click', function() {
    self.onDumpAllRules_();
  }, false);

  dom.$('load-dumped-rules').addEventListener('click', function() {
    self.onLoadDumpedRules_();
  }, false);

  dom.$('rules-container').addEventListener('change', function() {
    self.setSaved_(false);
  }, false);

  window.addEventListener('load', function() {
    self.onLoadBehaviorPreferences_();
  }, false);

  // Keydown in capture phase.
  window.addEventListener('keydown', function(e) {
    var key = e.keyCode;
    if (key == 8 /* BACKSPACE */ || key == 13 /* ENTER */ ||
        key == 45 /* INSERT */ || key == 46 /* DELETE */ ||
        (e.ctrlKey && (key == 67 /* CTRL+C */ ||
                       key == 86 /* CTRL+V */ ||
                       key == 88 /* CTRL+X */ ||
                       key == 90 /* CTRL+Z */)))
    {
      // Check if we need to upgrade the height of a textarea (if the target
      // is a textarea element). This must be done asynchronously.
      window.setTimeout(function() {
        self.setupTextAreaHeight_(e.target);
        // Try to clear the isSaved flag. The active target may not necessary
        // be INPUT or TEXTAREA when the user press, for example, CTRL+Z.
        self.setSaved_(false);
      }, 0);
    } else if (key == 27 /* ESC */) {
      self.dumpRules_(null);
      self.lastPopupMenuMoreElm_ = null; // Close the popup menu.
      self.repositionPopupMenu_();
    }
    
    //**/ console.log('e.keyCode=' + key);
    //**/ console.dir(e);

  }, true);

  // Keydown in bubbling phase.
  window.addEventListener('keydown', function(e) {
    if (self.isSaved()) { // <== Optimization.
      var tagName = e.target && e.target.tagName;
      if (tagName == 'INPUT' || tagName == 'TEXTAREA') {
        window.setTimeout(function() {
          self.setSaved_(false);
        }, 0);
      }
    }
  }, false);

  window.addEventListener('click', function(e) {
    self.onClickHandler_(e);
  }, false);

  window.addEventListener('resize', function() {
    self.lastPopupMenuMoreElm_ = null; // Close the popup menu.
    self.repositionPopupMenu_();
  }, false);
};


/**
 * @private
 */
OptionsLayout.prototype.onSaveBehaviorPreferences_ = function() {
  var tabOpenElm = dom.$('tab-open');
  this.preferences_.setOpenTabsToTheRight(!!tabOpenElm.checked);

  var showPageActionElm = dom.$('show-page-action');
  this.preferences_.setShowPageAction(!!showPageActionElm.checked);
};


/**
 * @private
 */
OptionsLayout.prototype.onLoadBehaviorPreferences_ = function() {
  var tabOpenElm = dom.$('tab-open');
  tabOpenElm.checked = !!this.preferences_.getOpenTabsToTheRight();

  var showPageActionElm = dom.$('show-page-action');
  showPageActionElm.checked = !!this.preferences_.getShowPageAction();
};


/**
 * @param {!Array.<pweb.Rule>} rulesJson
 * @param {boolean=} opt_verifyRules
 */
OptionsLayout.prototype.display = function(rulesJson, opt_verifyRules) {
  var rulesContainer = dom.$('rules-container');
  var ruleTemplateElm = dom.$('rule-template');

  dom.removeChildren(rulesContainer);

  for (var i = 0, rule; rule = rulesJson[i]; ++i) {
    var ruleElm = dom.clone(ruleTemplateElm);
    this.setupRuleElement_(ruleElm, rule);
    if (!i) this.setupAdBlockerRuleElement_(ruleElm, true);
    rulesContainer.appendChild(ruleElm);
  }

  if (opt_verifyRules) {
    this.getAndVerifyDisplayedRules_();
  }
};


/**
 * @private
 */
OptionsLayout.prototype.onAddNewRule_ = function() {
  var rulesContainer = dom.$('rules-container');
  var ruleTemplateElm = dom.$('rule-template');

  var ruleElm = dom.clone(ruleTemplateElm);
  this.setupRuleElement_(ruleElm,
    /** @type {!pweb.Rule} */ ({'enabled': true, 'urlRegex': '^http://'}));
  rulesContainer.appendChild(ruleElm);

  this.setSaved_(false);

  dom.classes.remove(ruleElm, OptionsLayout.Classes_.COLLAPSED);
  dom.classes.add(ruleElm, OptionsLayout.Classes_.EXPANDED);
  window.scrollTo(0, ruleElm.offsetTop);

  this.highlightElement_(ruleElm);

  var inputRuleNameElm = dom.$$('input-rule-name', ruleElm)[0];
  inputRuleNameElm.select();
};


/**
 * @private
 */
OptionsLayout.prototype.onDumpAllRules_ = function() {
  if (!this.checkSaved(dom.getMsg('should_save_changes'))) {
    return;
  }

  var rulesJson = this.preferences_.getRulesJson();
  this.dumpRules_(rulesJson);
};


/**
 * @param {?Array.<pweb.Rule>|pweb.Rule} rulesJson
 * @private
 */
OptionsLayout.prototype.dumpRules_ = function(rulesJson) {
  var dumpRulesOutputElm = dom.$('dump-rules-output');
  if (rulesJson) {
    // Consecutive spaces in JSON will be treated as one space when loaded back
    // via copy-paste. To workaround this we will replace every other space
    // with it's hex code equivalent.
    // NOTE: We do not replace *all* spaces, because the size of the dump will
    // be increased significantly (there are too many single spaces in average).
    var rulesJsonText = JSON.stringify(rulesJson).replace(/  /g, ' \\u0020');
    dumpRulesOutputElm.value = rulesJsonText;
    dumpRulesOutputElm.style.display = ''
    dumpRulesOutputElm.select();
  } else {
    dumpRulesOutputElm.style.display = 'none';
  }
};


/**
 * @private
 */
OptionsLayout.prototype.onLoadDumpedRules_ = function() {
  if (!this.checkSaved(dom.getMsg('should_save_changes'))) {
    return;
  }

  // Remove the box with dumped rules (if any). Otherwise, this would crash
  // the extension for some reason, at least on Chrome 5.0.375.3 dev.
  this.dumpRules_(null);

  var q = prompt(dom.getMsg('enter_dump_prompt'), '');
  this.loadDumpedRules_(q);
};


/**
 * @param {string|pweb.Rule} q
 * @private
 */
OptionsLayout.prototype.loadDumpedRules_ = function(q) {
  if (q) {
    var newRules;
    /** @preserveTry */
    try {
      if (typeof q == 'string') {
        newRules = JSON.parse(q);
      } else {
        newRules = q;
      }
    } catch (e) {
      alert(dom.getMsg('error_json_parse', '' + e));
    }
    if (newRules) {
      var rulesJson = this.preferences_.getRulesJson();
      rulesJson = rulesJson.concat(newRules);

      this.display(rulesJson);
      this.setSaved_(false);
    }
  }
};


/**
 * @private
 */
OptionsLayout.prototype.highlightElement_ = function(elm) {
  dom.classes.remove(elm, "highlight");
  window.setTimeout(function() {
    dom.classes.add(elm, "highlight");
  }, 0)
};


/**
 * @private
 */
OptionsLayout.prototype.onSave_ = function() {
  var result = this.getAndVerifyDisplayedRules_();
  this.preferences_.setRulesJson(result);
  this.setupAllRuleElementHeaders_();
  this.setSaved_(true);
};


/**
 * @return {!Array.<!pweb.Rule>}
 * @private
 */
OptionsLayout.prototype.getAndVerifyDisplayedRules_ = function() {
  var result = [];

  this.clearErrorMessages_();

  var rulesContainer = dom.$('rules-container');
  for (var ruleElm = rulesContainer.firstChild; ruleElm; ruleElm = ruleElm.nextSibling) {
    var rule = this.getAndVerifyDisplayedRule_(ruleElm);
    result.push(rule);
  }

  return result;
};


/**
 * @param {!Node} ruleElm
 * @return {!pweb.Rule}
 * @private
 */
OptionsLayout.prototype.getAndVerifyDisplayedRule_ = function(ruleElm) {
  var rule = {};

  var inputRuleNameElm = dom.$$('input-rule-name', ruleElm)[0];
  rule['name'] = inputRuleNameElm.value || dom.getMsg('rule_name_noname');

  var inputUrlPatternElm = dom.$$('input-url-pattern', ruleElm)[0];
  rule['urlRegex'] = inputUrlPatternElm.value;
  if (rule['urlRegex']) {
    this.checkRegex_(rule['urlRegex'], dom.getMsg('error_invalid_match_regex', rule['name']));
  } else {
    this.displayErrorMessage_(dom.getMsg('error_empty_match_regex', rule['name']));
  }

  var inputUrlExcludePattern = dom.$$('input-url-exclude', ruleElm)[0];
  rule['urlExcludeRegex'] = inputUrlExcludePattern.value;
  this.checkRegex_(rule['urlExcludeRegex'], dom.getMsg('error_invalid_exclude_regex', rule['name']));

  var ruleEnabledCheckbox = dom.$$('rule-enabled', ruleElm)[0];
  rule['enabled'] = !!ruleEnabledCheckbox.checked;

  var docWriteCheckbox = dom.$$('intercept-doc-write', ruleElm)[0];
  rule['preserveDocWrite'] = !docWriteCheckbox.checked;

  var ruleCssElm = dom.$$('rule-css', ruleElm)[0];
  rule['css'] = ruleCssElm.value;

  var ruleHtmlElm = dom.$$('rule-html', ruleElm)[0];
  rule['html'] = ruleHtmlElm.value;

  var ruleJsElm = dom.$$('rule-js', ruleElm)[0];
  rule['js'] = ruleJsElm.value;

  var filters = [];
  var filtersContainer = dom.$$('filters-container', ruleElm)[0];
  for (var filterElm = filtersContainer.firstChild; filterElm; filterElm = filterElm.nextSibling) {
    var filterRule = {};

    var tagsElm = dom.$$('filter-tags', filterElm)[0];
    filterRule['tags'] = tagsElm.value;

    var attrElm = dom.$$('filter-attr', filterElm)[0];
    filterRule['attribute'] = attrElm.value;

    var valueElm = dom.$$('filter-value', filterElm)[0];
    filterRule['value'] = valueElm.value;

    var valueRegexElm = dom.$$('filter-value-regex', filterElm)[0];
    filterRule['valueRegex'] = valueRegexElm.value;
    this.checkRegex_(filterRule['valueRegex'], dom.getMsg('error_invalid_remover_regex', [rule['name'], (filters.length + 1)]));

    var isEmpty = true;
    for (var p in filterRule) {
      if (filterRule[p]) {
        isEmpty = false;
        break;
      }
    }

    if (!isEmpty) {
      filters.push(filterRule);
    }
  }
  rule['filters'] = filters;

  return /** @type {!pweb.Rule} */ (rule);
};


/**
 * @param {string} regex
 * @param {string} errorMsg
 * @private
 */
OptionsLayout.prototype.checkRegex_ = function(regex, errorMsg) {
  /** @preserveTry */
  try {
    this.dummy_ = new RegExp(regex, 'i');
  } catch (e) {
    this.displayErrorMessage_(errorMsg + ': ' + regex);
  }
};


/**
 * @param {string} errorMsg
 * @private
 */
OptionsLayout.prototype.displayErrorMessage_ = function(errorMsg) {
  var errorsElm = dom.$('errors');
  errorsElm.innerHTML += (dom.htmlEscape(errorMsg) + '<br>');
};


/**
 * @private
 */
OptionsLayout.prototype.clearErrorMessages_ = function() {
  var errorsElm = dom.$('errors');
  errorsElm.innerHTML = '';
};


/**
 * @param {?Node} ruleElm
 * @param {!pweb.Rule} rule
 * @private
 */
OptionsLayout.prototype.setupRuleElement_ = function(ruleElm, rule) {
  ruleElm.removeAttribute('id');
  ruleElm.style.display = '';

  var inputRuleNameElm = dom.$$('input-rule-name', ruleElm)[0];
  inputRuleNameElm.value = rule['name'] || dom.getMsg('rule_name_noname');

  var inputUrlPatternElm = dom.$$('input-url-pattern', ruleElm)[0];
  inputUrlPatternElm.value = rule['urlRegex'] || '';

  var urlExcludePatternElm = dom.$$('input-url-exclude', ruleElm)[0];
  urlExcludePatternElm.value = rule['urlExcludeRegex'] || '';

  var ruleEnabledCheckbox = dom.$$('rule-enabled', ruleElm)[0];
  ruleEnabledCheckbox.checked = !!rule['enabled'];

  var docWriteCheckbox = dom.$$('intercept-doc-write', ruleElm)[0];
  docWriteCheckbox.checked = !rule['preserveDocWrite'];

  var filtersContainer = dom.$$('filters-container', ruleElm)[0];
  var filterTemplate = dom.$('filter-template');
  for (var i = 0, filterRule;
       filterRule = rule['filters'] && rule['filters'][i];
       ++i) {
    var filterElm = dom.clone(filterTemplate);
    this.setupFilterElement_(filterElm, filterRule);
    filtersContainer.appendChild(filterElm);
  }

  var ruleCssElm = dom.$$('rule-css', ruleElm)[0];
  ruleCssElm.value = rule['css'] || '';

  var ruleHtmlElm = dom.$$('rule-html', ruleElm)[0];
  ruleHtmlElm.value = rule['html'] || '';
  
  var ruleJsElm = dom.$$('rule-js', ruleElm)[0];
  ruleJsElm.value = rule['js'] || '';

  this.setupRuleElementHeader_(ruleElm);
  this.setupRuleElementDisableStyle_(ruleElm);
};


/**
 * @param {?Node} ruleElm
 * @private
 */
OptionsLayout.prototype.setupRuleElementHeader_ = function(ruleElm) {
  var inputRuleNameElm = dom.$$('input-rule-name', ruleElm)[0];
  var ruleNameElm = dom.$$('rule-name', ruleElm)[0];
  dom.setTextContent(ruleNameElm, inputRuleNameElm.value);

  var inputUrlPatternElm = dom.$$('input-url-pattern', ruleElm)[0];
  var urlPatternElm = dom.$$('rule-url-pattern', ruleElm)[0];
  dom.setTextContent(urlPatternElm, inputUrlPatternElm.value);
};


/**
 * @private
 */
OptionsLayout.prototype.setupAllRuleElementHeaders_ = function() {
  var rulesContainer = dom.$('rules-container');
  for (var ruleElm = rulesContainer.firstChild; ruleElm; ruleElm = ruleElm.nextSibling) {
    this.setupRuleElementHeader_(ruleElm);
  }
};


/**
 * @param {?Node} ruleElm
 * @param {boolean} isAdBlocker
 * @private
 */
OptionsLayout.prototype.setupAdBlockerRuleElement_ = function(ruleElm, isAdBlocker) {
  dom.classes.enable(ruleElm, OptionsLayout.Classes_.ADBLOCKER, isAdBlocker);
  
  /** @const */ var tags = ['INPUT', 'TEXTAREA'];

  for (var i = 0, tag; tag = tags[i]; ++i) {
    var elms = ruleElm.getElementsByTagName(tag);
    for (var j = 0, elm; elm = elms[j]; ++j) {
      var isElementMutable = dom.classes.hasAny(elm, [
        OptionsLayout.Classes_.RULE_URL_PATTERN,
        OptionsLayout.Classes_.RULE_EXCLUDE_URL_PATTERN,
        'rule-enabled'
      ]);

      if (!isElementMutable) {
        dom.attribute.enable(elm, 'readonly', isAdBlocker);
        if (elm['type'] == 'checkbox') {
          dom.attribute.enable(elm, 'disabled', isAdBlocker);
        }
      }
    }
  }

  this.setupRuleElementDisableStyle_(ruleElm);
};


/**
 * @param {?Node} ruleElm
 * @private
 */
OptionsLayout.prototype.setupRuleElementDisableStyle_ = function(ruleElm) {
  var ruleEnabledCheckbox = dom.$$('rule-enabled', ruleElm)[0];
  var isEnabled = ruleEnabledCheckbox['checked'];
  dom.classes.enable(ruleElm, OptionsLayout.Classes_.DISABLED, !isEnabled);
};


/**
 * @param {?Node} filterElm
 * @param {!pweb.Filter} filterRule
 * @private
 */
OptionsLayout.prototype.setupFilterElement_ = function(filterElm, filterRule) {
  filterElm.removeAttribute('id');
  filterElm.style.display = '';

  var tagsElm = dom.$$('filter-tags', filterElm)[0];
  tagsElm.value = filterRule['tags'] || '';

  var attrElm = dom.$$('filter-attr', filterElm)[0];
  attrElm.value = filterRule['attribute'] || '';

  var valueElm = dom.$$('filter-value', filterElm)[0];
  valueElm.value = filterRule['value'] || '';

  var valueRegexElm = dom.$$('filter-value-regex', filterElm)[0];
  valueRegexElm.value = filterRule['valueRegex'] || '';
};


/**
 * @param {?Node} elm
 * @private
 */
OptionsLayout.prototype.setupTextAreaHeight_ = function(elm) {
  if (!elm || elm.tagName != 'TEXTAREA' || !dom.classes.hasAny(elm, [
    OptionsLayout.Classes_.RULE_CSS,
    OptionsLayout.Classes_.RULE_JS,
    OptionsLayout.Classes_.RULE_HTML
  ])) {
    return;
  }
  /** @const */ var MIN_HEIGHT = 80;    // Should correspond to the CSS styles!
  /** @const */ var HEIGHT_PADDING = 4; // Should correspond to the CSS styles!
  /** @const */ var MAX_HEIGHT = 1200;

  if (elm.value) {
    var height = Math.max(MIN_HEIGHT, elm.scrollHeight - HEIGHT_PADDING);
    height = Math.min(height, MAX_HEIGHT);
    elm.style.height = (height > MIN_HEIGHT) ? height + 'px' : '';
  } else {
    elm.style.height = '';
  }
};


/**
 * @param {!MouseEvent} e
 * @private
 */
OptionsLayout.prototype.onClickHandler_ = function(e) {
  this.maybeOnPopupMoreElmClick_(e);
  this.maybeOnExpanderClick_(e);
  this.maybeOnAddNewFilterClick_(e);
  this.maybeOnRuleEnableDisableClick_(e);
};


/**
 * @param {!MouseEvent} e
 * @private
 */
OptionsLayout.prototype.maybeOnAddNewFilterClick_ = function(e) {
  var target = /** @type {?Node} */ (e.target);
  if (dom.classes.has(target, 'add-new-filter')) {
    var containerItem = this.getContainerItem_(target);
    var filtersContainer = dom.$$('filters-container', containerItem)[0];
    var filterTemplate = dom.$('filter-template');
    
    var filterElm = dom.clone(filterTemplate);
    this.setupFilterElement_(filterElm, /** @type {!pweb.Filter} */ ({}));
    filtersContainer.appendChild(filterElm);
  }
};


/**
 * @param {!MouseEvent} e
 * @private
 */
OptionsLayout.prototype.maybeOnExpanderClick_ = function(e) {
  var target = /** @type {?Node} */ (e.target);
  var isExpanderClick = dom.classes.hasAny(target, [
    OptionsLayout.Classes_.RULE_EXPANDER,
    OptionsLayout.Classes_.RULE_HEADER
  ]);

  if (!isExpanderClick) {
    for (var node = target; node; node = node.parentNode) {
      if (dom.classes.has(node, OptionsLayout.Classes_.RULE_EXPANDER)) {
        isExpanderClick = true;
        break;
      }
    }
  }
  if (isExpanderClick) {
    var containerItem = this.getContainerItem_(target);
    dom.classes.switchBetween(
      containerItem,
      OptionsLayout.Classes_.EXPANDED,
      OptionsLayout.Classes_.COLLAPSED);

    var textareas = containerItem.getElementsByTagName('TEXTAREA');
    for (var i = 0, elm; elm = textareas[i]; ++i) {
      this.setupTextAreaHeight_(elm);
    }
  }
};


/**
 * @param {!MouseEvent} e
 * @private
 */
OptionsLayout.prototype.maybeOnPopupMoreElmClick_ = function(e) {
  var popupMenuElm = dom.$('popup-menu');

  var optionsElm;
  for (var node = e && e.target; node; node = node.parentNode) {
    if (node == popupMenuElm) {
      if (this.maybeProcessMenuCommand_(e.target['id'])) {
        optionsElm = null;
        break; // Will close the popup menu.
      } else {
        return; // Ignore this event.
      }
    }

    if (dom.classes.has(node, 'rule-options')) {
      optionsElm = node;
      break;
    }
  }

  if (optionsElm == this.lastPopupMenuMoreElm_) {
    optionsElm = null; // Double click will close the popup.
  }
  this.lastPopupMenuMoreElm_ = optionsElm;
  this.repositionPopupMenu_();
};


/**
 * @param {!MouseEvent} e
 * @private
 */
OptionsLayout.prototype.maybeOnRuleEnableDisableClick_ = function(e) {
  var target = /** @type {?Node} */ (e.target);
  if (dom.classes.has(target, 'rule-enabled')) {
    var containerItem = this.getContainerItem_(target);
    this.setupRuleElementDisableStyle_(containerItem);
  }
};


/**
 * @param {?Node} node
 * @return {?Node}
 * @private
 */
OptionsLayout.prototype.getContainerItem_ = function(node) {
  for (; node; node = node.parentNode) {
    if (dom.classes.hasAny(node, ['rule-template', 'filter'])) {
      return node;
    }
  }
  return null;
};


/**
 * @param {string} id
 * @return {boolean}
 * @private
 */
OptionsLayout.prototype.maybeProcessMenuCommand_ = function(id) {
  //  <a id='menu-move-up'>Move up</a>
  //  <a id='menu-move-down'>Move down</a>
  //  <a id='menu-dump'>Dump</a>
  //  <a id='menu-clone'>Clone</a>
  //  <a id='menu-delete'>Delete</a>

  var containerItem = this.getContainerItem_(this.lastPopupMenuMoreElm_);
  var container = containerItem.parentNode;

  if (id == 'menu-move-up') {
    var prevNode = containerItem.previousSibling;
    if (prevNode && !dom.classes.has(prevNode, OptionsLayout.Classes_.ADBLOCKER)) {
      container.insertBefore(containerItem, prevNode);
    }
    this.setSaved_(false);
  } else if (id == 'menu-move-down') {
    var nextNode = containerItem.nextSibling;
    if (nextNode) {
      container.insertBefore(containerItem, nextNode.nextSibling);
    }
    this.setSaved_(false);
  } else if (id == 'menu-dump') {
    var rule = this.getAndVerifyDisplayedRule_(containerItem);
    this.dumpRules_(rule);
    window.scrollTo(0, dom.$('dump-rules-output').offsetTop);
    return true;
  } else if (id == 'menu-clone') {
    var clonedItem = dom.clone(containerItem);
    container.insertBefore(clonedItem, containerItem.nextSibling);
    if (dom.classes.has(clonedItem, OptionsLayout.Classes_.ADBLOCKER)) {
      this.setupAdBlockerRuleElement_(clonedItem, false);
    }
    this.setSaved_(false);
    window.scrollTo(0, clonedItem.offsetTop);
    this.highlightElement_(clonedItem);
    return true;
  } else if (id == 'menu-delete') {
    container.removeChild(containerItem);
    this.setSaved_(false);
    return true;
  }

  return false;
};


/**
 * @private
 */
OptionsLayout.prototype.repositionPopupMenu_ = function() {
  var popupMenuElm = dom.$('popup-menu');

  if (this.lastPopupMenuMoreElm_) {
    popupMenuElm.style.display = '';

    var containerItem = this.getContainerItem_(this.lastPopupMenuMoreElm_);
    if (dom.classes.has(containerItem, OptionsLayout.Classes_.ADBLOCKER)) {
      popupMenuElm.className = 'adblocker';
    } else if (containerItem.parentNode == dom.$('rules-container')) {
      popupMenuElm.className = 'rule';
    } else {
      popupMenuElm.className = 'filter';
    }

    var rect = this.lastPopupMenuMoreElm_.getBoundingClientRect();
    var popupRect = popupMenuElm.getBoundingClientRect();
    popupMenuElm.style.top = (window.scrollY + rect.bottom) + 'px';
    popupMenuElm.style.left =
        Math.max(0, window.scrollX + rect.right - popupRect.width) + 'px';
  } else {
    popupMenuElm.style.display = 'none';
  }
};


/**
 * @return {boolean}
 * @private
 */
OptionsLayout.prototype.isSaved = function() {
  return this.saved_;
};


/**
 * @param {string=} opt_msg
 * @return {boolean}
 * @private
 */
OptionsLayout.prototype.checkSaved = function(opt_msg) {
  if (!this.saved_) {
    var result = confirm(opt_msg || dom.getMsg('save_changes'))
    if (result) {
      this.onSave_();
    }
    return result;
  }
  return true;
};


/**
 * @param {boolean} isSaved
 * @private
 */
OptionsLayout.prototype.setSaved_ = function(isSaved) {
  if (!isSaved) {
    var savedRulesJson = this.preferences_.getRulesJson();
    var currentRulesJson = this.getAndVerifyDisplayedRules_();

    if (savedRulesJson.length == currentRulesJson.length &&
        JSON.stringify(savedRulesJson) == JSON.stringify(currentRulesJson)) {
      isSaved = true;
    }
  }

  this.saved_ = isSaved;
  dom.attribute.enable(dom.$('save-changes'), 'disabled', this.saved_);

  if (!this.saved_) {
    var dumpRulesOutputElm = dom.$('dump-rules-output');
    dumpRulesOutputElm.style.display = 'none';
  }
};

//==============================================================================
(function() {
  var layout = new OptionsLayout();

  window.onbeforeunload = function() {
    if (!layout.isSaved()) {
      return dom.getMsg('discard_changes');
    }
  }
})();
