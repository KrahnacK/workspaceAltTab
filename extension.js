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
let oldGetPreferredHeightAppSwitcher;
let oldInitThumbnailList;

function newInitThumbnailList (windows) {
   var parent = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._init);
   var addSep = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._addSeparator);
   parent(false);

   let activeWorkspace = global.screen.get_active_workspace();
   
   // We fake the value of 'separatorAdded' when the app has no window
   // on the current workspace, to avoid displaying a useless separator in
   // that case.
   let separatorAdded = windows.length == 0 || windows[0].get_workspace() != activeWorkspace;

   this._labels = new Array();
   this._thumbnailBins = new Array();
   this._clones = new Array();
   this._windows = windows;

   for (let i = 0; i < windows.length; i++) {
      if (!separatorAdded && windows[i].get_workspace() != activeWorkspace) {
         addSep();
         separatorAdded = true;
      }

      let box = new St.BoxLayout({ style_class: 'thumbnail-box',
         vertical: true });

      let bin = new St.Bin({ style_class: 'thumbnail' });

      box.add_actor(bin);
      this._thumbnailBins.push(bin);

      let title = windows[i].get_title();
      if (title) {
         let name = new St.Label({ text: title });
         // St.Label doesn't support text-align so use a Bin
         let bin = new St.Bin({ x_align: St.Align.MIDDLE });
         this._labels.push(bin);
         bin.add_actor(name);
         box.add_actor(bin);

         this.addItem(box, name);
      } else {
         this.addItem(box, null);
      }
   }

}

function newGetPreferredHeightAppSwitcher (actor, forWidth, alloc) {
   let j = 0;
   while(this._items.length > 1 && this._items[j].style_class != 'item-box') {
      j++;
   }
   let themeNode = this._items[j].get_theme_node();
   let iconPadding = themeNode.get_horizontal_padding();
   let iconBorder = themeNode.get_border_width(St.Side.LEFT) + themeNode.get_border_width(St.Side.RIGHT);
   let [iconMinHeight, iconNaturalHeight] = this.icons[j].label.get_preferred_height(-1);
   let iconSpacing = iconNaturalHeight + iconPadding + iconBorder;
   let totalSpacing = this._list.spacing * (this._items.length - 1);
   if (this._separator)
      totalSpacing += this._separator.width + this._list.spacing;

   // We just assume the whole screen here due to weirdness happing with the passed width
   let primary = Main.layoutManager.primaryMonitor;
   let parentPadding = this.actor.get_parent().get_theme_node().get_horizontal_padding();
   let availWidth = primary.width - parentPadding - this.actor.get_theme_node().get_horizontal_padding();
   let height = 0;

   for(let i =  0; i < AltTab.iconSizes.length; i++) {
      this._iconSize = AltTab.iconSizes[i];
      height = AltTab.iconSizes[i] + iconSpacing;
      let w = height * this._items.length + totalSpacing;
      if (w <= availWidth)
         break;
   }

   if (this._items.length == 1) {
      this._iconSize = AltTab.iconSizes[0];
      height = AltTab.iconSizes[0] + iconSpacing;
   }

   for(let i = 0; i < this.icons.length; i++) {
      if (this.icons[i].icon != null)
         break;
      this.icons[i].set_size(this._iconSize);
   }

   alloc.min_size = height;
   alloc.natural_size = height;
}

function _newInitAppSwitcher(localApps, otherApps, altTabPopup) {
   var parent = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._init);
   var addSep = Lang.bind(this, SwitcherPopup.SwitcherList.prototype._addSeparator);

   //from gnome-shell 3.8
   parent(true);

   //from gnome-shell 3.6 part

   // Construct the AppIcons, add to the popup
   let activeWorkspace = global.screen.get_active_workspace();
   let workspaceIcons = [];
   let otherIcons = [];

   //re-order localApps in case a window from another 
   //workspace was raised
   let localAppIndex = -1;
   let raisedApps = [];
   for (let i = 0; i < localApps.length; i++) {
      let isRaised = true;
      let w = localApps[i].get_windows();
      for (let j = 0; j < w.length; j++) {
         isRaised &= w[j].get_workspace() != activeWorkspace;
      }
      if (isRaised) {
         raisedApps.push(localApps[i]);
      } else if (localAppIndex == -1) {
         localAppIndex = i;
      }
   }
   let localAppToMove = localApps.splice(localAppIndex, 1);
   localApps.unshift(localAppToMove[0]);

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

   //and end with a part from gnome-shell 3.8
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

   if (apps.length == 0 && allApps.length == 0)
      return false;

   this._switcherList = new AltTab.AppSwitcher(apps, allApps, this);
   this._items = this._switcherList.icons;

   return true;
}

//SwitcherList modifications
let oldAddSeparator;
let oldGetPreferredWidth;
let oldAllocate;

function newAddSeparator() {
   let box = new St.Bin({ style_class: 'separator' });
   this._separator = box;
   this._list.add_actor(box);
}

function newGetPreferredWidth(actor, forHeight, alloc) {
   let [maxChildMin, maxChildNat] = this._maxChildWidth(forHeight);

   let separatorWidth = 0;
   if (this._separator) {
      let [sepMin, sepNat] = this._separator.get_preferred_width(forHeight);
      separatorWidth = sepNat + this._list.spacing;
   }

   let totalSpacing = this._list.spacing * (this._items.length - 1);
   alloc.min_size = this._items.length * maxChildMin + separatorWidth + totalSpacing;
   alloc.natural_size = alloc.min_size;
   this._minSize = alloc.min_size;
}

function newAllocate(actor, box, flags) {
   let childHeight = box.y2 - box.y1;

   let [maxChildMin, maxChildNat] = this._maxChildWidth(childHeight);
   let totalSpacing = this._list.spacing * (this._items.length - 1);

   let separatorWidth = 0;
   if (this._separator) {
      let [sepMin, sepNat] = this._separator.get_preferred_width(childHeight);
      separatorWidth = sepNat;
      totalSpacing += this._list.spacing;
   }

   let childWidth = Math.floor(Math.max(0, box.x2 - box.x1 - totalSpacing - separatorWidth) / this._items.length);

   let x = 0;
   let children = this._list.get_children();
   let childBox = new Clutter.ActorBox();

   let primary = Main.layoutManager.primaryMonitor;
   let parentRightPadding = this.actor.get_parent().get_theme_node().get_padding(St.Side.RIGHT);

   for (let i = 0; i < children.length; i++) {
      if (this._items.indexOf(children[i]) != -1) {
         let [childMin, childNat] = children[i].get_preferred_height(childWidth);
         let vSpacing = (childHeight - childNat) / 2;
         childBox.x1 = x;
         childBox.y1 = vSpacing;
         childBox.x2 = x + childWidth;
         childBox.y2 = childBox.y1 + childNat;
         children[i].allocate(childBox, flags);

         x += this._list.spacing + childWidth;
      } else if (children[i] == this._separator) {
         // We want the separator to be more compact than the rest.
         childBox.x1 = x;
         childBox.y1 = 0;
         childBox.x2 = x + separatorWidth;
         childBox.y2 = childHeight;
         children[i].allocate(childBox, flags);
         x += this._list.spacing + separatorWidth;
      } else {
         // Something else, eg, AppSwitcher's arrows;
         // we don't allocate it.
      }
   }
}

function init() {
   oldCreateSwitcherPopup = AltTab.AppSwitcherPopup.prototype._createSwitcher;
   oldInitAppSwitcher = AltTab.AppSwitcher.prototype._init;
   oldGetPreferredHeightAppSwitcher = AltTab.AppSwitcher.prototype._getPreferredHeight;
   oldInitThumbnailList = AltTab.ThumbnailList.prototype._init;

   //SwitcherList modifications
   oldAddSeparator = SwitcherPopup.SwitcherList.prototype._addSeparator; //inexistant as of now
   oldGetPreferredWidth = SwitcherPopup.SwitcherList.prototype._getPreferredWidth;
   oldAllocate = SwitcherPopup.SwitcherList.prototype._allocate;
}

function enable() {
   AltTab.AppSwitcherPopup.prototype._createSwitcher = newCreateSwitcherPopup;
   AltTab.AppSwitcher.prototype._init = _newInitAppSwitcher;
   AltTab.AppSwitcher.prototype._getPreferredHeight = newGetPreferredHeightAppSwitcher;
   AltTab.ThumbnailList.prototype._init = newInitThumbnailList;

   //SwitcherList modifications
   SwitcherPopup.SwitcherList.prototype._addSeparator = newAddSeparator;
   SwitcherPopup.SwitcherList.prototype._allocate = newAllocate;
   SwitcherPopup.SwitcherList.prototype._getPreferredWidth= newGetPreferredWidth;
}

function disable() {
   AltTab.AppSwitcherPopup.prototype._createSwitcher = oldCreateSwitcherPopup;
   AltTab.AppSwitcher.prototype._init = oldInitAppSwitcher;
   AltTab.AppSwitcher.prototype._getPreferredHeight = oldGetPreferredHeightAppSwitcher;
   AltTab.ThumbnailList.prototype._init = oldInitThumbnailList;
   
   //SwitcherList modifications
   SwitcherPopup.SwitcherList.prototype._addSeparator = oldAddSeparator;
   SwitcherPopup.SwitcherList.prototype._allocate = oldAllocate;
   SwitcherPopup.SwitcherList.prototype._getPreferredWidth= oldGetPreferredWidth;
}
