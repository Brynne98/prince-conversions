import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {
  ensureNotificationPermission,
  scheduleTimerNotifications,
  cancelTimerNotifications,
  dismissDeliveredNotifications,
} from './notifications';

let audioConfigured = false;
async function ensureAudioMode() {
  if (audioConfigured) return;
  audioConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch {}
}

const donePlayer = createAudioPlayer(require('../assets/sounds/done.wav'));
const shakePlayer = createAudioPlayer(require('../assets/sounds/shake.wav'));

function play(player) {
  ensureAudioMode();
  try {
    player.seekTo(0);
    player.play();
  } catch {}
}
export const playDone = () => play(donePlayer);
export const playShake = () => play(shakePlayer);

const DONE_LOOP_MS = 2600;

// Active timers survive the app being backgrounded or killed: they are
// persisted here and their alerts are scheduled with the OS (see
// notifications.js), so a locked phone still rings.
const TIMERS_KEY = '@afc/timers-v1';
// A timer that finished this long ago is dropped on restore instead of
// ringing the moment the app is reopened the next day.
const STALE_AFTER_MS = 60 * 60 * 1000;

async function loadTimers() {
  try {
    const raw = await AsyncStorage.getItem(TIMERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveTimers(list) {
  try {
    await AsyncStorage.setItem(TIMERS_KEY, JSON.stringify(list));
  } catch {}
}

function makeTimer(id, totalSec, label, remindHalfway, startedAt) {
  return {
    id,
    totalSec,
    startedAt,
    endsAt: startedAt + totalSec * 1000,
    halfFiredAt: startedAt + Math.floor(totalSec / 2) * 1000,
    halfFired: false,
    completed: false,
    remindHalfway,
    label: label || '',
    notificationIds: null,
  };
}

// ─── Multi cook timer hook ───────────────────────────────────────────
// Active timers count down; on expiry they switch to a "completed" state
// (don't auto-remove). The done chime then loops every ~2.6s until the
// user cancels or restarts that timer.
export function useCookTimers({ onShake, onDone } = {}) {
  const [timers, setTimers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [restored, setRestored] = useState(false);

  const timersRef = useRef(timers);
  useEffect(() => { timersRef.current = timers; }, [timers]);

  const hasActive = timers.some((t) => !t.completed);
  const hasCompleted = timers.some((t) => t.completed);

  // Restore timers from the previous session. Ones that ended long ago
  // are discarded; ones that ended recently come back completed and ring.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await loadTimers();
      const nowMs = Date.now();
      const keep = [];
      for (const t of saved) {
        if (nowMs - t.endsAt < STALE_AFTER_MS) keep.push(t);
        else cancelTimerNotifications(t.notificationIds);
      }
      if (!active) return;
      if (keep.length) {
        setTimers(keep);
        setNow(nowMs);
      }
      setRestored(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!restored) return;
    saveTimers(timers);
  }, [restored, timers]);

  // Tick whenever any timer is still counting down.
  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [hasActive]);

  // Re-sync immediately on foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  // Loop the done chime while any timer is in completed state.
  useEffect(() => {
    if (!hasCompleted) return;
    const id = setInterval(() => {
      playDone();
    }, DONE_LOOP_MS);
    return () => clearInterval(id);
  }, [hasCompleted]);

  // Fire shake / done events as each timer crosses thresholds.
  useEffect(() => {
    const curr = timersRef.current;
    if (curr.length === 0) return;
    let changed = false;
    const next = [];
    for (const t of curr) {
      // Already completed: leave alone (chime loop handles ringing).
      if (t.completed) {
        next.push(t);
        continue;
      }
      // Just expired: mark completed and fire the first chime.
      if (now >= t.endsAt) {
        changed = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playDone();
        onDone?.(t);
        next.push({ ...t, completed: true });
        continue;
      }
      // Hit halfway threshold.
      if (t.remindHalfway && !t.halfFired && now >= t.halfFiredAt) {
        changed = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        playShake();
        onShake?.(t);
        next.push({ ...t, halfFired: true });
        continue;
      }
      next.push(t);
    }
    if (changed) setTimers(next);
  }, [now, onShake, onDone]);

  // Schedule the OS alerts for a timer and attach their ids to it. If the
  // timer was cancelled before scheduling finished, undo the schedule.
  const attachNotifications = async (timer, opts) => {
    const ids = await scheduleTimerNotifications(timer, opts);
    if (!ids.done && !ids.half) return;
    setTimers((curr) => {
      if (!curr.some((t) => t.id === timer.id)) {
        cancelTimerNotifications(ids);
        return curr;
      }
      return curr.map((t) =>
        t.id === timer.id
          ? {
              ...t,
              notificationIds: {
                done: ids.done ?? t.notificationIds?.done ?? null,
                half: ids.half ?? t.notificationIds?.half ?? null,
              },
            }
          : t,
      );
    });
  };

  const start = (minutes, label, opts = {}) => {
    const total = Math.max(1, Math.round(minutes * 60));
    const startedAt = Date.now();
    const id = `t${startedAt}_${Math.random().toString(36).slice(2, 7)}`;
    const timer = makeTimer(id, total, label, opts.remindHalfway !== false, startedAt);
    setTimers((curr) => [...curr, timer]);
    setNow(startedAt);
    (async () => {
      if (await ensureNotificationPermission()) await attachNotifications(timer);
    })();
    return id;
  };

  const cancel = (id) => {
    const t = timersRef.current.find((x) => x.id === id);
    if (t) cancelTimerNotifications(t.notificationIds);
    setTimers((curr) => curr.filter((x) => x.id !== id));
    dismissDeliveredNotifications();
  };

  const cancelAll = () => {
    for (const t of timersRef.current) cancelTimerNotifications(t.notificationIds);
    setTimers([]);
    dismissDeliveredNotifications();
  };

  const restart = (id) => {
    const old = timersRef.current.find((x) => x.id === id);
    if (!old) return;
    cancelTimerNotifications(old.notificationIds);
    dismissDeliveredNotifications();
    const fresh = makeTimer(id, old.totalSec, old.label, old.remindHalfway, Date.now());
    setTimers((curr) => curr.map((t) => (t.id === id ? fresh : t)));
    setNow(fresh.startedAt);
    attachNotifications(fresh);
  };

  const update = (id, fields) => {
    const old = timersRef.current.find((x) => x.id === id);
    setTimers((curr) => curr.map((t) => (t.id === id ? { ...t, ...fields } : t)));
    if (!old || !('remindHalfway' in fields) || old.completed) return;
    // Keep the halfway alert in step with the toggle on the timer screen.
    if (!fields.remindHalfway) {
      cancelTimerNotifications({ done: null, half: old.notificationIds?.half });
      setTimers((curr) => curr.map((t) => (
        t.id === id && t.notificationIds
          ? { ...t, notificationIds: { ...t.notificationIds, half: null } }
          : t
      )));
    } else if (!old.halfFired) {
      attachNotifications({ ...old, remindHalfway: true }, { done: false, half: true });
    }
  };

  const list = timers.map((t) => ({
    ...t,
    remainingSec: t.completed
      ? 0
      : Math.max(0, Math.ceil((t.endsAt - now) / 1000)),
    elapsedFrac: t.completed
      ? 1
      : Math.max(0, Math.min(1, (now - t.startedAt) / (t.totalSec * 1000))),
  }));

  return { list, start, cancel, cancelAll, restart, update };
}

export function formatRemaining(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
