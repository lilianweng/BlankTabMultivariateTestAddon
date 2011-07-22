const {Cc,Ci,Cu,components} = require("chrome");
const data = require("self").data;
const TEST_ID = "newBlankTabABstudy";
const WHICH_DESIGN = "testpilot." + TEST_ID + ".addon";
const NUM_RESULTS = 16;

var tabs = require("tabs");
var us = require("userstyles");
var manager = require("manager");
var display = require("display");
var ss = require("simple-storage");

var modules = {};
Cu.import("resource://gre/modules/Services.jsm", modules);
var {Services} = modules;

//ss.storage._pinnedSites = {};
//ss.storage._blockedSites = {};


tabs.on("ready", function(tab){
	// Detect a "DOMContentLoaded" event
	// if it is a new tab page
	if(tab.url == "about:blank") {
		// get results depending WHICH_ADDON pref parameter
		//if (Services.prefs.prefHasUserValue(WHICH_DESIGN)) {
			  let designIndex = 1; //Services.prefs.getIntPref(WHICH_DESIGN);
				ss.storage._designIndex = designIndex;
				
			  console.log("designIndex = "+designIndex);
				if(designIndex > 0) {
					// load new tab page template
					// if not in control group
					us.load(data.url("tab.css"));
					var worker = tab.attach({
							contentScriptFile:
  						[data.url("jquery-1.6.2.min.js"), 
  						 data.url("load-new-tab.js")]
					});
					let results = manager.getResults(NUM_RESULTS, designIndex);
					// display results in the template
					// get window, gBrowser, document
					let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
									 .getService(Ci.nsIWindowMediator);
					let window = wm.getMostRecentWindow("navigator:browser");
					let gBrowser =  window.gBrowser;
					let doc = gBrowser.contentDocument;
					display.DisplaySites.loadResults(NUM_RESULTS, results, doc);
					window.gURLBar.value = "";
			}
			
		//}else{
		//	ss.storage._designIndex = 0;
		//}
	}

});

    
console.log("The add-on is running.");
