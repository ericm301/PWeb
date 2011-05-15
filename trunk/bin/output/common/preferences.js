/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

function l(){this.Y=this.l=""}function m(a){return!!t(a,"aaa.pweb.show_page_action",true)}function u(a){return t(a,"aaa.pweb.filters_update_time")||0}function v(a){var b=t(a,"aaa.pweb.filters")||[];a.l=a.l||aa(a,"adblocker_rules.json");a=(a.l&&JSON.parse(a.l)||[])[0];if(!b.length||b[0].name!=a.name){a.enabled=false;b.splice(0,0,a)}else{for(var c=["enabled","urlRegex","urlExcludeRegex"],e=0,g;g=c[e];++e)if(typeof b[0][g]!="undefined")a[g]=b[0][g];b.splice(0,1,a)}return b}
function t(a,b,c){return a=(a=window.localStorage[b])?JSON.parse(a):c}function w(a,b,c){window.localStorage[b]=JSON.stringify(c)}function aa(a,b){var c;a=new XMLHttpRequest;a.open("GET",chrome.extension.getURL(b),false);a.onreadystatechange=function(){if(this.readyState==4)c=this.responseText};a.send();return c||""};
