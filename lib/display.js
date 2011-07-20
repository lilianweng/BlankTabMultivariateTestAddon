var {Cc, Ci} = require("chrome");
var helpers = require("helpers");

DisplaySites = function(){
}

DisplaySites.prototype.loadResults = function(results, doc) {
  let me = this;
  me.doc = doc;
  let $ = me.doc.getElementById;
  let noResults = true;
  for (let i in results) {
    noResults = false;
    let elem = me.createSiteItem(results[i], doc);
    $('content').appendChild(elem);
  }
  

  if (noResults) {
    $('no-results').style.display = 'block';
  }
  
}

DisplaySites.prototype.createSiteItem = function(result, doc) {
  let me = this;
  let imageItem = doc.createElement("img");
  imageItem.className = "image-item";
  imageItem.setAttribute("src", helpers.helpers.getFaviconData(result.url) );
  //imageItem.setAttribute("src", result.icon );

  let imageContainer = doc.createElement("div");
  imageContainer.className = "image-container";
  imageContainer.appendChild(imageItem);
  imageContainer.addEventListener("click", function(event) {
    doc.location = result.url;
  }, false);
  imageContainer.title = result.url;
  
  let color = helpers.helpers.getCachedFaviconColor(imageItem);
  if (color) {
    me.colorBackground(imageContainer, color);
  } else {
    imageItem.addEventListener("load", function() {
        color = helpers.helpers.getFaviconColor(this, doc);
        me.colorBackground(imageContainer, color);
    }, false);
  }

  let urlItem = doc.createElement("a");
  urlItem.className = "url-item";    
  urlItem.href = result.url;
  let title = result.url;
  if(result.title != null){
    title = result.title;
  }
  if(title.length>75) {
    urlItem.textContent = title.slice(0,75) + " ..." ;
  }else{
    urlItem.textContent = title;
  }
  urlItem.title = title;

  let siteItem = doc.createElement("div");
  siteItem.setAttribute("url", result.url);
  siteItem.className = "site-item";
  siteItem.appendChild(imageContainer);
  siteItem.appendChild(urlItem);

  // Set up drag and drop for site items
  siteItem.setAttribute("draggable", true);

  siteItem.addEventListener("dragstart", function(event) {
    event.dataTransfer.mozSetDataAt("application/x-moz-node", siteItem, 0);
    event.dataTransfer.setDragImage(imageContainer, 16, 16);
  }, false);

  siteItem.addEventListener("dragover", function(event) {
    if (event.dataTransfer.types.contains("application/x-moz-node")) {
      event.preventDefault();
    }
  }, false);

  siteItem.addEventListener("drop", function(event) {
    if (event.dataTransfer.types.contains("application/x-moz-node")) {
      let itemToDrop = event.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
      let targetItem = event.target;
      // Determine if we should drop to the left or the right of the target
      if (event.clientX > targetItem.offsetLeft + targetItem.clientWidth/2) {
        targetItem = targetItem.nextSibling;
      }
      // Check to make sure the item should actually move
      if (targetItem != itemToDrop) {
        let parent = itemToDrop.parentNode;
        parent.removeChild(itemToDrop);
        parent.insertBefore(itemToDrop, targetItem);
        NewTabUtils.moveDroppedSite(itemToDrop.getAttribute("url"), targetItem.getAttribute("url"));
      }
      event.preventDefault();
    }
  }, false);

  return siteItem;
}



// Set up image container gradient color background
DisplaySites.prototype.colorBackground = function(aElmt, aColor) {
  aElmt.style.backgroundImage = "-moz-linear-gradient(top, rgba(" + aColor + ",0.1), rgba(" + aColor + ",0.3))";
  aElmt.style.borderColor = "rgba(" + aColor + ",0.9)";
}

/*
UserDisplay.prototype.getElementForResult = function(result) {
  let me = this;
  let e = doc.createElement('span');
  function escapeHTML(str) str.replace(/[&"<>]/g, function (m) "&" + ({ "&": "amp", '"': "quot", "<": "lt", ">": "gt" })[m] + ";");
  let f = doc.createElement('img');
  f.style.height = '16px';
  f.style.width = '16px';
  f.src = me.utils.getFaviconData(result.url);
  f.setAttribute("class", "favicon");
  let a = doc.createElement('a');
  a.setAttribute('href', result.url);
  a.innerHTML = result.title.length < 30 ? escapeHTML(result.title) : escapeHTML(result.title.slice(0, 25) + " ...");
  e.appendChild(f);
  e.appendChild(a);
  return e;
}
*/



exports.DisplaySites = new DisplaySites();