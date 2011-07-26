const {Cc,Ci,Cu,components} = require("chrome");
const tabs  = require("tabs");
const data = require("self").data;

var us = require("userstyles");
var manager = require("manager");
var man = manager.man;
var display = require("display");
var ss = require("simple-storage");
const searchPredictor = require("predict_search");
const track = require("track");

const TEST_ID = "newBlankTabABstudy";
const WHICH_DESIGN = "testpilot." + TEST_ID + ".addon"; //testpilot.newBlankTabABstudy.addon
const NUM_RESULTS = 16;

var modules = {};
Cu.import("resource://gre/modules/Services.jsm", modules);
var {Services} = modules;

//ss.storage._pinnedSites = {};
//ss.storage._blockedSites = {};

let searchEventSetup = false;
let jumpTrackerSetup = false;
let designIndex = getDesignIndex();
startPredictionTracking();


/* ------------- Detect tab actions & do sth ------------- */

// change the new tab page
// if designIndex allows
tabs.on("ready", function(tab){
	// Detect a "DOMContentLoaded" event
	// if it is a new tab page
	if(tab.url == "about:blank") {
		console.log("designIndex = "+designIndex);
		designIndex = getDesignIndex();
		if(designIndex > 0){
			console.log("designIndex = "+designIndex);
			startPredictionTracking();
			// load new tab page template
			// if not in control group
			us.load(data.url("tab.css"));
			var worker = tab.attach({
					contentScriptFile:
					[data.url("jquery-1.6.2.min.js"), 
					 data.url("load-new-tab.js")]
			});
			let results = man.getResults(NUM_RESULTS, designIndex, tab);
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
			
	}else if(designIndex == 4){
		// prepare and store search results for this tab to be used later
		man.prepareSearchResults(tab);
	}

});


tabs.on('activate', function(tab) {
	// DOM loaded, prepare and store search results
	if (tab.url != "about:blank")
		man.prepareSearchResults(tab);
});


function getDesignIndex(){
	// get results depending WHICH_ADDON pref parameter
	let designIndex = 0;
	ss.storage._designIndex = 0;
	if (Services.prefs.prefHasUserValue(WHICH_DESIGN)) {
		designIndex = Services.prefs.getIntPref(WHICH_DESIGN);
		ss.storage._designIndex = designIndex;
	}
	//return designIndex;
	return 4;
}

// start tracking for prediction
function startPredictionTracking(){
	if(designIndex == 4 && !searchEventSetup){
		console.log("setup search prediction event worker ...");
		let worker = searchPredictor.getEventWorker();
		worker.on('searchresults', function(data) {
			console.log("adding results for " + data.title + " to awesome");
			man.addSearchPredictionResults(data.title, data.results);
		});
		searchEventSetup = true;
	}
	if(designIndex == 5 && !jumpTrackerSetup){
		console.log("start jump prediction tracking ...");
		track.startTracking();
		jumpTrackerSetup = true;
	}
}

console.log("The add-on is running.");
