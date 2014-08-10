*** Workspace-aware AltTab for gnome-shell (3.8 and higher)

<h1>What's that</h1>
<h2>re-enables gnome-shell 3.6 AltTab behaviour in later versions, so that AltTab</h2>
 - Groups by applications (uses the AppSwitcher, not instead of the simple WindowSwitcher)
 - Is not restricted to the current workspace (diplays every window)
 - Sorts the Aps and Windows according to who's running where (current workspace first, then others)

<h1>Official Gnome Extension URL</h1>
https://extensions.gnome.org/extension/748/workspacealttab/

<h1>Screenshot</h1>
<img src='https://extensions.gnome.org/static/extension-data/screenshots/screenshot_748.png'/>

<h1>Manual install instructions</h1>
 - cd ~/.local/share/gnome-shell/extensions
 - git clone https://github.com/KrahnacK/workspaceAltTab.git
 - mv workspaceAltTab workspaceAltTab@KrahnacK
 - restart gnome-shell: Alt+F2 + r, or gnome-shell --replace & 

<h1>Debug instructions for gnome-shell extensions</h1>
 - see the logs in ~/.cache/gdm/session.log or ~/.xsession-errors
 - if none of the above work, then get the shell to output in a file: gnome-shell --replace &> shelllog &

