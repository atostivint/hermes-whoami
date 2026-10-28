# Whoami

A Hermes Desktop plugin that shows which Hermes profile the composer will create a new session on.

## What it does

Whoami adds a coloured pill to the composer toolbar, next to the model pill, with the name of the active profile. It also adds a small dot to the status bar. Both read the same profile state, so the profile a new session will use is visible at a glance. When the app is in the all-profiles scope there is no active profile, and the pill shows a grey `no profile` instead.

## Why

Hermes Desktop does not label the profile you are drafting in. With several profiles configured it is easy to start a session in the wrong one and only notice later. Whoami makes the target profile explicit before you send anything.

## Install

Clone into the desktop plugins folder. The folder name must be `whoami`:

```sh
git clone https://github.com/atostivint/hermes-whoami.git "$HERMES_HOME/desktop-plugins/whoami"
```

Then press Command-K and run `Reload desktop plugins`.

`$HERMES_HOME` is usually `~/.hermes`. On a Linux server it is normally `/var/lib/hermes-agent/.hermes`. If you are unsure, open Settings -> Plugins, which shows the exact folder Hermes reads plugins from.

## Configure

Open the Whoami pane (right side) to set colours:

- **Mode** toggles between `accent` and `per-profile`. In `accent` mode the dot uses the app accent colour. In `per-profile` mode, the default, each profile gets its own colour.
- **Swatches** set an explicit colour for a profile. Pick one of eight presets; the choice is stored by profile name.
- **Reset** clears the override for that profile, after which the colour is derived deterministically from the profile name again, so it stays stable across restarts.

Preferences live in the plugin storage namespace under the key `whoami.prefs` and look like `{ "mode": "profile", "colors": { "work": "cyan" } }`.

## Limitations

- **Read-only by design.** The SDK exposes `host.state.profile` but no profile-switch verb, so Whoami reports the scope and never changes it.
- Requires Hermes Desktop 0.21.5 or newer for the `composer.actions` area. If only the status-bar dot appears, the composer seam is missing on that build.
- The pill and the status-bar dot read the same atom. If the pill shows a stale profile after a switch, open an issue with the values of `host.state.profile`.

## Uninstall

Delete the `whoami` folder from `$HERMES_HOME/desktop-plugins/` and reload desktop plugins.

## License

MIT
