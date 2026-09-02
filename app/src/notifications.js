import { Platform } from 'react-native';

// expo-notifications is a native module. It is present in dev / production
// builds and (for local notifications) in Expo Go, but we still guard the
// require so a missing module degrades to "no background alerts" rather
// than a crash — matching how ads.js and iap.js treat their native deps.
let Notifications = null;
try {
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch {}

const DONE_CHANNEL = 'cook-timer-done';
const HALF_CHANNEL = 'cook-timer-halfway';

let prepared = false;
async function prepare() {
  if (prepared || !Notifications) return;
  prepared = true;
  try {
    // While the app is in the foreground the timer hook already chimes,
    // vibrates and shows a toast, so the system notification stays silent
    // to avoid a double alert. Backgrounded / killed, the OS delivers it.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {}
  if (Platform.OS === 'android') {
    // Android binds the sound to the channel, so one channel per chime.
    try {
      await Notifications.setNotificationChannelAsync(DONE_CHANNEL, {
        name: 'Cook timer done',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'done.wav',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: '#C2562E',
      });
      await Notifications.setNotificationChannelAsync(HALF_CHANNEL, {
        name: 'Shake halfway reminder',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'shake.wav',
        vibrationPattern: [0, 150],
        enableVibrate: true,
        lightColor: '#C2562E',
      });
    } catch {}
  }
}

// Asked the first time a timer starts, which is the moment the permission
// obviously makes sense. Returns true if notifications may be scheduled.
export async function ensureNotificationPermission() {
  if (!Notifications) return false;
  try {
    await prepare();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.status !== 'undetermined' && !current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return !!next.granted;
  } catch {
    return false;
  }
}

async function scheduleAt(whenMs, content, channelId) {
  if (!Notifications) return null;
  // Anything due within a second is handled by the in-app tick already.
  if (whenMs <= Date.now() + 1000) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(whenMs),
        channelId,
      },
    });
  } catch {
    return null;
  }
}

// Schedules the OS-side alerts for one timer. Returns the identifiers so
// they can be cancelled when the timer is cancelled, restarted or edited.
export async function scheduleTimerNotifications(
  timer,
  { done = true, half = true } = {},
) {
  const ids = { done: null, half: null };
  if (!Notifications) return ids;
  await prepare();
  const label = timer.label || 'Cook timer';
  if (done) {
    ids.done = await scheduleAt(
      timer.endsAt,
      {
        title: 'Done!',
        body: `${label} is ready.`,
        sound: 'done.wav',
        interruptionLevel: 'timeSensitive',
        data: { timerId: timer.id, kind: 'done' },
      },
      DONE_CHANNEL,
    );
  }
  if (half && timer.remindHalfway && !timer.halfFired) {
    ids.half = await scheduleAt(
      timer.halfFiredAt,
      {
        title: 'Shake halfway',
        body: `Give ${label} a shake.`,
        sound: 'shake.wav',
        interruptionLevel: 'timeSensitive',
        data: { timerId: timer.id, kind: 'half' },
      },
      HALF_CHANNEL,
    );
  }
  return ids;
}

export async function cancelTimerNotifications(ids) {
  if (!Notifications || !ids) return;
  for (const id of [ids.done, ids.half]) {
    if (!id) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}

// Clears anything the OS is still showing (e.g. a "Done!" banner the user
// has already dealt with inside the app).
export async function dismissDeliveredNotifications() {
  if (!Notifications) return;
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}
