import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { t } from './i18n';
import { clockTime } from './timer';

// Shows what is cooking outside the app: the iPhone's Live Activities (lock
// screen and Dynamic Island) and Android's running notification. On a build
// made before either was added, this does nothing.
let Activity = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line global-require
    Activity = require('./CookActivity').default;
  } catch {}
}
const Ongoing = Platform.OS === 'android' ? requireOptionalNativeModule('CookNotification') : null;

// timer id -> { instance, sig }
const running = new Map();
let cleared = false;

// It may already be gone: swiped away, or ended by the system.
const quiet = (work) => {
  try { Promise.resolve(work()).catch(() => {}); } catch {}
};

function wording(timer) {
  return {
    title: timer.label || t('timer.fallback_label'),
    readyAt: t('timer.ready_at', { time: clockTime(timer.endsAt) }),
  };
}

// One activity per timer. When the timer is done it says so and stays, like
// the ringing card in the app; it ends when the timer is cancelled.
function syncActivities(timers) {
  if (!cleared) {
    // Left over from the last time the app ran: this run starts its own.
    cleared = true;
    for (const stale of Activity.getInstances()) quiet(() => stale.end('immediate'));
  }
  const byId = new Map(timers.map((x) => [x.id, x]));
  for (const [key, entry] of running) {
    if (byId.has(key)) continue;
    running.delete(key);
    quiet(() => entry.instance.end('immediate'));
  }
  for (const [key, timer] of byId) {
    const entry = running.get(key);
    // One that finished before this run began has nothing to carry on from.
    if (!entry && timer.completed) continue;
    const props = {
      ...wording(timer),
      startAt: timer.startedAt,
      endAt: timer.endsAt,
      shake: !!timer.remindHalfway,
      done: !!timer.completed,
      endedAt: clockTime(timer.endsAt),
      doneTitle: t('timer.done'),
      doneShort: t('timer.done_short'),
    };
    const sig = JSON.stringify(props);
    if (entry?.sig === sig) continue;
    // At the end time the system redraws the activity as stale, which is how
    // it turns to done with the app asleep.
    const staleAt = timer.completed ? undefined : new Date(timer.endsAt);
    // One activity failing must not stop the others from being kept up.
    try {
      if (entry) quiet(() => entry.instance.update(props, staleAt));
      running.set(key, {
        instance: entry ? entry.instance : Activity.start(props, undefined, staleAt),
        sig,
      });
    } catch {
      running.delete(key);
    }
  }
}

// One notification per running timer. It leaves by itself at the end, when
// the done alert arrives.
function syncNotifications(timers) {
  const live = new Map(timers.filter((x) => !x.completed).map((x) => [x.id, x]));
  for (const key of running.keys()) {
    if (live.has(key)) continue;
    running.delete(key);
    Ongoing.hide(key);
  }
  for (const [key, timer] of live) {
    const { title, readyAt } = wording(timer);
    const shakeAt = timer.remindHalfway && !timer.halfFired
      ? t('timer.shake_at', { time: clockTime(timer.halfFiredAt) })
      : '';
    // notificationIds arrive once notifications are allowed: show it then.
    const sig = JSON.stringify([title, readyAt, shakeAt, !!timer.notificationIds]);
    if (running.get(key)?.sig === sig) continue;
    running.set(key, { sig });
    Ongoing.show(key, title, readyAt, shakeAt, timer.endsAt, t('timer.channel_running'));
  }
}

export function syncCookActivities(timers) {
  try {
    if (Activity) syncActivities(timers);
    if (Ongoing) syncNotifications(timers);
  } catch {}
}
