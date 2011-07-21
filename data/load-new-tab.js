document.body.innerHTML = 
  '<html>' +
  '<head><title>New Tab</title><link rel="stylesheet" type="text/css" href="tab.css" /></head>' +
  '<body><div id="header"><h1 id="newtab-title"></h1><a id="clean-blocked" class="clean" href="#">Clean All blocked sites</a> | <a id="clean-star" class="clean" href="#">Clean All starred sites</a></div>' +
  '<div id="content" class="result-wrapper"></div>' +
  '<div id="no-results" style="display:none;">No results</div></body>' +
  '</html>';

$("#newtab-title").html("TestPilot New Tab Test");