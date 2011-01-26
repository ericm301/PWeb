(function() {
<!-- Setup tests framework -->
  var AD_BLOCKER_RULE =

{"name":"Standard AdBlocker","urlRegex":"^http://","urlExcludeRegex":"","enabled":true,"preserveDocWrite":false,"css":"","html":"","js":"","filters":[{"tags":"div,table","attribute":"id,class","value":"","valueRegex":"([-_]|\\b)(MarketGid(Composite)?\\d+|(adv?|ban(ner)?)\\d+x\\d+|y\\d+_direct\\d+)([-_]|\\b)"},{"tags":"div,table","attribute":"id,class","value":"","valueRegex":"^(top|left|right|bottom)[-_]?(ad|ban(n?er)?)s?\\d*(x\\d+)?$"},{"tags":"div,table","attribute":"id,class","value":"","valueRegex":"([-_]|\\b)(adv?|ban(n?er)?)[-_]?\\d+x\\d+[-_]?[a-z]*([-_]|\\b)"},{"tags":"div,table","attribute":"id,class","value":"","valueRegex":"([-_]|\\b)(bann?er|reklama|advertisement)s?[-_]?\\d*(x\\d+)?([-_]|\\b)"},{"tags":"div,table","attribute":"id,class","value":"","valueRegex":"([-_]|\\b)sidebar[-_]?ads?([-_]|\\b)"},{"tags":"","attribute":"id,class","value":"begun_table,baner,banner,ad,adv,reklama,google_companion_ad_div,google_ads_site,Advertisement,adBar,adBox","valueRegex":""},{"tags":"div","attribute":"id","value":"","valueRegex":"^DIV_NNN_\\d+$"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"(^|[/_])(get|page)?(ad|bann?er|reklama)s?\\d*($|[/_])"},{"tags":"a","attribute":"href","value":"","valueRegex":"(^|[/_])(get|page)?(ad|bann?er|reklama)s?\\d*($|[/_])"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"^http://(adservr?(ing)?|ads?|banners?)\\d*\\."},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.(atdmt|serving-sys|pointroll|game-advertising-online|teasernet)\\.com/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.(adbureau|doubleclick|dt00|fastclick|msads)\\.net/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.linkstorms?\\.(com|net)/"},{"tags":"a","attribute":"href","value":"","valueRegex":"\\.doubleclick\\.net/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"(\\.|%2E)(adriver|adfox|dclick)(\\.|%2E)ru/"},{"tags":"a","attribute":"href","value":"","valueRegex":"(\\.|%2E)(adriver|adfox|dclick)(\\.|%2E)ru/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"ad[^/]*\\.tbn\\.ru/"},{"tags":"a","attribute":"href","value":"","valueRegex":"ad[^/]*\\.tbn\\.ru/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"([-_]|\\b)(bann?er|reklama)[-_]?(id)?[-_]?\\d*(x\\d*)?([-_]|\\b)"},{"tags":"a","attribute":"href","value":"","valueRegex":"([-_]|\\b)(bann?er|reklama)[-_]?(id)?[-_]?\\d*(x\\d*)?([-_]|\\b)"},{"tags":"a","attribute":"href","value":"","valueRegex":"\\b(id\\d+\\.al\\d+\\.luxup\\.ru/ok|ru\\.redtram\\.com/go/\\d+)/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"click\\d*\\.begun\\.ru/"},{"tags":"a","attribute":"href","value":"","valueRegex":"click\\d*\\.begun\\.ru/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\bpost\\.rmbn\\.ru/cgi-bin/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.advmaker\\.ru/"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.ddestiny\\.ru/"},{"tags":"embed","attribute":"flashvars","value":"","valueRegex":"//1link\\.ru/c\\.php"},{"tags":"embed","attribute":"flashvars","value":"","valueRegex":"^a?link\\d+="},{"tags":"object","attribute":"data","value":"","valueRegex":"\\.swf\\?a?link\\d+=http"},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"\\.traf\\.spb\\.ru/"},{"tags":"embed","attribute":"src","value":"","valueRegex":"^https?://static\\.[^/]+/\\d+/\\w+/.*\\.swf\\?link1="},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"^https?://static\\.terrhq\\.ru"},{"tags":"a","attribute":"href","value":"","valueRegex":"^https?://www\\.kf-forex\\.ru/soft\\.php\\?from="},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"^https?://click\\.readme\\.ru/informer/"},{"tags":"a","attribute":"href","value":"","valueRegex":"^https?://click\\.readme\\.ru/in\\.php\\?id="},{"tags":"a","attribute":"href","value":"","valueRegex":"^https?://nnn[-_\\w]*\\.novoteka\\.ru/click\\.cgi\\?h="},{"tags":"iframe,embed,script,img","attribute":"src","value":"","valueRegex":"^https?://assets\\d*\\.admulti\\.com/"},{"tags":"a","attribute":"href","value":"","valueRegex":"go\\.admulti\\.com/clicks/"},{"tags":"div","attribute":"class","value":"","valueRegex":"^piclist_\\d{7,}$"}]}

  ;
  
  var containerElm = document.getElementById('test-container');
  var testErrorsElm = document.getElementById('test-errors');

  function outputResult(name, isPassed) {
    if (isPassed) {
      document.write('<div class="ok">Test ' + name + ': PASSED</div>');
    } else {
      document.write('<div class="error">Test ' + name + ': FAILED!</div>');
    }
  }

/*
  function doTestExpectRemoved(name, content) {
    lastDocumentWriteResult = '';
    document.write(content);
    outputResult(name, !lastDocumentWriteResult);
  }

  function doTestExpectPreserved(name, content) {
    lastDocumentWriteResult = '';
    document.write(content);
    outputResult(name, lastDocumentWriteResult === content);
  }

  function doTestAndExpect(name, content, expected) {
    lastDocumentWriteResult = '';
    document.write(content);
    outputResult(name, lastDocumentWriteResult === expected);
  }
*/

  function doTestForRemove(name, contents) {
    var contents = [].concat(contents);
    for (var i = 0, str; str = contents[i]; ++i) {
      containerElm.innerHTML = str;
      outputResult(name + (i+1), containerElm.innerHTML === '' && IS_ON_MODIFIED_EVENT_FIRED);
      if (containerElm.innerHTML) {
        testErrorsElm.innerHTML += containerElm.innerHTML;
      }
    }
  }

  function doTestForPreserve(name, contents) {
    var contents = [].concat(contents);
    for (var i = 0, str; str = contents[i]; ++i) {
      containerElm.innerHTML = str;
      outputResult(name + (i+1), containerElm.innerHTML === str);
      if (containerElm.innerHTML !== str) {
        console.error('Expected: ' + str + '\nWas: ' + containerElm.innerHTML);
      }
      containerElm.innerHTML = '';
    }
  }

  function generateHtmlForIds(ids) {
    var result = '';
    var ids = [].concat(ids);
    for (var i = 0, id; id = ids[i]; ++i) {
      var content = 'content_' + id + ' ' + i;
      result += '<div id="' + id + '">' + content + '</div>';
      result += '<div class="' + id + '">' + content + '</div>';
      result += '<table class="' + id + '"><tbody><tr><td>' + content + '_in_table</td></tr></tbody></table>';
    }
    return result;
  }

  outputResult('AdBlockerName', AD_BLOCKER_RULE.name === 'Standard AdBlocker');
  outputResult('UrlRegexIsOnlyHttp', AD_BLOCKER_RULE.urlRegex === '^http://');
  outputResult('UrlExcludeRegexIsEmpty', AD_BLOCKER_RULE.urlExcludeRegex === '');
  outputResult('PreserveDocWriteIsFalse', AD_BLOCKER_RULE.preserveDocWrite === false);

  //
  // Run PWeb.
  //
  ON_REQUEST_CALLBACK({'rule': AD_BLOCKER_RULE}, {'id': 'UNIT_TEST'});

  doTestForRemove('AdsIframes', [
    '<iframe src="http://ad.adriver.ru/cgi-bin/erle.cgi?sid=85725&sz=index240&target=blank&bt=8&pz=0&rnd=1233456" frameborder=0 vspace=0 hspace=0 width=240 height=120 marginwidth=0 marginheight=0 scrolling=no></iframe>',
    '<iframe src="http://partner.nekki.ru/banner.php?no_cache='+Math.round(Math.random()*100000)+'&rotation_id=7" frameborder=0 vspace=0 hspace=0 width=200 height=300 marginwidth=0 marginheight=0 scrolling=no></iframe>',
    '<iframe src="http://mg.dt00.net/public/informers/torrents.1ru.html?rnd='+ Math.round(Math.random()*1000000000) +'" frameborder=0 width=200 height=356 marginwidth=0 marginheight=0 scrolling=no></iframe>',
    '<iframe src="http://static.terrhq.ru/torrents/torrents-2.html?rnd='+ Math.round(Math.random()*100000000) +'" frameborder=0 vspace=0 hspace=0 width=600 height=90 marginwidth=0 marginheight=0 scrolling=no></iframe>',
  ]);

  doTestForRemove('AdsEmbedded', [
    '<embed type="application/x-shockwave-flash" src="http://static.rutracker.org/004/nikita/6/rz_2.swf?link1=http%3A%2F%2Fwww.rzonline.ru%2Fpromo%2Frzn%2F%3FREFER_ID%3D3852713" width="200" height="300" style="" id="nikita-2-swf" name="nikita-2-swf" bgcolor="#FFFFFF" quality="high">',
    '<embed src="http://static.torrents.by/banners/velcom_100x90_torrents.swf?clickTAG=http://b.torr.by/www/delivery/ck.php?oaparams=2__bannerid=370__zoneid=10__cb=4138257ac1__oadest=http%3A%2F%2Fb.torrents.by%2Fwww%2Fdelivery%2Fck.php%3Foaparams%3D2__bannerid%3D370__zoneid%3D10__cb%3Dh3hdb74kd8__oadest%3Dhttp%3A%2F%2Fad.adriver.ru%2Fcgi-bin%2Fclick.cgi%3Fsid%3D1%2526ad%3D234020%26bt%3D21%2526bid%3D850417%2526bn%3D850417%2526rnd%3D552057478%26clickTARGET%3D_blank" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="100%" height="90">',
    '<embed type="application/x-shockwave-flash" src="http://b.torr.by/www/images/34.swf" width="468" height="60" style="undefined" id="Advertisement" name="Advertisement" quality="high" allowscriptaccess="always" flashvars="alink1=http%3A%2F%2Fb.torr.by%2Fwww%2Fdelivery%2Fck.php%3Foaparams%3D2__bannerid%3D32__zoneid%3D5__cb%3D89b44afdc0__oadest%3Dhttp%253A%252F%252Forgby.net%252Findex.php&amp;atar1=">',
    '<embed type="application/x-shockwave-flash" src="/attachment/dffb3c7ea82bc8f0e9f341dec9e1e20eed8053ac/2_240x400.swf" width="240" height="400" id="objbanner171" name="objbanner171" bgcolor="#ffffff" quality="high" flashvars="link1=http://www.restate.ru/counter/1k152KXCCfyr/">',
    '<embed type="application/x-shockwave-flash" src="/attachment/1498d83a6df5966d87f93334fef02140a4eac0e3/100pr(700)x90_link1.swf" width="100%" height="90" id="objbanner128" name="objbanner128" bgcolor="#ffffff" quality="high" flashvars="link1=http://www.restate.ru/counter/0rF1KZCWzRdC/">',
  ]);

  doTestForRemove('StaticAds', [
    '<div id="MarketGid2458"><table width="468px" height="60px" cellpadding="0" cellspacing="2" border="0" class="mctablecv"> <tbody><tr>  <td width="50%" valign="top" align="left"> <a target="_blank" href="http://www.marketgid.com/ghits/459538/i/2458/k/"><img width="50" height="50" align="left" src="http://imgg.dt00.net/459/459538_m60.jpg"></a> <div><a target="_blank" class="mctitle" href="http://www.marketgid.com/ghits/459538/i/2458/k/">Уникальный Телефон </a></div> <div><a target="_blank" href="http://www.marketgid.com/ghits/459538/i/2458/k/" class="mcdesc"><cite><cite>Nokia Aeon Duos-Поразит Воображение Любого! № 1 в Мире!</cite></cite></a></div> <div style="font-size:11px; font-weight: bold; color:#ff6600; text-decoration: none; font-family:tahoma;">7600.00 руб</div> </td> <td width="50%" valign="top" align="left"> <a target="_blank" href="http://www.marketgid.com/ghits/403489/i/2458/k/"><img width="50" height="50" align="left" src="http://imgg.dt00.net/403/403489_m60.jpg"></a> <div><a target="_blank" class="mctitle" href="http://www.marketgid.com/ghits/403489/i/2458/k/">Этот телефон "убил" всех на рынке сотовой связи </a></div> <div><a target="_blank" href="http://www.marketgid.com/ghits/403489/i/2458/k/" class="mcdesc"><cite><cite>Все функции только в этом телефоне</cite></cite></a></div> <div style="font-size:11px; font-weight: bold; color:#ff6600; text-decoration: none; font-family:tahoma;">9000.00 руб</div> </td> </tr> </tbody></table></div>',
    '<a href="http://www.kf-forex.ru/soft.php?from=tfile"><img src="bla-bla-bla"></a>',
    '<div id="adBar">qwe</div>',
    '<div id="adBox">asd</div>',
    '<a href="http://click.readme.ru/in.php?id=689b77a4e657125df1906d011f5dbabd&amp;p=0" target="_blank">asdasd</a>',
    '<a href="http://nnn.novoteka.ru/click.cgi?h=123" target="_blank">asdasd</a>',
    '<a href="http://nnn-i.novoteka.ru/click.cgi?h=123" target="_blank">asdasd</a>',
    '<img src="http://ds.serving-sys.com/BurstingRes///Site-3079/Type-0/b3cda6b0-de1f-4216-b80b-a333b07ae108.jpg" width="300" height="250" border="0">',
  ]);

  doTestForRemove('GeneratedAdsDivs', [
    generateHtmlForIds(['ad','Banner','advertisement','baner','reklama', 'banner171']),
    generateHtmlForIds(['top-banner','left_ad','bottom-ban','rightBaners','TopAds']),
    // ([-_]|\b)(adv?|ban(n?er)?)[-_]?\d+x\d+[-_]?[a-z]*([-_]|\b)
    generateHtmlForIds(['adv123x23','ban100x30','banner-30x50','baner-30x50-left','ad111x222asd']),
    // ([-_]|\b)(bann?er|reklama|advertisement)s?[-_]?\d*(x\d+)?([-_]|\b)
    generateHtmlForIds(['Banner_02','advertisement_02','baner_02','reklama-02', 'reklama5']),
    // ([-_]|\b)sidebar[-_]?ads?([-_]|\b)
    generateHtmlForIds(['sidebar-ad','sidebar-ads','SidebarAd','left_sidebar-ads-qwerty']),
  ]);


  // TODO: False positive for: '<a href="/company/ad_index.php">компания</a>',

  doTestForPreserve('AllowedContent', [
    '<div>a simple test</div>',
    generateHtmlForIds(['ban','bank','add','rekl','topa']),
  ]);

/*

// http://subscribe.ru/catalog/realty.spbnewbuilt

<div class="banner640" align="center" style="z-index: 1;">
  <a href="http://link.subscribe.ru/172679/0/sitenew.list6.issue,-1/20100619195157/Xwkt5JjU4wfAwDcOCe2eHwkgguaiuk">
    <img src="http://subscribe.ru/advert/image/7772/18930/630x90.png" width="630" height="90" border="0">
  </a>
  <div>
    <a href="/advert"><img border="0" src="http://subscribe.ru/img/ads.png" alt="реклама"></a>
  </div>
</div>


// TODO: .swf?clickTAG=http
// TODO: <param name="movie" value="...">

<div style="padding-top: 1em; z-index: 1;">
  <object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0" width="240" height="400">
    <param name="movie" value="http://subscribe.ru/advert/image/7772/18724/240x400.swf?clickTAG=http://link.subscribe.ru/170960/0/sitenew.leftbot.catalog.industry.realty.subscribe,-1/20100619195157/ToYBhBeHDN-bmprZG66tJAgucmckrm">
    <param name="quality" value="high">
    <param name="bgcolor" value="#FFFFFF">
    <param name="wmode" value="opaque">
    <embed src="http://subscribe.ru/advert/image/7772/18724/240x400.swf?clickTAG=http://link.subscribe.ru/170960/0/sitenew.leftbot.catalog.industry.realty.subscribe,-1/20100619195157/E+HogEylm0INudk1GAJblguhnrnumi" quality="high" bgcolor="#FFFFFF" width="240" height="400" align="center" wmode="opaque" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer">
  </object>
</div>

*/

  outputResult('IsOnModifiedEventFired', IS_ON_MODIFIED_EVENT_FIRED);

})();
