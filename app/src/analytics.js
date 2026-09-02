import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://eu.i.posthog.com';
const captureInDevelopment =
  process.env.EXPO_PUBLIC_POSTHOG_CAPTURE_IN_DEV === 'true';

// Manual events only: no screen/touch autocapture, session replay, user-entered
// recipe content, or exact cooking values are collected.
const client = apiKey
  ? new PostHog(apiKey, {
      host,
      disabled: __DEV__ && !captureInDevelopment,
      defaultOptIn: false,
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
      preloadFeatureFlags: false,
      disableSurveys: true,
      disableGeoip: true,
    })
  : null;

let enabled = false;

export async function setAnalyticsEnabled(nextEnabled) {
  enabled = !!nextEnabled;
  if (!client) return;

  try {
    if (enabled) await client.optIn();
    else await client.optOut();
  } catch {}
}

export function capture(event, properties = {}) {
  if (!client || !enabled) return;

  try {
    client.capture(event, {
      ...properties,
      $process_person_profile: false,
    });
  } catch {}
}

export function isAnalyticsConfigured() {
  return !!client;
}
