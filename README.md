*** Workspace-aware AltTab for gnome-shell 3.8

* What's that:
re-enables gnome-shell 3.6 AltTab behaviour in 3.8, so that AltTab:
 - Groups by applications (uses the AppSwitcher, not instead of WindowSwitcher)
 - Is not restricted to the current workspace
 - Sorts the Apps according to the windows running in the current workspace (it prefers apps from current workspace, but display apps from all workspaces)

* Installation:
 - cd ~/.local/share/gnome-shell/extensions
 - git clone https://github.com/KrahnacK/workspaceAltTab.git
 - mv workspaceAltTab workspaceAltTab@hotwok
 - restart gnome-shell: Alt+F2 + r, or gnome-shell --replace & 

* Debug instructions for gnome-shell extensions: 
 - see the logs in ~/.cache/gdm/session.log or ~/.xsession-errors
 - if none of the above work, then get the shell to output in a file: gnome-shell --replace &> shelllog &

