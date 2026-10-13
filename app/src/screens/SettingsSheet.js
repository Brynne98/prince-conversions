import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { FONT, LABEL, useTheme, useStyles } from '../theme';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const SITE_URL = 'https://brynne98.github.io/prince-conversions';
import { Toggle, Sheet, SheetHeader, AppBar } from '../primitives';
import { Chevron } from '../icons';
import { M3, cap, fade } from '../glass';
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
        // An X, as on the other pages that slide up.
        <AppBar title={t('settings.title')} leading="close" onLeading={onClose} />
      ) : (
        <SheetHeader title={t('settings.title')} onClose={onClose} />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Android's rows carry their own side padding, so a press ripples
            from edge to edge. */}
        <View style={{ paddingHorizontal: M3 ? 0 : 20 }}>
          <Row label={t('settings.dark_mode')}>
            <Toggle
              value={mode === 'dark'}
              onValueChange={(v) => setMode?.(v ? 'dark' : 'light')}
            />
          </Row>

          {isAnalyticsConfigured() && (
            <Row
              label={t('settings.analytics')}
              subtitle={t('settings.analytics_subtitle')}
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
                <Text style={styles.proPillText}>{cap(t('settings.pro_active_pill'))}</Text>
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
              label={t('settings.ad_privacy')}
              subtitle={t('settings.ad_privacy_subtitle')}
              onPress={() => {
                capture('ad_privacy_options_opened');
                showAdPrivacyOptions();
              }}
            />
          )}

          <PressableRow
            label={t('settings.privacy_policy')}
            onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}
          />
          <PressableRow
            label={t('settings.terms')}
            onPress={() => Linking.openURL(`${SITE_URL}/terms`)}
          />

          <Row label={t('settings.about')} detail={`v${APP_VERSION}`} isLast />
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
      accessibilityRole="button"
      style={(state) => [styles.row, styles.rowDivider, fade(state)]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {!M3 && <Chevron c={C.ink30} />}
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  row: M3 ? {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    fontSize: 16,
    lineHeight: 24,
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
    color: C.ink70,
    marginTop: 2,
  },
  rowDetail: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink70,
  },
  proPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: M3 ? 8 : 999,
    backgroundColor: M3 ? C.terracottaSoft : C.terracotta,
  },
  proPillText: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 11,
    fontWeight: '500',
    color: C.terracottaDeep,
    letterSpacing: 0.1,
  } : { ...LABEL, color: C.onTerracotta },
});
