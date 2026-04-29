import React, { useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Close } from '../icons';
import { Toggle } from '../primitives';
import { BannerAd } from '../ads';
import { useIap } from '../iap';

export default function SettingsSheet({ visible, onClose, mode, setMode }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const { configured, isPro, price, buyPro, restorePurchases } = useIap();
  const [busy, setBusy] = useState(false);

  const onBuy = async () => {
    if (!configured) {
      Alert.alert('In-app purchases not configured yet.');
      return;
    }
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const owned = await buyPro();
      if (owned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thanks!', 'Ads removed.');
      }
    } catch (e) {
      // RevenueCat throws userCancelled with code PURCHASE_CANCELLED — silent.
      if (!e?.userCancelled && e?.code !== 'PURCHASE_CANCELLED') {
        Alert.alert('Purchase failed', e?.message || 'Try again later.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!configured) {
      Alert.alert('In-app purchases not configured yet.');
      return;
    }
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const owned = await restorePurchases();
      Alert.alert(
        owned ? 'Restored' : 'Nothing to restore',
        owned ? 'Pro is active on this device.' : 'No previous purchase found.',
      );
    } catch (e) {
      Alert.alert('Restore failed', e?.message || 'Try again later.');
    } finally {
      setBusy(false);
    }
  };

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

          {isPro ? (
            <Row label="Pro" subtitle="Ads removed — thanks!">
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>ACTIVE</Text>
              </View>
            </Row>
          ) : (
            <PressableRow
              label="Remove ads"
              subtitle={price ? `One-time purchase · ${price}` : 'One-time purchase'}
              onPress={onBuy}
              busy={busy}
            />
          )}

          <PressableRow
            label="Restore purchases"
            subtitle="Already paid? Bring Pro back here."
            onPress={onRestore}
            busy={busy}
          />

          <Row label="About" detail="v1.0.0" isLast />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <BannerAd />
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

function PressableRow({ label, subtitle, onPress, busy }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.row,
        styles.rowDivider,
        { opacity: pressed || busy ? 0.55 : 1 },
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
