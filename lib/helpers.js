const {Cc,Ci,Cu,components} = require("chrome");
const utils = require("utils");
const helper = require("helpers");
const data = require("self").data;

var Places = {};
Cu.import("resource://gre/modules/PlacesUtils.jsm", Places);
Places.PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase);


/* ----- Favicon Methods ----- */

FaviconHelpers = function() {
  let me = this;
  me. _faviconColors = {};
  me.taggingSvc = Cc["@mozilla.org/browser/tagging-service;1"]
                  .getService(Ci.nsITaggingService);
  me.ios = Cc["@mozilla.org/network/io-service;1"]
           .getService(Ci.nsIIOService);
  me.faviconSvc = Cc["@mozilla.org/browser/favicon-service;1"]
                  .getService(Ci.nsIFaviconService);
                  
  // some useful regular expressions
  me.re_tokenize = new RegExp(/[\s]/);
  me.re_hostname = new RegExp(/s/);
};

FaviconHelpers.prototype.getFaviconData = function(url) {
  let me = this;
  try {
    let wrappedURL = me.ios.newURI(url, null, null);
    let faviconURL = me.faviconSvc.getFaviconForPage(wrappedURL);
    let dataURL = me.faviconSvc.getFaviconDataAsDataURL(faviconURL);
    return dataURL;
  } catch (ex) {
    //return null;
    return data.url("img/blank.png");
  }
}

FaviconHelpers.prototype.getCachedFaviconColor = function(aFaviconImg) {
  return this._faviconColors[aFaviconImg.src];
};

FaviconHelpers.prototype.getFaviconColor = function(aFaviconImg, aDocument) {
  let me = this;
  let canvas = aDocument.createElement("canvas");
  canvas.height = canvas.width = 16;

  let context = canvas.getContext("2d");
  context.drawImage(aFaviconImg, 0, 0);

  // keep track of how many times a color appears in the image
  let colorCount = {};
  let maxCount = 0;
  let faviconColor = "";

  // data is an array of a series of 4 one-byte values representing the rgba values of each pixel
  let data = context.getImageData(0, 0, 16, 16).data;
  for (let i = 0; i < data.length; i += 4) {
    // ignore transparent pixels
    if (data[i+3] == 0)
      continue;
    let color = data[i] + "," + data[i+1] + "," + data[i+2];
    // ignore white
    if (color == "255,255,255")
      continue;

    colorCount[color] = colorCount[color] ?  colorCount[color] + 1 : 1;
    // keep track of the color that appears the most times
    if (colorCount[color] > maxCount) {
      maxCount = colorCount[color];
      faviconColor = color;
    }
  }
  me._faviconColors[aFaviconImg.src] = faviconColor;
  return faviconColor;
};



/* ------------ Other helper functions ---------- */

function reverseString(s) {
    return s.split("").reverse().join("");
}
// get Title for a URL
function getBookmarkTitleForURL(url) {
  let bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
              .getService(Ci.nsINavBookmarksService);
  let ios = Cc["@mozilla.org/network/io-service;1"]
            .getService(Ci.nsIIOService);
  let bookmarkIds = bmsvc.getBookmarkIdsForURI(ios.newURI(url, null, null));
  if (bookmarkIds.length == 0) {
    return null;
  }
  let title = bmsvc.getItemTitle(bookmarkIds[0]);
  //console.log("getBookmarkTitleForURL("+url+") = "+title);
  return title;
};


function isWebURL(url) {
  return (url && (/^http/).test(url));
}

// return reversed host!!
function getHostFromURL(url) {
  if (!url) return null;
  try{
    let ios = Cc["@mozilla.org/network/io-service;1"]
              .getService(Ci.nsIIOService);
    let uri = ios.newURI(url, null, null);
    if(uri) return reverseString(uri.host)+".";
  }catch(err){
    return null;
  }
  
}

/* ---- when the results are not enough ---*/
function addFallBacks(currentURL, currentList, numResults) {
  console.log("CURRENT: " + currentURL);
  
  // domain controls
  let currentRevHost = getHostFromURL(currentURL);
  let seenHosts = {};
  if(currentRevHost)
    seenHosts[currentRevHost] = true;
  
  let i = 0;
  let params = {};
  currentList.forEach(function(exisiting) {
    if(getHostFromURL(exisiting.url))
      seenHosts[getHostFromURL(exisiting.url)] = true;
  });

  let count = currentList.length;
  utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT * FROM moz_places ORDER BY frecency DESC LIMIT 50",
    "params" : params,
    "names" : ["url", "title", "rev_host"],
  }).forEach(function({url, title, rev_host}) {
    if (count >= numResults || rev_host in seenHosts || !helper.isWebURL(url))
      return;
    currentList.push({
      "url" : url,
      "icon" : null,
      "title" : title,
      "pinned" : false,
      "fallback" : true,
    });
    seenHosts[rev_host] = true;
    count++;
  });
  return currentList;
}



function isURLHub(url) {
  re_bad_substrings = new RegExp(/(\/post\/|\/article\/)/g);
  re_is_num = new RegExp(/\/[0-9]+\/{0,1}$/);
  re_bad_param = new RegExp(/^([a-z]|search)=/);
  let RE_HOME_URL = new RegExp(/^https{0,1}:\/\/[a-zA-Z0-9\.\-\_]+\/{0,1}$/);
  let RE_FAIL_URL = new RegExp(/(\/post\/|\/article\/)|([\/#][0-9]+\/{0,1}$)|((\/*[0-9]){8,})/);
  if (!url) {
    return false;
  }
  url = url.split('?');
  if (url.length > 1) {
    if (re_bad_param.test(url[1])){
      return false;
    }
  }

  if (RE_HOME_URL.test(url)) {
    return true;
  }

  url = url[0];
  let splitURL = url.split('/');

  /* Quick reject */
  if (url.length > 100) { // very unlikely to be a hub
    console.log(url + "TOO LONG");
    return false
  }

  if (RE_FAIL_URL.test(url)) {
    return false;
  }

  let r1 = url.match(/[0-9]+/g);
  if (r1 && !r1.reduce(function(p,c,i,a) {
        return (p && (c.length < 6))
      }, true)) {
    return false; // if after removing slash, more than 8 consec digits
  }
  if (splitURL.length > 7) {
    return false; // craziest i've seen is https://www.amazon.com/gp/dmusic/mp3/player
  }

  if (!splitURL.reduce(function(p,c){
        return (p && c.length < 40 && c.split(/[\-\_]/g).length < 3);
      }, true)) {
    return false;
  }
  return true;
}




/* ----- definition for external interface ---- */

exports.fav = new FaviconHelpers();
exports.isWebURL = isWebURL;
exports.getHostFromURL = getHostFromURL;
exports.getBookmarkTitleForURL = getBookmarkTitleForURL;
exports.addFallBacks = addFallBacks;
exports.isURLHub = isURLHub;
exports.reverseString = reverseString;
