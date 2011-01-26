/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @type {boolean|undefined}
 * @const
 */
var FLAG_IN_TEST;

(function() { 

/**
 * @param {boolean=} opt_doNotInjectDocumentWrite
 * @constructor
 */
var ContentFilter = function(opt_doNotInjectDocumentWrite) {
  /**
   * @type {!Array.<Object>}
   * @private
   */
  this.filterRules_ = [];

  /**
   * @type {string}
   * @private
   */
  this.css_ = '';

  /**
   * @type {string}
   * @private
   */
  this.html_ = '';

  /**
   * @type {string}
   * @private
   */
  this.js_ = '';

  /**
   * @type {boolean}
   * @private
   */
  this.isOverriddenDocumentWriteInjected_ = !!opt_doNotInjectDocumentWrite;

  /**
   * @type {boolean}
   * @private
   */
  this.documentLoaded_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.webPageWasModified_ = false;

  /**
   * @type {?Function}
   * @private
   */
  this.onModifiedCallback_ = null;
};


/**
 * @param {Array.<string|RegExp>|string} opt_tag
 * @param {Array.<string|RegExp>|string} opt_class
 * @param {Array.<string>|string} opt_attr
 * @param {Array.<string|RegExp>|string} opt_value
 * @param {Node=} opt_root
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.filter = function(opt_tag, opt_class, opt_attr, opt_value, opt_root) {
  var tagNames = this.splitArgument_(opt_tag);
  var classNames = this.splitArgument_(opt_class);
  var attributes = this.splitArgument_(opt_attr);
  var values = this.splitArgument_(opt_value);

  for (var i = 0; i < tagNames.length; ++i) {
    if (tagNames[i] == '*') {
      tagNames[i] = null;
    }
    for (var j = 0; j < classNames.length; ++j) {
      for (var k = 0; k < attributes.length; ++k) {
        for (var m = 0; m < values.length; ++m) {
          if (attributes[k] && (typeof attributes[k] != 'string')) {
            console.log('[PersonalizedWeb] ERROR in [filter]: opt_attr should be empty or string: ' + (typeof attributes[k]));
            continue;
          }

          if (attributes[k] && /^class(Name)?$/i.test(attributes[k])) {
            if (j == 0) { // Prevent duplicates.
              // console.log('[PersonalizedWeb] Add filter: ' +
              //             'tagName=' + tagNames[i] +
              //             ', className=' + values[m]);
              this.filterRules_.push({
                tagName: tagNames[i],
                className: values[m],
                attribute: null,
                value: null,
                root: opt_root
              });
            }
          } else {
            // console.log('[PersonalizedWeb] Add filter: ' +
            //             'tagName=' + tagNames[i] +
            //             ', className=' + classNames[j] +
            //             ', attribute=' + attributes[k] +
            //             ', value=' + values[m]);
            this.filterRules_.push({
              tagName: tagNames[i],
              className: classNames[j],
              attribute: attributes[k],
              value: values[m],
              root: opt_root
            });
          }
        }
      }
    }
  }
  return this;
};


/**
 * @param {Array.<string|RegExp>|string} ids
 * @param {Node=} opt_root
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.filterByIds = function(ids, opt_root) {
  ids = [].concat(ids);
  var len = ids.length;
  for (var i = 0; i < len; ++i) {
    var id = ids[i];
    if (id) {
      this.filterRules_.push({
        tagName: null,
        className: null,
        attribute: 'id',
        value: id,
        root: opt_root
      });
    }
  }
  return this;
};


/**
 * @param {string} css
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.addCss = function(css) {
  if (css) {
    this.css_ += css;
  }
  return this;
};


/**
 * @param {string} html
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.addHtml = function(html) {
  if (html) {
    this.html_ += html;
  }
  return this;
};


/**
 * @param {string} js
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.addJs = function(js) {
  if (js) {
    this.js_ += js;
  }
  return this;
};


/**
 * @param {?Function} callback
 * @return {!ContentFilter} Instance of this class.
 */
ContentFilter.prototype.setOnModifiedCallback = function(callback) {
  this.onModifiedCallback_ = callback;
  return this;
};


/**
 * Main entry point. Runs the filter, adds the listeners.
 */
ContentFilter.prototype.run = function() {
  /** @type {!ContentFilter} */
  var self = this;

  /** @type {number} */
  var start = Date.now();

  /**
   * This is used to eliminate duplicated DOMNodeInserted and
   * DOMNodeInsertedIntoDocument events for the same node.
   * @type {?Node}
   */
  var lastInsertedNode = null;

  function onDomNodeInserted(e) {
    var node = e.target;
    if ((node instanceof HTMLElement) && node != lastInsertedNode) {
      lastInsertedNode = node;
      self.maybeRunFiltersForNode_(node);
    }
  }

  document.addEventListener('DOMNodeInserted', onDomNodeInserted, true);
  document.addEventListener('DOMNodeInsertedIntoDocument', onDomNodeInserted, true);

  document.addEventListener('load', function(e) {
    self.maybeRunFiltersForNode_(e.target);
  }, true);

  window.addEventListener('DOMContentLoaded', function() {
    console.log('[PersonalizedWeb] DOMContentLoaded. Passed: ' +
                (Date.now() - start) + ' msec.');
    self.applyAllModificationsToPage_();
  }, true);

  window.addEventListener('load', function() {
    self.documentLoaded_ = true;
    self.applyAllModificationsToPage_();
    console.log('[PersonalizedWeb] Window loaded. Passed: ' +
                (Date.now() - start) + ' msec.');
  }, true);

  window.addEventListener('beforeload', function(e) {
    // We also check the parent node in case if the active content that is about
    // to be loaded is wrapped into a hyper link that should be filtered.
    var node = e.target;
    if (self.maybeFilter_(node && node.parentNode) || self.maybeFilter_(node)) {
      e.preventDefault();
      console.log('[PersonalizedWeb] ===> REMOVED BEFORE LOADING!');
    }
  }, true);

  window.addEventListener('ModificationEvent', function() {
    self.setWebPageWasModified_();
  }, true);
  
  this.applyAllModificationsToPage_();

  // WARNING: Do not pass document.documentElement as the argument, since we
  // should always inject under the HEAD or BODY elements. Otherwise, some
  // subtle bugs were discovered (as subtle as race conditions) when the 
  // injected <script> tag was a sibling to <head> and <body>.
  this.maybeInjectOverriddenDocumentWrite_(document.head);
};


/**
 * 
 */
ContentFilter.prototype.forceRun = function() {
  if (!this.documentLoaded_) {
    this.documentLoaded_ = true;
    this.applyAllModificationsToPage_();
  }
};

//============================================================================

/**
 * @private
 */
ContentFilter.prototype.applyAllModificationsToPage_ = function() {
  console.log('[PersonalizedWeb] document.readyState = ' + document.readyState);

  this.runAllFilters_(document);
  this.addGlobalCssStyles_();
  this.addGlobalHtml_();

  // We should not execute JS until the DOM is loaded.
  if (this.documentLoaded_ || document.readyState == 'complete' || document.readyState == 'loaded') {
    this.documentLoaded_ = true;
    this.addGlobalJs_();
  }
};


/**
 * @param {!Document} doc
 * @param {Node=} opt_root
 * @return {!Array.<!Node>}
 * @private
 */
ContentFilter.prototype.findIframesWithEmptySrc_ = function(doc, opt_root) {
  var result = [];

  var frameNodes = (opt_root || doc).getElementsByTagName('IFRAME');
  if (opt_root && opt_root.nodeName.toLowerCase() == 'iframe') {
    frameNodes = [opt_root].concat(frameNodes);
  }

  for (var i = 0, frameNode; frameNode = frameNodes[i]; ++i) {
    var src = frameNode.src;
    if (!src || /^(?:about:blank|javascript:.*)$/i.test(src)) {
      result.push(frameNode);
    }
  }

  return result;
};


/**
 * @param {!Document} doc
 * @param {Node=} opt_root
 * @private
 */
ContentFilter.prototype.runAllFilters_ = function(doc, opt_root) {
  if (opt_root && !opt_root.getElementsByClassName) {
    return;
  }

  console.log('[PersonalizedWeb] Running all filters...' +
              (opt_root ? ' (under ' + opt_root + ')' : ''));

  var toRemove = [];

  // Used as a cache while iterating.
  var cachedSearchesByTagName = {};
  var cachedSearchesByClassName = {};

  for (var i = 0, rule; rule = this.filterRules_[i]; ++i) {
    if (opt_root && this.matchesToFilterRule_(opt_root, rule)) {
      console.log('[PersonalizedWeb] ===> Removing opt_root!');
      this.removeNode_(opt_root);
      return;
    }

    var parent = rule.root || doc;
    if (opt_root && this.contains_(parent, opt_root)) {
      parent = opt_root;
    }

    var nodes;
    if (rule.attribute == 'id' && (typeof rule.value == 'string')) {
      var elm = doc.getElementById(rule.value);
      nodes = (elm && this.contains_(parent, elm)) ? [elm] : [];
    } else if (rule.className && (typeof rule.className == 'string')) {
      var className = rule.className;
      nodes = (cachedSearchesByClassName[className] =
               cachedSearchesByClassName[className] || parent.getElementsByClassName(className));
    } else {
      var tagName;
      if (rule.tagName && (typeof rule.tagName == 'string')) {
        tagName = rule.tagName;
      } else {
        tagName = '*';
        console.log('[PersonalizedWeb] WARNING: possible performance issues.\n' +
          '====> tagName:' + rule.tagName +
          ', className:' + rule.className +
          ', attribute:' + rule.attribute +
          ', value:' + rule.value +
          ', root:' + rule.root
        );
      }
      nodes = (cachedSearchesByTagName[tagName] =
               cachedSearchesByTagName[tagName] || parent.getElementsByTagName(tagName));
    }

    for (var j = 0, node; node = nodes[j]; ++j) {
      if (this.matchesToFilterRule_(node, rule)) {
        toRemove.push(node);
      }
    }
  }

  for (var i = 0, elm; elm = toRemove[i]; ++i) {
    this.removeNode_(elm);
  }

  /** @type {!ContentFilter} */
  var self = this;

  // TODO(aandrey): Inject the content-script directly after http://crbug.com/20773 is fixed.

  // Run manually filters in the iframes with empty source, since
  // content scripts are not embedded into those iframes.
  this.findIframesWithEmptySrc_(doc, opt_root).forEach(function(iframeNode) {
    console.log('[PersonalizedWeb] ===> Running inside an empty IFRAME node, src=' + iframeNode.src);
    /** @preserveTry */
    try {
      var iframeDoc = iframeNode.contentDocument
      if (iframeDoc) {
        self.runAllFilters_(iframeDoc);
      }
    } catch (e) {
      console.error('[PersonalizedWeb] Failed to get the contentWindow from an iframe. (Cross-Domain policy?) ' + e);
    }
  });
};


/**
 * @param {!Node} node
 * @param {!Object} rule
 * @private
 */
ContentFilter.prototype.matchesToFilterRule_ = function(node, rule) {
  var tagName = node.nodeName.toLowerCase();
  var className = node.className;

  var matchesClassName = this.matches_(rule.className, className);
  if (!matchesClassName) {
    if (className && (typeof className == 'string') && /\s/.test(className)) {
      var classNames = this.splitArgument_(className, /\s+/);
      for (var i = 0; className = classNames[i]; ++i) {
        if (this.matches_(rule.className, className)) {
          matchesClassName = true;
          break;
        }
      }
    }
  }

  return matchesClassName &&
         this.matches_(rule.tagName, tagName) &&
         this.contains_(rule.root, node) &&
         this.hasAttribute_(node, rule.attribute, rule.value);
};


/**
 * @param {!Node} node
 * @param {string} attribute
 * @param {string|RegExp} valueStrOrRegex
 * @private
 */
ContentFilter.prototype.hasAttribute_ = function(node, attribute, valueStrOrRegex) {
  if (!attribute) {
    return true; // No attribute to check.
  }
  var actualValue = (node.getAttribute && node.getAttribute(attribute)) || node[attribute];
  return (valueStrOrRegex ?
          this.matches_(valueStrOrRegex, actualValue) :
          !actualValue);
};


/**
 * @param {string|RegExp} strOrRegex
 * @param {?string=} value
 * @private
 */
ContentFilter.prototype.matches_ = function(strOrRegex, value) {
  if (strOrRegex) {
    value = value || '';
    if (typeof strOrRegex == 'string') {
      return (strOrRegex.toLowerCase() == value.toLowerCase());
    } else {
      return strOrRegex.test(value);
    }
  }
  return true;
};


/**
 * @param {?Node} parent
 * @param {?Node} child
 * @private
 */
ContentFilter.prototype.contains_ = function(parent, child) {
  if (!parent || parent == document || parent == document.body) {
    return true; // Default parent is root.
  }
  for (; child; child = child.parentNode) {
    if (child == parent) {
      return true;
    }
  }
  return false;
};


/**
 * @const
 */
ContentFilter.EMBED_FUNC_ = function(win, doc) {
  console.log('[PersonalizedWeb] Inside ContentFilter.EMBED_FUNC_');

  var modificationEventSent = false;

  // Examples:
  // - http://maps.gstatic.com/...
  // - http://maps.google.com/...
  // - http://api.recaptcha.net/...
  // - http://api-maps.yandex.ru/...
  // - http://www.google.com/uds/api/visualization/1.0/e9f5bea2f5fcf88c5d872773ba55a57c/default,geomap.I.js
  // - http://www.google.com/uds/?file=visualization&v=1&packages=geomap
  var regexExclScript =
    /<script[^>]*\ssrc\s*=\s*['"]?(?:\/?\w+[\/'"\?#]|https?:\/[^'"\?#]*[_\.\/-](?:api|maps|google\.com\/uds)[_\.\/-])/i;
  var lastExclScriptElm = null;

  var regexExcl = /<embed[^>]*\ssrc\s*=\s*['"]?(?:\/?\w+[\/'"\?#]|https?:\/\/(?:\w+\.(ytimg|youtube)\.com)\/)/i;

  var regex0 = /<(script|iframe|object|embed)\b[^>]*\/>/ig;
  var regex1 = /<(script|iframe|object|embed)\b.*?<\/\1>/ig;
  var regex2 = /<(script|iframe|object|embed)\b/ig;
  var regex3 = /<\/(?:script|iframe|object|embed)>/ig;

  function shouldBypassFilter() {
    var elms = doc.getElementsByTagName('script');
    var scriptElm = elms.length ? elms[elms.length - 1] : null;
    if (scriptElm) {
      if (scriptElm == lastExclScriptElm || regexExclScript.test(scriptElm.outerHTML)) {
        lastExclScriptElm = scriptElm;
        return true;
      }
    }
    return false;
  }

  function filter(str) {
    // Checks if we have intercepted the document.write() call from a script node
    // that we previously allowed to bypass our filter. In this case we allow
    // all document.write() calls from this code to execute.
    if (shouldBypassFilter()) {
      console.log('[PersonalizedWeb] SKIPING: ' + str);
      return str;
    }
  
    // Check if this code is an exception that we should allow to execute.
    if (regexExclScript.test(str) || regexExcl.test(str)) {
      console.log('[PersonalizedWeb] EXCEPTION FOR: ' + str);
      return str;
    }

    var origStr = str;

    str = str.replace(regex0, '');
    str = str.replace(regex1, '');
    str = str.replace(regex2, '<!-- $1');
    str = str.replace(regex3, '$& <!-- -->');

    if (!modificationEventSent && origStr != str) {
      console.log('[PersonalizedWeb] SENDING ON_MODIFICATION EVENT: ' + origStr);

      modificationEventSent = true;
      var evt = doc.createEvent('Events');
      evt.initEvent('ModificationEvent', true, true);
      win.dispatchEvent(evt);
    }

    if (origStr != str) {
      console.log('[PersonalizedWeb] INTERCEPTED document.write: ' + origStr);
    }

    return str;
  };

  var origWrite = doc.write;
  doc.write = function(str) {
    str = filter(str);
    if (str) origWrite.call(doc, str);
  };
  doc.writeln = function(str) {
    doc.write(str + '\n');
  };

/*
  function wrapWithFilteredInnerHtml(elm, innerHtmlFilter) {
    /** constructor * /
    function Wrapper() {};
    Wrapper.prototype = elm;

    var wrappedElm = new Wrapper();
    Object.defineProperty(wrappedElm, 'innerHTML', {
      'set': function(html) {

        console.log("=======================>INTERCEPTED innerHTML call: " + html);

//        var html1 = innerHtmlFilter(html);
//        if (html1 != html) {
//          console.log("=======================>FILTERED innerHTML call: " + html);
//        } else {
//          console.log("=======================>PASSED THROUGH innerHTML call: " + html);
//        }

        elm.innerHTML = html;

      },
      'get': function() {
        return elm.innerHTML;
      }
    });
    return wrappedElm;
  }

  var origGetElementById = doc.getElementById;
  doc.getElementById = function(id) {
    console.log("=======================>INTERCEPTED document.getElementById: " + id);
    var elm = origGetElementById.call(doc, id);
    if (elm) {
      elm = wrapWithFilteredInnerHtml(elm, filter);
    }
    return elm;
  }
*/

  console.log('[PersonalizedWeb] Exiting ContentFilter.EMBED_FUNC_');
};


/**
 * @param {?Node} parent
 * @private
 */
ContentFilter.prototype.maybeInjectOverriddenDocumentWrite_ = function(parent) {
  if (!this.isOverriddenDocumentWriteInjected_ && parent) {
    console.log('[PersonalizedWeb] Embedding custom document.write method.');
    this.isOverriddenDocumentWriteInjected_ = true;

    var scriptElm = document.createElement('script');
    var scriptText = '(' + ContentFilter.EMBED_FUNC_ + ')(window,document)';

    scriptElm.appendChild(document.createTextNode(scriptText));

    /** @preserveTry */
    try {
      parent.appendChild(scriptElm);
    } catch (e) {
      this.isOverriddenDocumentWriteInjected_ = false;
      console.log('[PersonalizedWeb] FAILED! ' + e);
    }
  }
};


/**
 * @param {?Node} node
 * @return {boolean} True, if the node was removed from the document.
 * @private
 */
ContentFilter.prototype.maybeFilter_ = function(node) {
  if (node) {
    for (var i = 0, rule; rule = this.filterRules_[i]; ++i) {
      if (this.matchesToFilterRule_(node, rule)) {
        this.removeNode_(node);
        return true;
      }
    }
  }
  return false;
};


/**
 * @param {?Node} node
 * @private
 */
ContentFilter.prototype.maybeRunFiltersForNode_ = function(node) {
  if (node && !this.maybeFilter_(node)) {
    if (this.documentLoaded_) {
      this.runAllFilters_(document, node /*opt_root*/);
    }

    this.maybeInjectOverriddenDocumentWrite_(document.head || node);
  }
};


/**
 * @param {!Node} node
 * @private
 */
ContentFilter.prototype.removeNode_ = function(node) {
  var parent = node.parentNode;
  if (parent) {
    console.log('[PersonalizedWeb] ===> Removing node ' + node.nodeName +
                (node.src ? ', src=' + node.src : ''));

    var nodeName = node.nodeName;
    parent.removeChild(node);
    this.setWebPageWasModified_();

    // Special case for <object> tags.
    if (nodeName.toLowerCase() == 'embed' &&
        parent.nodeName.toLowerCase() == 'object') {
      this.removeNode_(parent);
    }
  } else {
    console.log('[PersonalizedWeb] WARNING! Failed to remove node: ' + node.innerHTML);
  }
};


/**
 * @param {?Array.<string|RegExp>|string} opt_arg
 * @param {!RegExp=} opt_splitRe
 * @return {!Array.<string|RegExp>}
 * @private
 */
ContentFilter.prototype.splitArgument_ = function(opt_arg, opt_splitRe) {
  var result = [];

  var args = [].concat(opt_arg);
  for (var i = 0; i < args.length; ++i) {
    if (args[i] && (typeof args[i] == 'string')) {
      result = result.concat(args[i].split(opt_splitRe || /\s*,\s*/));
    } else {
      result.push(args[i]);
    }
  }

  for (var i = 0; i < result.length; ++i) {
    if (result[i] && (typeof result[i] == 'string')) {
      result[i] = result[i].replace(/^\s+|\s+$/g, ''); // trim()
    } else if (!result[i]) {
      result[i] = ''; // Treat null, undefined and empty string the same.
    }
  }

  // Eliminate duplicates.
  result.sort(function(a, b) { return (a < b) ? -1 : 1; });

  for (var i = 0, len = 0; i < result.length; ++i) {
    if (result[i] && (!len || result[len - 1] != result[i])) {
      result[len++] = result[i];
    }
  }
  result.length = len || 1; // Return [''] instead of [].

  return result;
};


/**
 * @private
 */
ContentFilter.prototype.addGlobalCssStyles_ = function() {
  var parent = document.getElementsByTagName('head')[0] || document.documentElement;
  if (this.css_ && parent) {
    var css = this.css_;
    this.css_ = '';

    console.log('[PersonalizedWeb] Adding custom CSS');

    /** @preserveTry */
    try {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      parent.appendChild(style);
      this.setWebPageWasModified_();
    } catch (e) {
      this.css_ = css;
      console.log('[PersonalizedWeb] FAILED! ' + e);
    }
  }
};


/**
 * @private
 */
ContentFilter.prototype.addGlobalHtml_ = function() {
  var parent = document.body;
  if (this.html_ && parent) {
    var html = this.html_;
    this.html_ = '';

    console.log('[PersonalizedWeb] Adding custom HTML');

    /** @preserveTry */
    try {
      var div = document.createElement('div');
      div.innerHTML = html;

      var childNodes = [];
      for (var node = div.firstChild; node; node = node.nextSibling) {
        childNodes.push(node);
      }

      var jsNodes = [];
      for (var i = 0, node; node = childNodes[i]; ++i) {
        // We need to create <script> nodes explicitly to execute the code.
        if ((node.nodeName && node.nodeName.toLowerCase() == 'script') &&
            (!node.type || node.type.toLowerCase() === 'text/javascript')) {
          var jsCode = node.text || node.textContent || node.innerHTML;
          // To be executed later.
          jsNodes.push({
            src: node.src,
            jsCode: jsCode
          });
        } else {
          parent.appendChild(node);
        }
      }

      if (jsNodes.length) {
        new ScriptsInjector(jsNodes).run(parent);
      }

      this.setWebPageWasModified_();
    } catch (e) {
      this.html_ = html;
      console.log('[PersonalizedWeb] FAILED! ' + e);
    }
  }
};


/**
 * Adds custom JS code only after the custom HTML code has been added.
 * @private
 */
ContentFilter.prototype.addGlobalJs_ = function() {
  if (!this.html_ && this.js_) {
    var js = this.js_;
    this.js_ = '';

    /** @preserveTry */
    try {
      eval(js);
      this.setWebPageWasModified_();
    } catch (e) {
      // Preserve the message log.
      window['console']['error']('[PersonalizedWeb] Exception in custom JS code.\n  ' + e);
    }
  }
};


/**
 * @private
 */
ContentFilter.prototype.setWebPageWasModified_ = function() {
  if (!this.webPageWasModified_) {
    this.webPageWasModified_ = true;

    if (this.onModifiedCallback_) {
      console.log('[PersonalizedWeb] Sending onModified event...');
      this.onModifiedCallback_();
    }
  }
};


/**
 * @return {boolean}
 */
ContentFilter.prototype.isWebPageModified = function() {
  return this.webPageWasModified_;
};



//=============================================================================
// Scripts Injector
//=============================================================================

/**
 * @param {!Array.<{src: ?string, jsCode: ?string}>} scripts
 * @constructor
 */
var ScriptsInjector = function(scripts) {
  /**
   * @type {!Array.<{src: ?string, jsCode: ?string}>}
   * @private
   */
  this.scripts_ = scripts;
};


/**
 * @param {!Node} parent
 * @throws exception
 */
ScriptsInjector.prototype.run = function(parent) {
  var scripts = this.scripts_;
  var alreadyInjected = 0;

  function iterator() {
    while (1) {
      var scriptInfo = scripts[alreadyInjected++];
      if (!scriptInfo) {
        break;
      }
      if (scriptInfo.src) {
        ScriptsInjector.injectJsNode(parent, scriptInfo.src, null /*jsCode*/, iterator);
        break;
      } else {
        ScriptsInjector.injectJsNode(parent, null /*src*/, scriptInfo.jsCode);
      }
    }
  }

  iterator();
};


/**
 * @param {!Node} parent
 * @param {?string=} src
 * @param {?string=} jsCode
 * @param {Function=} opt_callback
 * @throws exception
 */
ScriptsInjector.injectJsNode = function(parent, src, jsCode, opt_callback) {
  var scriptElm = document.createElement('script');
  scriptElm.type = 'text/javascript';
  if (src) {
    scriptElm.src = src;
  } else if (jsCode) {
    scriptElm.appendChild(document.createTextNode(jsCode));
  }

  if (opt_callback) {
    var done = false;
    // Attach handlers.
    scriptElm.onload = scriptElm.onreadystatechange = function() {
      if (!done && (!this.readyState ||
                    this.readyState == 'loaded' ||
                    this.readyState == 'complete'))
      {
        done = true;
        opt_callback();
        scriptElm.onload = scriptElm.onreadystatechange = null;
      }
    };
  }

  parent.appendChild(scriptElm);
};



//=============================================================================
// Main entry point
//=============================================================================

/**
 * @type {?ContentFilter}
 */
var contentFilter = null;


/**
 * Sends the modification event back to the background page.
 */
function sendModifiedEvent() {
  chrome.extension.sendRequest({'modifiedEvent': true});
}


/**
 * @param {Object=} rule
 * @param {boolean=} opt_isDisabled
 */
function runContentFilter(rule, opt_isDisabled) {
  if (contentFilter) {
    console.log('[PersonalizedWeb] Content script is already running. IGNORING!');
    
    contentFilter.forceRun();

    if (contentFilter.isWebPageModified()) {
      sendModifiedEvent();
    }
    return;
  }

  if (opt_isDisabled) {
    // Create a content script, but do not call #run().
    // All subsequent requests will be ignored.
    contentFilter = new ContentFilter();
    return;
  }

  if (!rule) {
    return;
  }

  contentFilter = new ContentFilter(rule['preserveDocWrite']);

  var filterRules = rule['filters'] || [];
  for (var i = 0, filterRule; filterRule = filterRules[i]; ++i) {
    var values = [];
    if (filterRule['value']) {
      values.push(filterRule['value']);
    }
    if (filterRule['valueRegex']) {
      /** @preserveTry */
      try {
        values.push(new RegExp(filterRule['valueRegex'], 'i'));
      } catch (e) {}
    }

    // opt_tag, opt_class, opt_attr, opt_value, opt_root
    contentFilter.filter(filterRule['tags'], null, filterRule['attribute'], values);
  }

  contentFilter
    .addCss(rule['css'])
    .addHtml(rule['html'])
    .addJs(rule['js'])
    .setOnModifiedCallback(sendModifiedEvent)
    .run();
}


/**
 * @type {string}
 * @const
 */
var url = window.location.href;

if (window == top) {
  console.log('[PersonalizedWeb] RUNNING on top: ' + url);
  chrome.extension.onRequest.addListener(function(msg, sender) {
    console.log('[PersonalizedWeb] Received a request for the top page from: ' + sender.id);
    runContentFilter(msg['rule'], msg['disabled']);
  });
} else {
  console.log('[PersonalizedWeb] RUNNING in iframe: ' + url);
  chrome.extension.sendRequest({'url': url}, function(rule) {
    console.log('[PersonalizedWeb] Received a request for an iframe.');
    runContentFilter(rule);
  });
}

if (FLAG_IN_TEST) {
  window['ContentFilter'] = ContentFilter;
}

})();
