document.body.innerHTML = 
  '<html>' +
  '<head><title>New Tab</title><link rel="stylesheet" type="text/css" href="awesometab.css" /></head>' +
  '<body><h1 id="newtab-title"></h1>' +
  '<div id="content" class="result-wrapper"></div>' +
  '<div id="no-results" style="display:none;">No results</div></body>' +
  '</html>';

$("#newtab-title").html("TestPilot New Tab Test");