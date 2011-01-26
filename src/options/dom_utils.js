/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

var dom = {};

/**
 * @param {string} id
 * @return {?Node}
 */
dom.$ = function(id) {
  var elm = document.getElementById(id);
  if (!elm) {
    console.error('[PersonalizedWeb] WARNING: can not find element by ID=' + id);
  }
  return elm;
};


/**
 * @param {string} className
 * @param {Node=} opt_root
 * @return {!Array.<!Node>}
 */
dom.$$ = function(className, opt_root) {
  var elms = (opt_root || document).getElementsByClassName(className);
  if (!elms || !elms.length) {
    console.error('[PersonalizedWeb] WARNING: can not find any element by className=' + className);
  }
  return elms;
};


/**
 * @param {Node} node
 */
dom.removeChildren = function(node) {
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};


/**
 * @param {Node} element
 * @param {string} text
 */
dom.setTextContent = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == 3 /*text*/) {
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    dom.removeChildren(element);
    element.appendChild(document.createTextNode(text));
  }
};


/**
 * @param {string} str
 * @return {string}
 */
dom.htmlEscape = function(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;');
};


/**
 * @param {Node} elm DOM node to clone.
 * @return {Node}
 */
dom.clone = function(elm) {
  /** @type{!Array.<!Array.<string>>} */
  var TAGS_PROPERTIES_PAIRS = [
    ['textarea', 'value'],
    ['select', 'selectedIndex']
  ];

  var clonedElm = elm.cloneNode(true);

  for (var i = 0, pair; pair = TAGS_PROPERTIES_PAIRS[i]; ++i) {
    var origNodes = elm.getElementsByTagName(pair[0]);
    var clonedNodes = clonedElm.getElementsByTagName(pair[0]);

    var propName = pair[1];
    for (var j = 0; j < clonedNodes.length; ++j) {
      clonedNodes[j][propName] = origNodes[j][propName];
    }
  }

  return clonedElm;
};


/**
 * @param {string} messageName
 * @param {(string|Array.<string>)=} opt_args
 * @return {string}
 */
dom.getMsg = function(messageName, opt_args) {
  var result = chrome.i18n.getMessage(messageName, opt_args);
  if (!result) {
    console.error('[PersonalizedWeb] WARNING: i18n string not found: ' + messageName);
  }
  return result;
};
window['_getMsg'] = dom.getMsg;



//==============================================================================
// dom.classes
//==============================================================================



dom.classes = {};

/**
 * Gets an array of class names on an element
 * @param {Node} element DOM node to get class of.
 * @return {!Array.<string>} Class names on {@code element}.
 */
dom.classes.get = function(element) {
  var className = element.className;
  return (className && className.split(/\s+/)) || [];
};


/**
 * Adds a class or classes to an element. Does not add multiples of class names.
 * @param {Node} element DOM node to add class to.
 * @param {string} className Class name to add.
 */
dom.classes.add = function(element, className) {
  var classes = dom.classes.get(element);

  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == className) {
      return;
    }
  }

  classes.push(className);
  element.className = classes.join(' ');
};


/**
 * Removes a class or classes from an element.
 * @param {Node} element DOM node to remove class from.
 * @param {string} className Class name to remove.
 */
dom.classes.remove = function(element, className) {
  var classes = dom.classes.get(element);

  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == className) {
      classes.splice(i--, 1);
    }
  }

  element.className = classes.join(' ');
};


/**
 * @param {Node} element DOM node to swap classes on.
 * @param {string} class1 Class 1.
 * @param {string} class2 Class 2.
 */
dom.classes.switchBetween = function(element, class1, class2) {
  var classes = dom.classes.get(element);

  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == class1) {
      classes[i] = class2;
    } else if (classes[i] == class2) {
      classes[i] = class1;
    }
  }

  element.className = classes.join(' ');
};


/**
 * Returns true if an element has a class.
 * @param {Node} element DOM node to test.
 * @param {string} className Class name to test for.
 * @return {boolean} Whether element has the class.
 */
dom.classes.has = function(element, className) {
  var classes = dom.classes.get(element);

  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == className) {
      return true;
    }
  }

  return false;
};


/**
 * @param {Node} element DOM node to test.
 * @param {!Array.<string>} classNames Class names to test for.
 * @return {boolean} Whether element has the class.
 */
dom.classes.hasAny = function(element, classNames) {
  var classes = dom.classes.get(element);

  for (var i = 0; i < classes.length; i++) {
    if (classNames.indexOf(classes[i]) != -1) {
      return true;
    }
  }

  return false;
};


/**
 * Adds or removes a class depending on the enabled argument.
 * @param {Node} element DOM node to add or remove the class on.
 * @param {string} className Class name to add or remove.
 * @param {boolean} enabled Whether to add or remove the class (true adds,
 *     false removes).
 */
dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    dom.classes.add(element, className);
  } else {
    dom.classes.remove(element, className);
  }
};



//==============================================================================
// dom.attribute
//==============================================================================



dom.attribute = {};

/**
 * Adds or removes a boolean attribute for the element.
 * @param {Node} element DOM node to add or remove the attribute on.
 * @param {string} attrName Attribute name to add or remove.
 * @param {boolean} enabled Whether to add or remove the attribute (true adds,
 *     false removes).
 */
dom.attribute.enable = function(element, attrName, enabled) {
  if (enabled) {
    element.setAttribute(attrName, 'true');
  } else {
    element.removeAttribute(attrName);
  }
};
