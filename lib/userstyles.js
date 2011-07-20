/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UserStyles Jetpack Library.
 *
 * The Initial Developer of the Original Code is Erik Vold.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 */


var {Cc,Ci} = require("chrome");

/**
 * Load various packaged styles for the add-on and undo on unload
 *
 * @usage load(aURL): Load specified style
 * @param [string] aURL: Style file to load
 */
exports.load = function load(aURL) {
  var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
      .getService(Ci.nsIStyleSheetService);
  var uri = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService).newURI(aURL, null, null);
  sss.loadAndRegisterSheet(uri, sss.USER_SHEET);

  require("unload").when(function() {
    sss.unregisterSheet(uri, sss.USER_SHEET);
  });
}

exports.registered = function(aURL) {
  var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
      .getService(Ci.nsIStyleSheetService);
  var uri = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService).newURI(aURL, null, null);
  return sss.sheetRegistered(uri, sss.USER_SHEET);
}
