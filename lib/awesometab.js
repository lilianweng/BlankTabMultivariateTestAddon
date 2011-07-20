var {Cc, Ci} = require("chrome");

exports.getResults = function getResults(numResults) {
  let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                       .getService(Ci.nsINavHistoryService);
  let historyOption = Ci.nsINavHistoryQueryOptions;
  let results = [];
  
  let query = historyService.getNewQuery();
  let options = historyService.getNewQueryOptions();
  //options.sortingMode = historyOption.SORT_BY_VISITCOUNT_DESCENDING;
  options.sortingMode = historyOption.SORT_BY_FRECENCY_DESCENDING;
  options.maxResults = numResults;
  options.queryType = historyOption.QUERY_TYPE_HISTORY;
  let result = historyService.executeQuery(query, options);
  let cont = result.root;
  cont.containerOpen = true;
  for(let i=0; i<cont.childCount; i++){
    let node = cont.getChild(i);
    results.push({
        "title" : node.title,
        "url": node.uri,
        "icon": node.icon,
        "visit" : node.accessCount
      });
  }
  cont.containerOpen = false;
  //console.log(results);
  return results;
}

