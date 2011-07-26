var {Cc, Ci} = require("chrome");
var ss = require("simple-storage");
var helper = require("helpers");

const searchPredictor = require("predict_search");
const jumpPredictor = require("predict_track");

/*
 * designIndex = 1: top frecent sites in history
 * designIndex = 2: recently bookmarked sites
 * designIndex = 3: recently closed tabs
 * designIndex = 4: prediction based on similarity
 * designIndex = 5: prediction based on jumpings
 */
 
 
ResultManager = function(){
  let me = this;
  me._lastTab = null;
  me._predictionMap = {};
}

ResultManager.prototype.getResults = function (maxNumResults, designIndex, currentTab) {
  let me = this;
  let results = [];
  let numResults = 0;
  
  /* ------ blocked and pinned sites ----- */
  let blockedSites = ss.storage._blockedSites; // hashtable, mapping of url -> boolean
  if(blockedSites == undefined)
    blockedSites = {};
  let blockedSitesLength = Object.keys(blockedSites).length;
  
  let pinnedSites = ss.storage._pinnedSites;
  if(pinnedSites == undefined)
    pinnedSites = {};
  let pinnedSitesLength = Object.keys(pinnedSites).length;
  
  console.log("blocked sites: " + blockedSitesLength +", pinned sites: " + pinnedSitesLength);
  
  numResults = maxNumResults + blockedSitesLength;

  if(designIndex == 1)
    results = getFrecentSites(numResults);
  else if(designIndex == 2)
    results = getBookmarkedSites(numResults);
  else if(designIndex == 3)
    results = getRecentClosedTabs(numResults);
  else if(designIndex == 4)
    results = getSearchPredictions(me._lastTab, me._predictionMap);
  else if(designIndex == 5)
    results = getJumpPredictions(me._lastTab);
  
  // remove blocked sites
  results = removeBlockedSites(results, blockedSites);
  results = removePinnedSites(results, pinnedSites);
  results = addPinnedSites(results, pinnedSites);
  
  if(results.length < maxNumResults) {
    let url = me._lastTab ? me._lastTab.url : currentTab.url;
    helper.addFallBacks(url, results, maxNumResults);
  }

  return results;
}

// prepare and store search results for this tab to be used later
ResultManager.prototype.prepareSearchResults = function(tab){
  searchPredictor.predictSearch(tab.title);
  this._lastTab = tab;
}

ResultManager.prototype.addSearchPredictionResults = function(title, results) {
  this._predictionMap[title] = results;
}

exports.man = new ResultManager();

/* ----------- dealing with display content ------------- */

// designIndex = 1
// top frecent sites in history
function getFrecentSites(numResults){
  if(numResults <= 0)
    return [];
  
  let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                       .getService(Ci.nsINavHistoryService);
  let historyOption = Ci.nsINavHistoryQueryOptions;
  let query = historyService.getNewQuery();
  let options = historyService.getNewQueryOptions();
  //options.sortingMode = historyOption.SORT_BY_VISITCOUNT_DESCENDING;
  options.sortingMode = historyOption.SORT_BY_FRECENCY_DESCENDING;
  options.maxResults = numResults;
  options.queryType = historyOption.QUERY_TYPE_HISTORY;
  let result = historyService.executeQuery(query, options);
  return queryResultParser(result);
}


// designIndex = 2
// recently bookmarked sites
function getBookmarkedSites(numResults){
  if(numResults <= 0)
    return [];
    
  let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                       .getService(Ci.nsINavHistoryService);
  let historyOption = Ci.nsINavHistoryQueryOptions;

  let query = historyService.getNewQuery();
  query.onlyBookmarked = true;
  let options = historyService.getNewQueryOptions();
  options.sortingMode = historyOption.SORT_BY_DATEADDED_ASCENDING;
  options.maxResults = numResults;
  options.queryType = historyOption.QUERY_TYPE_BOOKMARKS ;
  let result = historyService.executeQuery(query, options);
  return queryResultParser(result);
}


// designIndex = 3
// recently closed tab
function getRecentClosedTabs(numResults){
  if(numResults <= 0)
    return [];
    
  let sessionService = Cc["@mozilla.org/browser/sessionstore;1"]
                       .getService(Ci.nsISessionStore);
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
					 .getService(Ci.nsIWindowMediator);
	let theWindow =  wm.getMostRecentWindow("navigator:browser");
  let result = sessionService.getClosedTabData(theWindow);
  return jsonResultParser(result);
}


// designIndex = 4
// get results for a certain tab
function getSearchPredictions(latestTab, predictionMap) {
  console.log("getting search predictions for " + latestTab.title)
  if(latestTab)
    console.log(latestTab.title);
  if (!latestTab || !predictionMap[latestTab.title]) {
    console.log("title fail")
    return [];
  } else {
    console.log("returing for " + latestTab.title);
    return predictionMap[latestTab.title];
  }
}


// designIndex = 5
function getJumpPredictions(lastTab){
  let results = jumpPredictor.predictTrack(lastTab);
  return results;
}


/* ----------- helper ------------- */

// Remove Blocked Sites
function removeBlockedSites(results, blockedSites){
  let newResults = [];
  for(let i=0; i<results.length; i++){
    let site = results[i];
    if(blockedSites[site.url] == undefined) {
      newResults.push(site);
    }
  }
  return newResults;
}

// Remove Pinned Sites
function removePinnedSites(results, pinnedSites){
  let newResults = [];
  for(let i=0; i<results.length; i++){
    let site = results[i];
    if(pinnedSites[site.url] == undefined) {
      newResults.push(site);
    }
  }
  return newResults;
}

// add pinned status
function addPinnedSites(results, pinnedSites){
  for(let url in pinnedSites){
    results.unshift({
        "title" : helper.getBookmarkTitleForURL(url),
        "url": url,
        "icon": null,
        "pinned": true,
        "fallback": false,
    });
  }
  return results;
}

// Results Parser

function queryResultParser(result){
  let results = [];
  let cont = result.root;
  cont.containerOpen = true;
  for(let i=0; i<cont.childCount; i++){
    let node = cont.getChild(i);
    results.push({
        "title" : node.title,
        "url": node.uri,
        "icon": node.icon,
        "pinned": false,
        "fallback": false,
      });
  }
  cont.containerOpen = false;
  return results;
}

function jsonResultParser(results){
  let JSONresults = JSON.parse(results);
  let results = [];
  for(let i=0; i<JSONresults.length && i<16; i++){
    let re = JSONresults[i];
    //console.log(JSON.stringify(re));
    if(re.state != undefined) {
      results.push({
          "title" : re.title,
          "url": re.state.entries[0].url,
          "icon": re.image,
          "pinned": false
        });
    }
  }
  return results;
}
