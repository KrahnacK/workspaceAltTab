/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const SwitcherPopup = imports.ui.switcherPopup;
const St = imports.gi.St;
const Main = imports.ui.main;


let oldCreateSwitcherPopup;
let oldInitAppSwitcher;
let oldAddSeparator;

function _newInitAppSwitcher(localApps, otherApps, altTabPopup) {
   var parent = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._init);
   var addSep = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._addSeparator);

   //gnome-shell 3.8
   parent(true);

   //gnome-shell 3.6 part

   // Construct the AppIcons, add to the popup
   let activeWorkspace = global.screen.get_active_workspace();
   let workspaceIcons = [];
   let otherIcons = [];
   for (let i = 0; i < localApps.length; i++) {
      let appIcon = new AltTab.AppIcon(localApps[i]);
      // Cache the window list now; we don't handle dynamic changes here,
      // and we don't want to be continually retrieving it
      appIcon.cachedWindows = appIcon.app.get_windows();
      workspaceIcons.push(appIcon);
   }
   for (let i = 0; i < otherApps.length; i++) {
      let appIcon = new AltTab.AppIcon(otherApps[i]);
      appIcon.cachedWindows = appIcon.app.get_windows();
      otherIcons.push(appIcon);
   }

   this.icons = [];
   this._arrows = [];
   for (let i = 0; i < workspaceIcons.length; i++)
      this._addIcon(workspaceIcons[i]);
   if (workspaceIcons.length > 0 && otherIcons.length > 0)
      addSep();
   for (let i = 0; i < otherIcons.length; i++)
      this._addIcon(otherIcons[i]);

   this._curApp = -1;
   this._iconSize = 0;
   this._altTabPopup = altTabPopup;
   this._mouseTimeOutId = 0;

   //and end with a gnome-shell 3.8 part
   this.actor.connect('destroy', Lang.bind(this, this._onDestroy));
}

function newCreateSwitcherPopup() {

   let tracker = Shell.WindowTracker.get_default();
   let windows = global.display.get_tab_list(Meta.TabList.NORMAL, global.screen, global.screen.get_active_workspace());
   let allApps = Shell.AppSystem.get_default().get_running ();

   // windows is only the windows on the current workspace. For
   // each one, if it corresponds to an app we know, move that
   // app from allApps to apps.
   let apps = [];
   for (let i = 0; i < windows.length && allApps.length != 0; i++) {
      let app = tracker.get_window_app(windows[i]);
      let index = allApps.indexOf(app);
      if (index != -1) {
         apps.push(app);
         allApps.splice(index, 1);
      }
   }

   let finalApps = apps.concat(allApps);

   if (finalApps.length == 0)
      return false;

   this._switcherList = new AltTab.AppSwitcher(apps, allApps, this);
   this._items = this._switcherList.icons;

   return true;
}


function newAddSeparator() {
   let box = new St.Bin({ style_class: 'separator' });
   this._separator = box;
   this._list.add_actor(box);
}


function init() {
   oldCreateSwitcherPopup = AltTab.AppSwitcherPopup.prototype._createSwitcher;
   oldInitAppSwitcher = AltTab.AppSwitcher.prototype._init;
   oldAddSeparator = SwitcherPopup.SwitcherList.prototype._addSeparator;
}

function enable() {
   AltTab.AppSwitcherPopup.prototype._createSwitcher = newCreateSwitcherPopup;
   AltTab.AppSwitcher.prototype._init = _newInitAppSwitcher;
   SwitcherPopup.SwitcherList.prototype._addSeparator = newAddSeparator;
}

function disable() {
   AltTab.AppSwitcherPopup.prototype._createSwitcher = oldCreateSwitcherPopup;
   AltTab.AppSwitcher.prototype._init = oldInitAppSwitcher;
   SwitcherPopup.SwitcherList.prototype._addSeparator = oldAddSeparator;
}
