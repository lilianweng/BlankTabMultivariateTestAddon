const {Cc,Ci,Cu,components} = require("chrome");
const data = require("self").data;

var helpers = require("helpers");
var ss = require("simple-storage");

DisplaySites = function(){
  let me = this;
  // hashtable, mapping of url -> boolean
  if(ss.storage._blockedSites == undefined)
    ss.storage._blockedSites = {};
  if(ss.storage._pinnedSites == undefined)
    ss.storage._pinnedSites = {};
  me._designIndex  = ss.storage._designIndex;
}

DisplaySites.prototype.loadResults = function(numResults, results, doc) {
  let me = this;
  me.doc = doc;
  let $ = me.doc.getElementById;
  let noResults = true;
  for(let i=0; i<results.length && i<numResults; i++) {
    noResults = false;
    let elem = me.createSiteItem(results[i], doc);
    $('content').appendChild(elem);
  }

  if (noResults) {
    $('no-results').style.display = 'block';
  }
  
  // clean all blocked sites
  $("clean-blocked").addEventListener("click", function(event){
	  ss.storage._blockedSites = {};
  }, false);

  // clean all starred sites
  $("clean-star").addEventListener("click", function(event){
	  ss.storage._pinnedSites = {};
  }, false);

}

DisplaySites.prototype.createSiteItem = function(result) {
  let me = this;
  let doc = me.doc;
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
    colorBackground(imageContainer, color);
  } else {
    imageItem.addEventListener("load", function() {
        color = helpers.helpers.getFaviconColor(this, doc);
        colorBackground(imageContainer, color);
    }, false);
  }

  let urlItem = doc.createElement("a");
  urlItem.className = "url-item";    
  urlItem.href = result.url;
  let title = result.url;
  if(result.title != undefined && result.title != null){
    title = result.title;
  }
  try{
    if(title.length>50) title = title.slice(0,50) + " ..." ;
  }catch(err){}
  
  urlItem.textContent = title;
  urlItem.title = title;

  // remove button
  let removeButton = doc.createElement("img");
  removeButton.className = "remove-button";
  removeButton.setAttribute("url", result.url);
  removeButton.setAttribute("src", data.url("img/close.png"));
  removeButton.addEventListener("click", function(event){me.removeSiteItem(event,doc);}, false);


  // pin button
  let pinButton = doc.createElement("img");
  pinButton.className = "pin-button";
  pinButton.setAttribute("url", result.url);
  pinButton.setAttribute("src", data.url("img/starPage.png"));
  pinButton.addEventListener("click", function(event){me.updatePinnedState(event,doc);}, false);
  if (result.pinned) {
    pinButton.setAttribute("pinned", true);
    pinButton.setAttribute("src", data.url("img/pageStarred.png"));
  }


  // the site item, one block for one site
  let siteItem = doc.createElement("div");
  siteItem.setAttribute("url", result.url);
  siteItem.className = "site-item";
  siteItem.appendChild(pinButton);
  siteItem.appendChild(removeButton);
  siteItem.appendChild(imageContainer);
  siteItem.appendChild(urlItem);

/*
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
        me.moveDroppedSite(itemToDrop.getAttribute("url"), targetItem.getAttribute("url"));
      }
      event.preventDefault();
    }
  }, false);
*/

  return siteItem;
}





// ----------------------------------
// site management
DisplaySites.prototype.removeSiteItem = function(event, doc) {
  let me = this;
  let siteURL = event.target.getAttribute("url");
  console.log("remove "+siteURL);
  ss.storage._blockedSites[siteURL] = true;

  let siteItem = doc.querySelector(".site-item[url='" + siteURL + "']");
  siteItem.addEventListener("transitionend", function() {
    siteItem.parentNode.removeChild(siteItem);    
    /*
    NewTabUtils.findNewSite(function(aSite) {
      let container = document.getElementById("sites-container");
      let siteItem = NewTabPage.createSiteItem(aSite);
      container.appendChild(siteItem);
    });
    */
  }, false);
  siteItem.setAttribute("removing", true);
}


DisplaySites.prototype.updatePinnedState = function(event, doc) {
  let saveButton = event.target;
  let siteURL = saveButton.getAttribute("url");
  let pinned = !saveButton.hasAttribute("pinned");
  if (pinned) {
    saveButton.setAttribute("pinned", true);
    saveButton.setAttribute("src", data.url("img/pageStarred.png"));
    ss.storage._pinnedSites[siteURL] = true;
  } else {
    saveButton.removeAttribute("pinned");
    if(ss.storage._pinnedSites[siteURL] != undefined)
      delete ss.storage._pinnedSites[siteURL];
  }
  
}

// ----------------------------------
// Helper functions

// Set up image container gradient color background
function colorBackground(aElmt, aColor) {
  aElmt.style.backgroundImage = "-moz-linear-gradient(top, rgba(" + aColor + ",0.1), rgba(" + aColor + ",0.3))";
  aElmt.style.borderColor = "rgba(" + aColor + ",0.9)";
}


exports.DisplaySites = new DisplaySites();