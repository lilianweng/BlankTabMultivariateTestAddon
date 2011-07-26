const {Ci, Cu} = require("chrome");
const tabs = require("tabs");
const ss   = require("simple-storage");
const helper = require("helpers");
const utils = require("utils");
const pos = require("pos");

var Places = {};
Cu.import("resource://gre/modules/PlacesUtils.jsm", Places);
Places.PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase);



function getBestForHost (revHost) {
  let items = [];
  utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT url, title FROM moz_places WHERE rev_host = :revHost ORDER by frecency desc limit 3",
    "params" : {"revHost" : revHost},
    "names"  : ["url", "title"],
  }).forEach(function({url, title}) {
    items.push({
      "url" : url, 
      "title" : title,
    });
  });
  console.log("items "+items.length);
  return items;
}


exports.predictTrack = function(lastTab) {
  console.log("using predict track")
  if (!lastTab){
    //return helper.addFallBacks("", []);
    return [];
  }
  let url = lastTab.url;
  if (!helper.isWebURL(url)){
    //return helper.addFallBacks(url, []);
    return [];
  }
  
  let revHost = helper.getHostFromURL(url);
  let dstDict = ss.storage.tracker[revHost];
  if (!dstDict){
    //return helper.addFallBacks(url,[]);
    return [];
  }
  let results = [];
  console.log("JUMP PREDICTION FOR : " + url);
  console.log(JSON.stringify(dstDict));
  for (let dstHost in dstDict) {
    let items = getBestForHost(dstHost);
    if (items.length == 0 || dstHost == revHost || ss.storage.dstCount[dstHost] < 5)
      continue;
    for(let i=0; i < items.length; i++) {
      let item = items[i];
      results.push({
        "url" : item.url,
        "icon" : null,
        "title": item.title ? item.title : helper.getBookmarkTitleForURL(item.url),
        "score" : dstDict[dstHost] / ss.storage.dstCount[dstHost],
        "pinned" : false,
        "fallback" : false,
      });
    }
  }
  return results.sort(function(a,b){return b.score - a.score});
}

