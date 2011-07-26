const {Cu} = require("chrome");
const self = require("self");
const helper = require("helpers");
const {EventEmitter} = require("events");

const search = require("search");
let sr = new search.search();


/* this is used to communicate with the async search script*/
let EventWorker = EventEmitter.compose({
  postMessage: function(data) {
    //console.log("emitting: " + JSON.stringify(data));
    this._emit("searchresults", data);
  }
});
let worker = EventWorker();
/*
worker = {
  postMessage: function(){},
  on: function(){}
}
*/

/**/
exports.getEventWorker = function() {
  return worker;
}

exports.predictSearch = function(latestTitle) {
  let RE_NOUN_VERB = new RegExp(/(^NN)|(^VB)|(^JJ)/);

  if (!latestTitle)
    return [];
  let tokens = sr.tokenize(latestTitle)
  sr.search(tokens, {
    "limit" : 100,
    "skip" : 0,
    "timeRange" : 0,
    "prioritizeBookmarks" : true,
  }, {
    "title": latestTitle,
    "append": false,
    "time": Date.now(),
  }, worker).filter(function ({url}) {
    return helper.isURLHub(url);
  })
}
