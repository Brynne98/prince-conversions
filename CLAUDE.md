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
- **Android:** `./build-and-submit.sh android`. Same build, then sent to
  Google Play's internal testing track as a draft: press release in Play
  Console to hand it to testers. The Google upload key is kept on the Expo
  account, not in the repo.
- **App Store listing text:** `app/store.config.json` holds the name,
  subtitle, description, keywords, promo text and What's New for the
  languages on the App Store: English (U.S.) only, by Brynne's choice
  (AFC-39). The other eight are written and kept in
  `app/store/apple-held-languages.json`; move one into `store.config.json`
  to put it on the store. Before a release, write the new What's New in every
  language, then run `npx eas-cli metadata:push` in `app/`. It changes text
  only: the file lists no screenshots and no review contact (the repo is
  public). A push never removes a language; that is done by hand in App Store
  Connect.
  Apple refuses the push while a version waits for review. After editing text
  in App Store Connect by hand, copy it back into the file;
  `npx eas-cli metadata:pull` overwrites the file and adds the review contact
  and screenshots, so never commit its output as it comes.
- **Google Play listing text:** `app/store/google-play/<language>/`, typed
  into Play Console by hand. The name and full description must match the
  App Store ones; the short description is Play's own. Only English is on
  Play; the other six wait, as on the App Store.

## Local checks

- `npx expo export --platform all` (run in `app/`) must exit 0.
- `node scripts/check-locales.js` (run in `app/`) must exit 0: every language
  file in `app/src/i18n/locales/` holds the same keys as `en.json`.
- `node scripts/check-store-listing.js` (run in `app/`) must exit 0: no empty
  listing field, nothing over a store's length limit, in either store.
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
