import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Soft Pro paywall: after a few completed cooks, at most once per app version.
// Never mid-cook — callers must pass canShow=false while TimerScreen is open
// or any timer is still running.
const KEY = '@afc/soft-paywall-v1';
const ASK_AFTER_COMPLETIONS = 3;
const PROMPT_DELAY_MS = 2200;
const APP_VERSION = Constants.expoConfig?.version ?? '0';

async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return {
      completions: Number(s?.completions) || 0,
      shownVersion: typeof s?.shownVersion === 'string' ? s.shownVersion : null,
    };
  } catch {
    return { completions: 0, shownVersion: null };
  }
}

async function save(s) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

let pending = false;

/**
 * Record a timer completion and maybe offer the soft paywall.
 * @param {{ isPro: boolean, canShow: boolean, onOffer: () => void }} opts
 * @returns {Promise<{ offered: boolean }>}
 */
export async function recordCompletionForSoftPaywall({ isPro, canShow, onOffer }) {
  const s = await load();
  s.completions += 1;
  await save(s);

  if (isPro) return { offered: false };
  if (s.shownVersion === APP_VERSION) return { offered: false };
  if (s.completions < ASK_AFTER_COMPLETIONS) return { offered: false };
  if (!canShow) return { offered: false };
  if (pending) return { offered: false };

  pending = true;
  const fire = async () => {
    pending = false;
    // Re-check version gate in case of races.
    const latest = await load();
    if (latest.shownVersion === APP_VERSION) return;
    latest.shownVersion = APP_VERSION;
    await save(latest);
    onOffer?.();
  };

  const schedule = () => setTimeout(fire, PROMPT_DELAY_MS);
  if (AppState.currentState === 'active') {
    schedule();
  } else {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      sub.remove();
      schedule();
    });
  }
  return { offered: true };
}
