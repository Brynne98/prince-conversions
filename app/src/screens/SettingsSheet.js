import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { FONT, useTheme, useStyles } from '../theme';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const SITE_URL = 'https://brynne98.github.io/prince-conversions';
import { Toggle, Sheet, CloseButton, AppBar } from '../primitives';
import { M3 } from '../glass';
import { BannerAd, isAdPrivacyOptionsRequired, showAdPrivacyOptions } from '../ads';
import { useIap } from '../iap';
import { capture, isAnalyticsConfigured } from '../analytics';
import { t } from '../i18n';

export default function SettingsSheet({
  visible,
  onClose,
  mode,
  setMode,
  analyticsEnabled,
  setAnalyticsEnabled,
  onOpenPaywall,
}) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const { isPro, price } = useIap();
  const [adPrivacyOptions, setAdPrivacyOptions] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    isAdPrivacyOptionsRequired().then((required) => {
      if (active) setAdPrivacyOptions(required);
    });
    return () => { active = false; };
  }, [visible]);

  const priceSuffix = price ? ` · ${price}` : '';

  return (
    <Sheet visible={visible} onClose={onClose}>
      {M3 ? (
        <AppBar title="Settings" leading="back" onLeading={onClose} />
      ) : (
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <CloseButton onPress={onClose} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: M3 ? 16 : 20 }}>
          <Row label="Dark mode" subtitle="Warm-charcoal palette">
            <Toggle
              value={mode === 'dark'}
              onValueChange={(v) => setMode?.(v ? 'dark' : 'light')}
            />
          </Row>

          {isAnalyticsConfigured() && (
            <Row
              label="Share anonymous analytics"
              subtitle="Usage events only — never recipe content"
            >
              <Toggle
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
              />
            </Row>
          )}

          {isPro ? (
            <Row
              label={t('settings.pro_active')}
              subtitle={t('settings.pro_active_subtitle')}
            >
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>{M3 ? 'Active' : t('settings.pro_active_pill')}</Text>
              </View>
            </Row>
          ) : (
            <PressableRow
              label={t('settings.remove_ads')}
              subtitle={t('settings.remove_ads_subtitle', { price: priceSuffix })}
              onPress={() => onOpenPaywall?.()}
            />
          )}

          {adPrivacyOptions && !isPro && (
            <PressableRow
              label="Ad privacy options"
              subtitle="Review or change your consent choices"
              onPress={() => {
                capture('ad_privacy_options_opened');
                showAdPrivacyOptions();
              }}
            />
          )}

          <PressableRow
            label="Privacy policy"
            onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}
          />
          <PressableRow
            label="Terms of use"
            onPress={() => Linking.openURL(`${SITE_URL}/terms`)}
          />

          <Row label="About" detail={`v${APP_VERSION}`} isLast />
        </View>

        <View style={{ paddingHorizontal: M3 ? 16 : 20, marginTop: 20 }}>
          <BannerAd placement="settings" size="box" />
        </View>
      </ScrollView>
    </Sheet>
  );
}

function Row({ label, subtitle, detail, children, isLast }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[
      styles.row,
      // Material list items carry no dividers.
      !isLast && !M3 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
    ]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {children || (detail ? <Text style={styles.rowDetail}>{detail}</Text> : null)}
    </View>
  );
}

function PressableRow({ label, subtitle, onPress }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: C.ink10, foreground: true }}
      style={({ pressed }) => [
        styles.row,
        styles.rowDivider,
        { opacity: pressed && !M3 ? 0.55 : 1 },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {!M3 && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 22,
    fontWeight: '500',
    color: C.ink,
    letterSpacing: -0.3,
  },
  row: M3 ? {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingVertical: 8,
    gap: 16,
  } : {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  rowDivider: M3 ? {} : {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  rowLabel: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 15,
    lineHeight: 22,
    color: C.ink,
  } : {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  rowSubtitle: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 12,
    lineHeight: 16,
    color: C.ink70,
  } : {
    fontFamily: FONT.ui,
    fontSize: 12,
    color: C.ink50,
    marginTop: 2,
  },
  rowDetail: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
  },
  chevron: {
    fontFamily: FONT.ui,
    fontSize: 22,
    color: C.ink30,
    fontWeight: '300',
  },
  proPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: M3 ? 8 : 999,
    backgroundColor: M3 ? C.terracottaSoft : C.terracotta,
  },
  proPillText: {
    fontFamily: FONT.ui,
    fontSize: 11,
    fontWeight: M3 ? '500' : '700',
    color: M3 ? C.terracottaDeep : C.onTerracotta,
    letterSpacing: M3 ? 0.1 : 0.6,
  },
});
