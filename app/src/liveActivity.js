import { Platform } from 'react-native';
import { t } from './i18n';

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

// key (plan id, or timer id) -> { instance, sig }
const running = new Map();
let cleared = false;

function groups(timers) {
  const byKey = new Map();
  for (const timer of timers) {
    const key = timer.planId || timer.id;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(timer);
  }
  return byKey;
}

function propsFor(list) {
  const foods = [...list]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((x) => ({ label: x.label || 'Cook timer', startAt: x.startedAt, endAt: x.endsAt }));
  return {
    title: foods.length > 1 ? t('plan.title') : foods[0].label,
    startAt: Math.min(...foods.map((f) => f.startAt)),
    endAt: Math.max(...foods.map((f) => f.endAt)),
    foods,
  };
}

// One activity per timer, or per plan. It ends when everything in it is done
// or cancelled: the app's own alert takes over from there.
export function syncCookActivities(timers) {
  if (!Activity) return;
  try {
    if (!cleared) {
      // Left over from the last time the app ran: this run starts its own.
      cleared = true;
      for (const stale of Activity.getInstances()) stale.end('immediate');
    }
    const live = groups(timers.filter((x) => !x.completed));
    for (const [key, entry] of running) {
      if (!live.has(key)) {
        entry.instance.end('immediate');
        running.delete(key);
      }
    }
    for (const [key, list] of live) {
      const props = propsFor(list);
      const sig = JSON.stringify(props);
      const entry = running.get(key);
      if (!entry) running.set(key, { instance: Activity.start(props), sig });
      else if (entry.sig !== sig) {
        entry.instance.update(props);
        entry.sig = sig;
      }
    }
  } catch {}
}
