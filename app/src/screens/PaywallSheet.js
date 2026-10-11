import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line } from 'react-native-svg';
import { FONT, useTheme, useStyles } from '../theme';
import { Sheet, CloseButton, AppBar, TextButton, alert } from '../primitives';
import { GLASS, M3, GlassPressable } from '../glass';
import { useIap } from '../iap';
import { capture } from '../analytics';
import { t } from '../i18n';

export default function PaywallSheet({ visible, onClose, surface = 'paywall' }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const { configured, isPro, price, buyPro, restorePurchases } = useIap();
  const [busy, setBusy] = useState(false);
  const trackedOpen = useRef(false);

  useEffect(() => {
    if (!visible) {
      trackedOpen.current = false;
      return;
    }
    if (isPro) {
      onClose?.();
      return;
    }
    if (!trackedOpen.current) {
      trackedOpen.current = true;
      capture('pro_offer_viewed', {
        surface,
        price_available: !!price,
      });
    }
  }, [visible, isPro, price, surface, onClose]);

  const onBuy = async () => {
    if (!configured) {
      alert(t('paywall.not_configured'));
      return;
    }
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const owned = await buyPro();
      if (owned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert(t('paywall.thanks_title'), t('paywall.thanks_body'));
        onClose?.();
      }
    } catch (e) {
      if (!e?.userCancelled && e?.code !== 'PURCHASE_CANCELLED') {
        alert(
          t('paywall.purchase_failed_title'),
          e?.message || t('paywall.purchase_failed_body'),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!configured) {
      alert(t('paywall.not_configured'));
      return;
    }
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const owned = await restorePurchases();
      alert(
        owned ? t('paywall.restored_title') : t('paywall.nothing_title'),
        owned ? t('paywall.restored_body') : t('paywall.nothing_body'),
      );
      if (owned) onClose?.();
    } catch (e) {
      alert(
        t('paywall.restore_failed_title'),
        e?.message || t('paywall.purchase_failed_body'),
      );
    } finally {
      setBusy(false);
    }
  };

  const ctaLabel = price
    ? t('paywall.cta', { price })
    : t('paywall.cta_no_price');

  return (
    <Sheet visible={visible} onClose={onClose}>
      {M3 ? (
        <AppBar title="" leading="close" onLeading={onClose} />
      ) : (
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <CloseButton onPress={onClose} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.body}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('paywall.badge')}</Text>
        </View>

        <Text style={styles.title}>{t('paywall.title')}</Text>
        <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

        <View style={styles.benefits}>
          <Benefit
            icon={<NoAdsIcon c={C.terracotta} />}
            label={t('paywall.benefit_no_banners')}
          />
          <Benefit
            icon={<RestoreIcon c={C.terracotta} />}
            label={t(M3 ? 'paywall.benefit_restore_android' : 'paywall.benefit_restore')}
            divider
          />
        </View>

        <GlassPressable
          onPress={onBuy}
          disabled={busy}
          tint={C.terracotta}
          style={({ pressed }) => [
            styles.cta,
            { opacity: pressed || busy ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </GlassPressable>

        {M3 ? (
          <View style={{ alignSelf: 'center', marginBottom: 8 }}>
            <TextButton label={t('paywall.restore')} onPress={onRestore} disabled={busy} />
          </View>
        ) : (
          <Pressable
            onPress={onRestore}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed || busy ? 0.55 : 1 })}
          >
            <Text style={styles.restore}>{t('paywall.restore')}</Text>
          </Pressable>
        )}

        <Text style={styles.footer}>{t('paywall.footer')}</Text>
      </ScrollView>
    </Sheet>
  );
}

function Benefit({ icon, label, divider }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.benefitRow, divider && styles.benefitDivider]}>
      <View style={styles.benefitIcon}>{icon}</View>
      <Text style={styles.benefitLabel}>{label}</Text>
    </View>
  );
}

function NoAdsIcon({ c }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke={c}
        strokeWidth={1.8}
      />
      <Path d="M18 9l4-2v10l-4-2" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <Line x1={3} y1={21} x2={21} y2={3} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function RestoreIcon({ c }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12a8 8 0 0114.2-5M20 12a8 8 0 01-14.2 5"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M18 3v4h-4M6 21v-4h4" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'stretch',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: M3 ? C.terracottaSoft : C.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: M3 ? 8 : 999,
    marginBottom: 14,
  },
  badgeText: {
    fontFamily: FONT.ui,
    fontSize: M3 ? 12 : 11,
    fontWeight: M3 ? '500' : '700',
    color: M3 ? C.terracottaDeep : C.onTerracotta,
    letterSpacing: M3 ? 0.5 : 0.8,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 28,
    fontWeight: '500',
    color: C.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT.ui,
    fontSize: 15,
    color: C.ink50,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  // Android: Material list rows joined into one group by a 2dp gap.
  benefits: M3 ? {
    borderRadius: 16,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 28,
  } : {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.divider,
  },
  benefitRow: M3 ? {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: C.surfaceLow,
    borderRadius: 4,
  } : {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  benefitDivider: M3 ? {} : {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.divider,
  },
  benefitIcon: {
    width: 28,
    alignItems: 'center',
  },
  benefitLabel: {
    flex: 1,
    fontFamily: FONT.ui,
    fontSize: M3 ? 16 : 15,
    fontWeight: M3 ? '400' : '500',
    color: C.ink,
  },
  cta: {
    backgroundColor: C.terracotta,
    borderRadius: M3 ? 28 : GLASS ? 26 : 16,
    ...(M3 ? { height: 56, justifyContent: 'center' } : null),
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: M3 ? 8 : 16,
  },
  ctaText: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: M3 ? '500' : '600',
    color: C.onTerracotta,
  },
  restore: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.terracotta,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    fontFamily: FONT.ui,
    fontSize: 12,
    color: C.ink30,
    textAlign: 'center',
  },
});
