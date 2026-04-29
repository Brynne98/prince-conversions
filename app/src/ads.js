import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useIap } from './iap';
import { useTheme } from './theme';

// AdMob and ATT are native modules — they live only in dev / production
// builds, not in Expo Go. We detect the runtime and render a placeholder
// in Expo Go so the layout still works while iterating over the air.
const IS_EXPO_GO = Constants?.executionEnvironment === 'storeClient';

let GBannerAd = null;
let BannerAdSize = null;
let TestIds = null;
let mobileAds = null;
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
  } catch {}
  try {
    // eslint-disable-next-line global-require
    const att = require('expo-tracking-transparency');
    attRequest = att.requestTrackingPermissionsAsync;
    attGet = att.getTrackingPermissionsAsync;
  } catch {}
}

const TEST_BANNER = TestIds?.BANNER;

// Replace the prod strings with your real banner unit IDs from
// https://apps.admob.com once the AdMob app is set up.
const BANNER_UNIT_ID = __DEV__
  ? TEST_BANNER
  : Platform.select({
      ios: 'ca-app-pub-3005788156292964/5992983308',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    }) || TEST_BANNER;

let adsInitialized = false;

export async function initAds() {
  if (adsInitialized || IS_EXPO_GO) return;
  if (attGet && attRequest) {
    try {
      const { status } = await attGet();
      if (status === 'undetermined') await attRequest();
    } catch {}
  }
  if (mobileAds) {
    try {
      await mobileAds().initialize();
      adsInitialized = true;
    } catch {}
  }
}

export function BannerAd({ style }) {
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
