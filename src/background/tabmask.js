/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @constructor
 */
var TabMask = function() {
  /**
   * @type {!Object.<number|string,number>}
   * @private
   */
  this.mask_ = {};
};


/**
 * @param {number} tabId
 */
TabMask.prototype.mask = function(tabId) {
  this.maybeClearCache_();
  this.mask_[tabId] = 1;
};


/**
 * @param {number} tabId
 * @return {boolean}
 */
TabMask.prototype.maybeUnmask = function(tabId) {
  if (this.mask_[tabId] == 1) {
    this.mask_[tabId] = 2;
    return true;
  }
  delete this.mask_[tabId];
  return false;
};


/**
 * @param {number} tabId
 * @return {boolean}
 */
TabMask.prototype.wasRecentlyMasked = function(tabId) {
  return !!this.mask_[tabId];
};


/**
 * @param {number} tabId
 */
TabMask.prototype.onTabClosed = function(tabId) {
  delete this.mask_[tabId];
};


/**
 * @private
 */
TabMask.prototype.maybeClearCache_ = function() {
  var count = 0;
  for (var p in this.mask_) {
    if (this.mask_[p] == 2) {
      delete this.mask_[p];
    } else {
      ++count;
    }
  }
  if (count > 10) {
    this.mask_ = {};
  }
};
