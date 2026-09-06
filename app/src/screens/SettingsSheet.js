import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet,
} from 'react-native';
import Constants from 'expo-constants';
import { FONT, useTheme, useStyles } from '../theme';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
import { Close } from '../icons';
import { Toggle } from '../primitives';
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Close s={16} c={C.ink70} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
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
                <Text style={styles.proPillText}>{t('settings.pro_active_pill')}</Text>
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

          <Row label="About" detail={`v${APP_VERSION}`} isLast />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <BannerAd placement="settings" />
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, subtitle, detail, children, isLast }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[
      styles.row,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
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
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        styles.rowDivider,
        { opacity: pressed ? 0.55 : 1 },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 6,
  },
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
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  rowLabel: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  rowSubtitle: {
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
    borderRadius: 999,
    backgroundColor: C.terracotta,
  },
  proPillText: {
    fontFamily: FONT.ui,
    fontSize: 11,
    fontWeight: '700',
    color: C.onTerracotta,
    letterSpacing: 0.6,
  },
});
