import React, { useSyncExternalStore } from 'react';
import { Alert, Platform, View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useIap } from './iap';
import { useTheme } from './theme';
import { capture } from './analytics';
import { t } from './i18n';

// AdMob and ATT are native modules — they live only in dev / production
// builds, not in Expo Go. We detect the runtime and render a placeholder
// in Expo Go so the layout still works while iterating over the air.
const IS_EXPO_GO = Constants?.executionEnvironment === 'storeClient';

let GBannerAd = null;
let BannerAdSize = null;
let TestIds = null;
let mobileAds = null;
let AdsConsent = null;
let attRequest = null;
let attGet = null;

if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line global-require
    const ads = require('react-native-google-mobile-ads');
    GBannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
    mobileAds = ads.default;
    AdsConsent = ads.AdsConsent;
  } catch {}
  try {
    // eslint-disable-next-line global-require
    const att = require('expo-tracking-transparency');
    attRequest = att.requestTrackingPermissionsAsync;
    attGet = att.getTrackingPermissionsAsync;
  } catch {}
}

const TEST_BANNER = TestIds?.BANNER;

// Production banner unit IDs from https://apps.admob.com. Android is
// null until the Android app exists in AdMob; a null entry serves Google's
// test banner rather than requesting an invalid unit.
const PROD_BANNER_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3005788156292964/5992983308',
  android: 'ca-app-pub-3005788156292964/4447877393',
});
const BANNER_UNIT_ID = __DEV__ || !PROD_BANNER_UNIT_ID ? TEST_BANNER : PROD_BANNER_UNIT_ID;

let adsInitialized = false;

// Banners stay hidden until initAds() has the consent and tracking answers
// and Google allows ad requests, so no ad is requested before the user answers.
let adsReady = false;
const readyListeners = new Set();
function subscribeAdsReady(listener) {
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}
const getAdsReady = () => adsReady;

// Google's User Messaging Platform: shows the GDPR / US-state consent form
// where the user's region requires one, and tells us whether ads may be
// requested at all. In unregulated regions it returns immediately. The
// message itself is configured in AdMob → Privacy & messaging.
async function gatherConsent() {
  if (!AdsConsent) return true;
  try {
    const info = await AdsConsent.gatherConsent();
    return info.canRequestAds;
  } catch {
    // Offline or misconfigured: fall back to whatever was stored from a
    // previous session (first launch offline: no ads this session).
    try {
      const info = await AdsConsent.getConsentInfo();
      return info.canRequestAds;
    } catch {
      return false;
    }
  }
}

export async function initAds() {
  if (adsInitialized || IS_EXPO_GO) return;
  const canRequestAds = await gatherConsent();
  if (attGet && attRequest) {
    try {
      const { status } = await attGet();
      if (status === 'undetermined') {
        // Explain before the system prompt; a cold prompt gets fewer yeses.
        await new Promise((resolve) => {
          Alert.alert(t('ads.att_title'), t('ads.att_body'), [
            { text: t('ads.att_continue'), onPress: resolve },
          ], { cancelable: false });
        });
        // iOS drops the ATT dialog if it is requested while the alert is
        // still animating out (see App.js); let the dismissal finish first.
        await new Promise((resolve) => setTimeout(resolve, 600));
        await attRequest();
      }
    } catch {}
  }
  if (!canRequestAds) return;
  if (mobileAds) {
    try {
      await mobileAds().initialize();
      adsInitialized = true;
    } catch {}
  }
  adsReady = true;
  readyListeners.forEach((listener) => listener());
}

function errorCode(error) {
  return String(error?.code ?? error?.message ?? 'unknown');
}

// Regulated regions require a way to revisit the consent choice. Settings
// shows an entry point only when the SDK says one is required.
export async function isAdPrivacyOptionsRequired() {
  if (!AdsConsent) return false;
  try {
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === 'REQUIRED';
  } catch {
    return false;
  }
}

export async function showAdPrivacyOptions() {
  if (!AdsConsent) return;
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {}
}

// size 'box' is the 300×250 medium rectangle; the default fits the screen width.
export function BannerAd({ style, placement = 'unknown', size = 'banner' }) {
  const { isPro } = useIap();
  const ready = useSyncExternalStore(subscribeAdsReady, getAdsReady);
  if (isPro) return null;

  if (IS_EXPO_GO || !GBannerAd || !BannerAdSize) {
    return <ExpoGoPlaceholder style={style} height={size === 'box' ? 250 : 64} />;
  }
  if (!ready) return null;

  return (
    <View style={[styles.wrap, style]}>
      <GBannerAd
        unitId={BANNER_UNIT_ID}
        size={size === 'box' ? BannerAdSize.MEDIUM_RECTANGLE : BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(error) => {
          capture('ad_load_failed', { format: size, placement, code: errorCode(error) });
        }}
        onAdImpression={() => {
          capture('ad_impression', {
            format: size,
            placement,
          });
        }}
        onPaid={({ value, currency, precision }) => {
          capture('ad_revenue_recorded', {
            format: size,
            placement,
            revenue: value,
            currency,
            precision,
          });
        }}
      />
    </View>
  );
}

function ExpoGoPlaceholder({ style, height }) {
  const { C } = useTheme();
  return (
    <View
      style={[
        {
          height,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: C.ink30,
          backgroundColor: C.creamDeep,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Menlo',
          fontSize: 11,
          color: C.ink50,
          letterSpacing: 0.5,
        }}
      >
        Ad · placeholder · dev build only
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
});
