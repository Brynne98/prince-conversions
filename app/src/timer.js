import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

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

// ─── Multi cook timer hook ───────────────────────────────────────────
// Active timers count down; on expiry they switch to a "completed" state
// (don't auto-remove). The done chime then loops every ~2.6s until the
// user cancels or restarts that timer.
export function useCookTimers({ onShake, onDone } = {}) {
  const [timers, setTimers] = useState([]);
  const [now, setNow] = useState(Date.now());

  const timersRef = useRef(timers);
  useEffect(() => { timersRef.current = timers; }, [timers]);

  const hasActive = timers.some((t) => !t.completed);
  const hasCompleted = timers.some((t) => t.completed);

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

  const start = (minutes, label, opts = {}) => {
    const total = Math.max(1, Math.round(minutes * 60));
    const startedAt = Date.now();
    const id = `t${startedAt}_${Math.random().toString(36).slice(2, 7)}`;
    setTimers((curr) => [
      ...curr,
      {
        id,
        totalSec: total,
        startedAt,
        endsAt: startedAt + total * 1000,
        halfFiredAt: startedAt + Math.floor(total / 2) * 1000,
        halfFired: false,
        completed: false,
        remindHalfway: opts.remindHalfway !== false,
        label: label || '',
      },
    ]);
    setNow(startedAt);
    return id;
  };

  const cancel = (id) => setTimers((curr) => curr.filter((t) => t.id !== id));
  const cancelAll = () => setTimers([]);

  const restart = (id) =>
    setTimers((curr) =>
      curr.map((t) => {
        if (t.id !== id) return t;
        const startedAt = Date.now();
        return {
          ...t,
          startedAt,
          endsAt: startedAt + t.totalSec * 1000,
          halfFiredAt: startedAt + Math.floor(t.totalSec / 2) * 1000,
          halfFired: false,
          completed: false,
        };
      }),
    );

  const update = (id, fields) =>
    setTimers((curr) => curr.map((t) => (t.id === id ? { ...t, ...fields } : t)));

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
