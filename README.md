# Air Fryer Converter

An iOS app that converts oven recipes to air-fryer time + temperature, lets
you save recipes, and runs concurrent cook timers with a "shake halfway"
reminder.

Built with Expo SDK 54 / React Native, intended to ship via EAS Build to
TestFlight.

## What's in here

- `design/` — the original HTML / JSX prototype (`Air Fryer Converter.html`
  and the screen / device-frame mocks the prototype was built from). Useful
  as a visual reference for the warm cream + terracotta aesthetic.
- `app/` — the actual React Native app.

## Features

- Two-way conversion (oven ↔ air fryer) with °F / °C unit toggle, stepping
  in 5° increments. Hold the +/- buttons to auto-repeat with accelerating
  speed and per-tick haptics.
- Saved recipes, persisted via AsyncStorage. Save sheet has a scrollable
  emoji picker, custom-emoji input, and notes.
- Cook timer launched from the result card or by saving a recipe.
- Multi-timer support: timers stack iOS-notification-style at the bottom,
  collapsed by default with a peek; tap to expand into a full list.
- Full-page timer screen with an animated SVG progress ring, accurate even
  after backgrounding.
- "Shake halfway" chime + haptic at the midpoint, toggleable per timer
  from the full-page view.
- When a timer ends, it stays in the list and the chime loops every 2.6s
  until you cancel or restart it. Restart resets the same timer to its
  original duration.
- Two distinct chime sounds (generated programmatically — see
  `app/scripts/make-sounds.js`): a warm major-arpeggio bell for "done" and
  two bright dings for "shake halfway". Plays with the iOS silent switch on.
- Animated splash: degree-mark bounces onto the F with squash-and-stretch.

## Run locally

```sh
cd app
npx expo start
```

Press `i` to launch the iOS simulator.

## Product analytics

The app sends a small set of anonymous, manually defined product events
to PostHog when it is configured. Autocapture, session replay, and
user-entered recipe content are excluded.

1. Create an EU-hosted project at https://eu.posthog.com.
2. Copy `app/.env.example` to `app/.env.local`.
3. Add the PostHog project token. This is a public client token, not a
   personal or secret API key.
4. Add the same `EXPO_PUBLIC_POSTHOG_API_KEY` and
   `EXPO_PUBLIC_POSTHOG_HOST` variables to the EAS production environment.
5. Enable impression-level ad revenue in AdMob if you want
   `ad_revenue_recorded` events in addition to ad impressions.

Analytics remains a no-op when no project token is configured and is
disabled in development by default. Users can turn it off in Settings.
Update the App Store privacy disclosure before releasing this version.

## Timers in the background

Active timers are persisted (`@afc/timers-v1`) and their alerts are
scheduled with the OS via `expo-notifications` (`src/notifications.js`), so
a locked phone still gets the "shake halfway" and "done" alerts with the
app's own chimes. Notification permission is requested the first time a
timer starts. In the foreground the system notification is silenced and
the in-app chime / toast handles it. Timers that finished more than an
hour ago are dropped on the next launch instead of ringing.

`app.json` declares the iOS time-sensitive entitlement and Android's
`USE_EXACT_ALARM` so alerts land on time; Play Console asks you to
justify the latter (the app runs cook timers).

## Ad consent (UMP)

`initAds()` runs Google's User Messaging Platform consent flow before
initialising AdMob, then the ATT prompt on iOS. For the form to appear you
must publish a GDPR message (and, optionally, a US states message) under
AdMob → Privacy & messaging for this app; without one, EEA/UK users get no
ads. Settings shows an "Ad privacy options" row only where the SDK says one
is required.

The Android banner unit ID in `src/ads.js` is `null` until the Android app
exists in AdMob; until then Android builds serve Google's test banner. The
`androidAppId` in `app.json` is likewise Google's sample ID and must be
replaced.

## Review prompt and sharing

`src/review.js` asks for an App Store / Play rating after three completed
timers, once per app version, only while the app is in the foreground.
The share button on the result card sends
`425°F oven for 25 min → 400°F air fryer for 20 min` with the App Store link.

## Build for TestFlight

```sh
cd app
npx eas-cli login
npx eas-cli init                                  # one-time, populates extra.eas.projectId
npx eas-cli build --platform ios --profile production
# fill in submit.production.ios in eas.json (appleId, ascAppId, appleTeamId)
npx eas-cli submit --platform ios --latest
```

## Regenerate assets

```sh
cd app
node scripts/make-icon.js     # icon.png, adaptive-icon.png, splash.png, favicon.png
node scripts/make-sounds.js   # done.wav, shake.wav
```
