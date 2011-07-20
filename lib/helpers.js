var {Cc, Ci} = require("chrome");
const data = require("self").data;

AwesomeTabUtils = function() {
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

AwesomeTabUtils.prototype.getFaviconData = function(url) {
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

AwesomeTabUtils.prototype.getCurrentWindow = function() {
  let me = this;
  let chromeWin = Services.wm.getMostRecentWindow("navigator:browser");
  let win = chromeWin.gBrowser.selectedBrowser.contentWindow;
  return win;
};

AwesomeTabUtils.prototype.getBookmarkTitleFromURL = function(url) {
  let me = this;
  let bookmarkIds = me.bmsvc.getBookmarkIdsForURI(me.ios.newURI(url, null, null));
  if (bookmarkIds.length == 0) {
    return null;
  }
  return me.bmsvc.getItemTitle(bookmarkIds[0]);
};

AwesomeTabUtils.prototype.getCurrentURL = function() {
  return this.getCurrentWindow().location.href;
};

AwesomeTabUtils.prototype.getCurrentPlace = function() {
  return me.getData(["id"],{"url":me.getCurrentURL()},"moz_places")[0]["id"];
}


AwesomeTabUtils.prototype.getDataQuery = function(query, params, select) {
  reportError(query);
  reportError(JSON.stringify(params));
  return spinQuery(PlacesUtils.history.DBConnection, {
    names: select,
    params: params,
    query: query,
  })
}

AwesomeTabUtils.prototype.getData = function(fields, conditions, table) {
  let me = this;
  let queryString = "SELECT ";
  queryString += fields.join(',') + ' FROM ' + table + ' WHERE ';
  let conditionArr = [];
  for (let key in conditions) {
    conditionArr.push(key + " = :" + key + "_v");
  }
  queryString += conditionArr.join(" AND ");
  //reportError("query string constructed" + queryString);
  //reportError("statement created, parametrizing with " + JSON.stringify(conditions));
  let params = {};
  for ([k, v] in Iterator(conditions)) {
    //reportError("adding condition + " + k + " : " + v);
    params[k + "_v"] = v;
  }
  //reportError("params are" + JSON.stringify(stm.params));
  //reportError("executing statement");
  return spinQuery(PlacesUtils.history.DBConnection, {
    names: fields,
    params: params,
    query: queryString,
  });
  //reportError("returing " + JSON.stringify(ret));
};

AwesomeTabUtils.prototype.updateData = function(id, data, table) {
  let queryString = "UPDATE " + table + " SET ";
  for ([k, v] in Iterator(data)) {
    queryString += k + " = :" + k + "_v ";
  }
  queryString += "WHERE id = :id";
  //reportError(queryString);
  let params = {
    id: id,
  }
  for ([k,v] in Iterator(data)) {
    params[k + "_v"] = v;
  }
  spinQuery(PlacesUtils.history.DBConection, {
    params: params,
    query: queryString,
  });
};

AwesomeTabUtils.prototype.insertData = function(data, table) {
  let flatData = [];
  for ([k,v] in Iterator(data)) {
    flatData.push(k);
  }
  let queryString = "INSERT INTO " + table + "(";
  queryString += flatData.join(',');
  queryString += ") VALUES ("
  queryString += flatData.map(function(d) {return ":" + d + "_v";}).join(',');
  queryString += ");";
  //reportError(queryString);
  let params = {};
  for ([k,v] in Iterator(data)) {
    params[k + "_v"] = v;
  }
  //reportError(JSON.stringify(stm.params));
  spinQuery(PlacesUtils.history.DBConnection, {
    params: params,
    query: queryString,
  });
};

AwesomeTabUtils.prototype.isValidURL = function(url) {
  return (url && (/^https{0,1}:\/\//).test(url))
};

AwesomeTabUtils.prototype.getCurrentTime = function(precision) {
  let time = new Date().getTime();
  if (!precision)
    precision = "o";
  return Math.floor({
    "o" : time,
    "s" : time / (1000),
    "m" : time / (1000 * 60),
    "h" : time / (1000 * 60 * 60),
    "d" : time / (1000 * 60 * 60 * 24)
  }[precision]);
};

AwesomeTabUtils.prototype.createDB = function(table, schema) {
  let me = this;
  let dbFile = Cc["@mozilla.org/file/directory_service;1"]
               .getService(Ci.nsIProperties)
               .get("ProfD", Ci.nsIFile);
  dbFile.append("places.sqlite");
  let storage = Cc["@mozilla.org/storage/service;1"]
                .getService(Ci.mozIStorageService);
  let dbConn = storage.openDatabase(dbFile);
  dbConn.createTable(table, schema);
};

  /* ----- Favicon Color Methods ----- */

AwesomeTabUtils.prototype.getCachedFaviconColor = function(aFaviconImg) {
  return this._faviconColors[aFaviconImg.src];
};

AwesomeTabUtils.prototype.getFaviconColor = function(aFaviconImg, aDocument) {
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

exports.helpers = new AwesomeTabUtils();

