document.documentElement.innerHTML = 
  '<head>' + 
  '<meta http-equiv="content-type" content="text/html; charset=UTF-8">' +
  '<title>New Tab</title>' +
  '<link rel="stylesheet" type="text/css" href="tab.css" />' +
  '</head>' +
  '<body>' +
  '<div id="page-wrap-newblanktabtestaddonthing">' + 
  '<div id="header">' +
  '<h1 id="newtab-title"><a href="http://testpilot.mozillalabs.com/" target="_blank">Test Pilot</a> New Tab Test</h1>' +
  '<a id="clean-blocked" class="clean" href="#">Clean All blocked sites</a>' + 
  //' | <a id="clean-star" class="clean" href="#">Clean All starred sites</a>' +
  '</div>' +
  '<div id="content" class="result-wrapper"></div>' +
  '<div id="no-results" style="display:none;">No results</div>' + 
  '</div>' + 
   '</body>';