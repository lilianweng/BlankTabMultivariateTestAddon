var {Cc, Ci} = require("chrome");
const data = require("self").data;

Helpers = function() {
  let me = this;
  me. _faviconColors = {};
  me.taggingSvc = Cc["@mozilla.org/browser/tagging-service;1"]
                  .getService(Ci.nsITaggingService);
  me.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                   .getService(Ci.nsINavBookmarksService);
  me.ios = Cc["@mozilla.org/network/io-service;1"]
           .getService(Ci.nsIIOService);
  me.faviconSvc = Cc["@mozilla.org/browser/favicon-service;1"]
                  .getService(Ci.nsIFaviconService);
};



/* ----- Favicon Color Methods ----- */

Helpers.prototype.getFaviconData = function(url) {
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

Helpers.prototype.getCachedFaviconColor = function(aFaviconImg) {
  return this._faviconColors[aFaviconImg.src];
};

Helpers.prototype.getFaviconColor = function(aFaviconImg, aDocument) {
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
    if (data[i+3] == 0) {
      continue;
    }

    let color = data[i] + "," + data[i+1] + "," + data[i+2];
    // ignore white
    if (color == "255,255,255") {
      continue;
    }

    colorCount[color] = colorCount[color] ?  colorCount[color] + 1 : 1;

    // keep track of the color that appears the most times
    if (colorCount[color] > maxCount) {
      maxCount = colorCount[color];
      faviconColor = color;
    }
  }

  this._faviconColors[aFaviconImg.src] = faviconColor;
  return faviconColor;
};


/* --------- get Title for a URL ---------- */

Helpers.prototype.getBookmarkTitleForURL = function(url) {
  let me = this;
  let bookmarkIds = me.bmsvc.getBookmarkIdsForURI(me.ios.newURI(url, null, null));
  if (bookmarkIds.length == 0) {
    return null;
  }
  let title = me.bmsvc.getItemTitle(bookmarkIds[0]);
  console.log("getBookmarkTitleForURL("+url+") = "+title);
  return title;
};




exports.helpers = new Helpers();

