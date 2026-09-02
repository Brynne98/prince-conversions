import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { capture } from './analytics';

// Ask for a rating only after the user has finished a few cooks, and at
// most once per app version. The OS further rate-limits the prompt
// (Apple: three per year), so a request is not the same as a dialog.
const KEY = '@afc/review-v1';
const ASK_AFTER_COMPLETIONS = 3;
const PROMPT_DELAY_MS = 1500;
const APP_VERSION = Constants.expoConfig?.version ?? '0';

async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return {
      completions: Number(s?.completions) || 0,
      askedVersion: typeof s?.askedVersion === 'string' ? s.askedVersion : null,
    };
  } catch {
    return { completions: 0, askedVersion: null };
  }
}

async function save(s) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

let pending = false;

async function requestReview() {
  pending = false;
  try {
    const s = await load();
    if (s.askedVersion === APP_VERSION) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    s.askedVersion = APP_VERSION;
    await save(s);
    capture('review_requested', { completions: s.completions });
    await StoreReview.requestReview();
  } catch {}
}

// A timer can complete while the app is in the background; the prompt only
// makes sense once the user is back, and after the "Done" toast has shown.
function promptWhenActive() {
  if (pending) return;
  pending = true;
  const fire = () => setTimeout(requestReview, PROMPT_DELAY_MS);
  if (AppState.currentState === 'active') {
    fire();
    return;
  }
  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    sub.remove();
    fire();
  });
}

export async function recordTimerCompletion() {
  const s = await load();
  s.completions += 1;
  await save(s);
  if (s.completions >= ASK_AFTER_COMPLETIONS && s.askedVersion !== APP_VERSION) {
    promptWhenActive();
  }
}
