/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

function B(a){return document.getElementById(a)}function C(a,b){return(b||document).getElementsByClassName(a)}function D(a){for(var b;b=a.firstChild;)a.removeChild(b)}function E(a,b){if("textContent"in a)a.textContent=b;else if(a.firstChild&&a.firstChild.nodeType==3){for(;a.lastChild!=a.firstChild;)a.removeChild(a.lastChild);a.firstChild.data=b}else{D(a);a.appendChild(document.createTextNode(b))}}
function F(a){for(var b=[["textarea","value"],["select","selectedIndex"]],c=a.cloneNode(true),e=0,g;g=b[e];++e){var h=a.getElementsByTagName(g[0]),d=c.getElementsByTagName(g[0]);g=g[1];for(var f=0;f<d.length;++f)d[f][g]=h[f][g]}return c}function G(a,b){return chrome.i18n.getMessage(a,b)}window._getMsg=G;function J(a){return(a=a.className)&&a.split(/\s+/)||[]}function K(a,b){for(var c=J(a),e=0;e<c.length;e++)if(c[e]==b)return;c.push(b);a.className=c.join(" ")}
function L(a,b){for(var c=J(a),e=0;e<c.length;e++)c[e]==b&&c.splice(e--,1);a.className=c.join(" ")}function M(a,b){a=J(a);for(var c=0;c<a.length;c++)if(a[c]==b)return true;return false}function N(a,b){a=J(a);for(var c=0;c<a.length;c++)if(b.indexOf(a[c])!=-1)return true;return false}function O(a,b,c){c?a.setAttribute(b,"true"):a.removeAttribute(b)};
