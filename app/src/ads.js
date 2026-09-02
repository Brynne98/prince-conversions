import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useIap } from './iap';
import { useTheme } from './theme';
import { capture } from './analytics';

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
      if (status === 'undetermined') await attRequest();
    } catch {}
  }
  if (!canRequestAds) return;
  if (mobileAds) {
    try {
      await mobileAds().initialize();
      adsInitialized = true;
    } catch {}
  }
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

export function BannerAd({ style, placement = 'unknown' }) {
  const { isPro } = useIap();
  if (isPro) return null;

  if (IS_EXPO_GO || !GBannerAd || !BannerAdSize) {
    return <ExpoGoPlaceholder style={style} />;
  }

  return (
    <View style={[styles.wrap, style]}>
      <GBannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdImpression={() => {
          capture('ad_impression', {
            format: 'banner',
            placement,
          });
        }}
        onPaid={({ value, currency, precision }) => {
          capture('ad_revenue_recorded', {
            format: 'banner',
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

function ExpoGoPlaceholder({ style }) {
  const { C } = useTheme();
  return (
    <View
      style={[
        {
          height: 64,
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
