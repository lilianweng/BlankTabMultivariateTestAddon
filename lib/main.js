const {Cc,Ci,Cu,components} = require("chrome");
var tabs = require("tabs");
var us = require("userstyles");
var awesometab = require("awesometab");
var display = require("display");
const data = require("self").data;

tabs.on("ready", function(tab){
	// Detect a "DOMContentLoaded" event
	// if it is a new tab page
	
	if(tab.url == "about:blank") {
		// load new tab page template
		us.load(data.url("awesometab.css"));
		var worker = tab.attach({
			contentScriptFile:
  			[data.url("jquery-1.6.2.min.js"), 
  			 data.url("load-new-tab.js")]
		});
		// get results
		let results = awesometab.getResults(16);
		// display results in the template
		try{
			let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
							 .getService(Ci.nsIWindowMediator);
			let gBrowser =  wm.getMostRecentWindow("navigator:browser").gBrowser;
			let doc = gBrowser.contentDocument;
			display.DisplaySites.loadResults(results, doc);
			wm.getMostRecentWindow("navigator:browser").gURLBar.value = "";
		}catch(err){ 
			console.log("[ERROR] "+err);
		}
	}
});

console.log("The add-on is running.");
