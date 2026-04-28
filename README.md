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
