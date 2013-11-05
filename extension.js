/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;


let oldGetAppList;//mine

let button;//test

function newGetAppList() {
   /*
    * from gnome-shell 3.6
    */
   /*
   let tracker = Shell.WindowTracker.get_default();
   let appSys = Shell.AppSystem.get_default();
   let allApps = appSys.get_running ();

   let screen = global.screen;
   let display = screen.get_display();
   let windows = display.get_tab_list(Meta.TabList.NORMAL_ALL, screen,
         screen.get_active_workspace());

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

   // Now @apps is a list of apps on the current workspace, in
   // standard Alt+Tab order (MRU except for minimized windows),
   // and allApps is a list of apps that only appear on other
   // workspaces, sorted by user_time, which is good enough.
   return [apps, allApps];
   */
   /*
    * adaptation
    */
   /*
   let apps = global.display.get_tab_list(Meta.TabList.NORMAL, global.screen, global.screen.get_active_workspace());
   let otherApps = global.display.get_tab_list(Meta.TabList.NORMAL, global.screen, null);
   return [apps, otherApps];
   */
   return null;
}

/* HelloTest */
function _hideHello() {
   Main.uiGroup.remove_actor(text);
   text = null;
}

function _showHello() {
   if (!text) {
      text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
      Main.uiGroup.add_actor(text);
   }

   text.opacity = 255;

   let monitor = Main.layoutManager.primaryMonitor;

   text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
         Math.floor(monitor.height / 2 - text.height / 2));

   Tweener.addTween(text,
         { opacity: 0,
            time: 2,
      transition: 'easeOutQuad',
      onComplete: _hideHello });
}
/* end HelloTest */

function init() {
   //test
   button = new St.Bin({ style_class: 'panel-button',
      reactive: true,
          can_focus: true,
          x_fill: true,
          y_fill: false,
          track_hover: true });
   let icon = new St.Icon({ icon_name: 'system-run-symbolic',
      style_class: 'system-status-icon' });

   button.set_child(icon);
   button.connect('button-press-event', _showHello);
   //end of test
   oldGetAppList = AltTab.AppSwitcherPopup.prototype._getAppList;//mine
}

function enable() {
   Main.panel._rightBox.insert_child_at_index(button, 0);//test
   AltTab.AppSwitcherPopup.prototype._getAppList = newGetAppList;//mine
}

function disable() {
   Main.panel._rightBox.remove_child(button);//test
   AltTab.AppSwitcherPopup.prototype._getAppList = oldGetAppList;//mine
}
