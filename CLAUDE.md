# Air Fryer Converter

## Where this lives

- **Code:** GitHub, `Brynne98/prince-conversions` (personal account, not `brynneprince`).
- **Remote auth:** SSH, `git@github.com:Brynne98/prince-conversions.git`. The
  `github.com` entry in `~/.ssh/config` uses `~/.ssh/id_ed25519_personal`,
  which signs in as Brynne98. For `gh`, make sure Brynne98 is the active account.
- **Commit identity:** `brynneprince98@gmail.com` (set in this repo's git config;
  the global one is a work address).
- **Branch:** `main`. One short branch per ticket, merged into `main`.
- **Issues:** Plane, workspace `brynne98`, project "Air Fryer Converter",
  prefix `AFC`.
- **App:** Expo SDK 54 in `app/`. Bundle ID and package
  `com.brynneprince.airfryerconverter`. EAS owner `brynne98`.

## Releasing

Only on Brynne's say-so, every time.

- **iOS:** `./build-and-submit.sh` from the repo root. It runs
  `npx eas-cli build --platform ios --profile production --auto-submit`
  (build on EAS, then send to App Store Connect / TestFlight). Build numbers
  are kept on EAS (`appVersionSource: remote`, `autoIncrement`).
- **Android:** no release command yet. `eas.json` has no Android submit
  settings.

## Local checks

- `npx expo export --platform all` (run in `app/`) must exit 0.
- iOS run: `LANG=en_US.UTF-8 npx expo run:ios` (pod install crashes without it).
- Android run: AVD `AFC_Test_API_36` (`-port 5560 -no-window`), then
  `ANDROID_HOME=$HOME/Library/Android/sdk npx expo run:android --device AFC_Test_API_36`.
  `Pixel_8_API_34` and `Pixel_8_API_36` belong to other sessions.
- If the dev server serves old code: kill port 8081, then
  `npx expo start --dev-client --clear`, then relaunch the app.
- `console.log` does not reach the dev-server terminal (React Native 0.81);
  show state on screen temporarily instead.
- Dev builds use Google's test ad units automatically.

## Running the app in a task folder

A new folder has no iPhone project and must not compile one from zero.

- Screen-only change: no build. From the folder's `app/`, start its own code
  server on a free port, `npx expo start --dev-client --port <port>`, then
  point the app already on the simulator at it:
  `xcrun simctl openurl <udid> "princeconversions://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A<port>"`
  and tap Open.
- The simulator has no app yet, or native code changed: from `app/`,
  `SHARED_BUILD_CACHE=1 LANG=en_US.UTF-8 npx expo run:ios --device <udid> --no-bundler`.
  It installs a finished build with the same native code from
  `~/Library/Caches/prince-conversions/build-cache` instead of compiling.
  When nothing matches it compiles once and saves the result for the next
  folder. Simulators only, not a real phone.
- `SHARED_BUILD_CACHE` goes on the command line and nowhere else. In a
  package.json script or an env file it changes the native fingerprint.
- Old builds in that cache folder can be deleted.
