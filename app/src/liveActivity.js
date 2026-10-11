import { Platform } from 'react-native';

// Keeps the iPhone's Live Activities (lock screen and Dynamic Island) in step
// with the timers. Everywhere else, and on an iPhone build made before the
// widget code was added, this does nothing.
let Activity = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line global-require
    Activity = require('./CookActivity').default;
  } catch {}
}

// timer id -> { instance, sig }
const running = new Map();
let cleared = false;

// One activity per timer. It ends when the timer is done or cancelled: the
// app's own alert takes over from there.
export function syncCookActivities(timers) {
  if (!Activity) return;
  try {
    if (!cleared) {
      // Left over from the last time the app ran: this run starts its own.
      cleared = true;
      for (const stale of Activity.getInstances()) stale.end('immediate');
    }
    const live = new Map(timers.filter((x) => !x.completed).map((x) => [x.id, x]));
    for (const [key, entry] of running) {
      if (live.has(key)) continue;
      running.delete(key);
      // It may already be gone: swiped away, or ended by the system.
      try { entry.instance.end('immediate'); } catch {}
    }
    for (const [key, timer] of live) {
      const props = {
        title: timer.label || 'Cook timer',
        startAt: timer.startedAt,
        endAt: timer.endsAt,
      };
      const sig = JSON.stringify(props);
      const entry = running.get(key);
      if (entry?.sig === sig) continue;
      // One activity failing must not stop the others from being kept up.
      try {
        if (entry) entry.instance.update(props);
        running.set(key, { instance: entry ? entry.instance : Activity.start(props), sig });
      } catch {
        running.delete(key);
      }
    }
  } catch {}
}
