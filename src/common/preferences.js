/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @constructor
 */
var Preferences = function() {
  /**
   * @type {string}
   * @private
   */
  this.adBlockerJsonText_ = '';

  /**
   * @type {string}
   * @private
   */
  this.manifestJsonText_ = '';
};


/**
 * @enum {string}
 * @private
 */
Preferences.Ids_ = {
  OPEN_TABS_TO_THE_RIGHT: 'aaa.pweb.tabopen',
  SHOW_PAGE_ACTION: 'aaa.pweb.show_page_action',
  FILTERS_JSON: 'aaa.pweb.filters',
  FILTERS_UPDATE_TIME: 'aaa.pweb.filters_update_time',
  PWEB_PROVIDER_INFO: 'aaa.pweb.prv_info'
};


/**
 * @type {string}
 * @private
 */
Preferences.ADBLOCKER_RULES_FILE_ = 'adblocker_rules.json';


/**
 * @type {string}
 * @private
 */
Preferences.MANIFEST_FILE_ = 'manifest.json';


/**
 * @return {boolean}
 */
Preferences.prototype.getOpenTabsToTheRight = function() {
  return !!this.getPreference_(Preferences.Ids_.OPEN_TABS_TO_THE_RIGHT);
};


/**
 * @param {boolean} value
 */
Preferences.prototype.setOpenTabsToTheRight = function(value) {
  this.setPreference_(Preferences.Ids_.OPEN_TABS_TO_THE_RIGHT, value);
};


/**
 * @return {boolean}
 */
Preferences.prototype.getShowPageAction = function() {
  return !!this.getPreference_(Preferences.Ids_.SHOW_PAGE_ACTION, true);
};


/**
 * @param {boolean} value
 */
Preferences.prototype.setShowPageAction = function(value) {
  this.setPreference_(Preferences.Ids_.SHOW_PAGE_ACTION, value);
};


/**
 * @return {number}
 */
Preferences.prototype.getFiltersUpdateTime = function() {
  return (/** @type {?number} */
    this.getPreference_(Preferences.Ids_.FILTERS_UPDATE_TIME)
  ) || 0;
};


/**
 * @return {!Array.<pweb.Rule>}
 */
Preferences.prototype.getRulesJson = function() {
  var rules = (/** @type {?Array.<pweb.Rule>} */
      this.getPreference_(Preferences.Ids_.FILTERS_JSON)) || [];
  var adBlockerRules = this.getAdBlockerFiltersJson();
  this.maybePrependAdBlockerRules_(rules, adBlockerRules[0]);
  return rules;
};


/**
 * @param {!Array.<pweb.Rule>} value
 */
Preferences.prototype.setRulesJson = function(value) {
  this.setPreference_(Preferences.Ids_.FILTERS_JSON, value);
  this.setPreference_(Preferences.Ids_.FILTERS_UPDATE_TIME, Date.now());
};


/**
 * @return {!Object.<string, pweb.ProviderInfo>}
 */
Preferences.prototype.getRulesProviderInfo = function() {
  var info = (/** @type {!Object.<string, pweb.ProviderInfo>} */
      this.getPreference_(Preferences.Ids_.PWEB_PROVIDER_INFO), {});
  return info;
};


/**
 * @param {string} id
 * @param {!pweb.ProviderInfo=} opt_info
 */
Preferences.prototype.registerRulesProvider = function(id, opt_info) {
  var rulesProviderInfo = this.getRulesProviderInfo();
  var changed = false;

  if (rulesProviderInfo[id]) {
    if (opt_info) {
      changed = true;
      rulesProviderInfo[id] = opt_info;
    }
  } else {
    changed = true;
    rulesProviderInfo[id] = opt_info || {
      'enabled': false // External rules are disabled by default.
    };
  }

  if (changed) {
    this.setPreference_(Preferences.Ids_.PWEB_PROVIDER_INFO, rulesProviderInfo);
  }
};


/**
 * @return {!Array.<pweb.Rule>}
 */
Preferences.prototype.getAdBlockerFiltersJson = function() {
  this.adBlockerJsonText_ = this.adBlockerJsonText_ ||
                            this.readJsonFile_(Preferences.ADBLOCKER_RULES_FILE_);
  return /** @type {!Array.<pweb.Rule>} */ (
    (this.adBlockerJsonText_ && JSON.parse(this.adBlockerJsonText_)) || []
  );
};


/**
 * @return {!Object} value
 */
Preferences.prototype.getManifestJson = function() {
  this.manifestJsonText_ = this.manifestJsonText_ ||
                           this.readJsonFile_(Preferences.MANIFEST_FILE_);
  return /** @type {!Object} */ (
    (this.manifestJsonText_ && JSON.parse(this.manifestJsonText_)) || {}
  );
};

//============================================================================

/**
 * @param {string} name
 * @param {*=} opt_defaultValue
 * @return {*}
 * @private
 */
Preferences.prototype.getPreference_ = function(name, opt_defaultValue) {
  var value = window['localStorage'][name];
  if (value) {
    value = JSON.parse(value);
  } else {
    value = opt_defaultValue;
  }
  return value;
};


/**
 * @param {string} name
 * @param {*} value
 * @private
 */
Preferences.prototype.setPreference_ = function(name, value) {
  window['localStorage'][name] = JSON.stringify(value);
};


/**
 * @param {string} name
 * @return {string}
 * @private
 */
Preferences.prototype.readJsonFile_ = function(name) {
  var content;

  var xhr = new XMLHttpRequest(); 
  xhr.open('GET', chrome.extension.getURL(name), false); 
  xhr.onreadystatechange = function() { 
    if (this.readyState == 4) { 
      content = this.responseText;
    } 
  }; 
  xhr.send(); 

  return content || '';
};


/**
 * @param {!Array.<pweb.Rule>} rules
 * @param {pweb.Rule} adBlockerRule
 * @private
 */
Preferences.prototype.maybePrependAdBlockerRules_ = function(rules, adBlockerRule) {
  if (!rules.length || rules[0]['name'] != adBlockerRule['name']) {
    // Adding the AdBlocker rule.
    adBlockerRule['enabled'] = false; // Requires opt-in.
    rules.splice(0, 0, adBlockerRule);
  } else {
    // Updating the AdBlocker rule.
    var mutableFields = ['enabled', 'urlRegex', 'urlExcludeRegex'];
    for (var i = 0, field; field = mutableFields[i]; ++i) {
      if (typeof rules[0][field] != 'undefined') {
        adBlockerRule[field] = rules[0][field];
      }
    }
    rules.splice(0, 1, adBlockerRule); // Rewrite.
  }
};
