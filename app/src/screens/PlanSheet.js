import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Close, Play } from '../icons';
import { formatMinutes } from '../convert';
import { t } from '../i18n';

// "Finish together": the longest food goes in first, each other food goes
// in once its remaining time matches, so everything ends at the same moment.
export default function PlanSheet({ visible, plan, onClose, onRemove, onStart }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const longest = Math.max(0, ...plan.map((f) => f.minutes));
  const sorted = [...plan].sort((a, b) => b.minutes - a.minutes);
  const mixedTemps = new Set(plan.map((f) => `${f.temp}${f.unit}`)).size > 1;

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
          <View style={{ width: 30 }} />
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Close s={16} c={C.ink70} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t('plan.title')}</Text>
          <Text style={styles.subtitle}>{t('plan.subtitle')}</Text>

          <View style={styles.list}>
            {sorted.map((f, i) => {
              const wait = longest - f.minutes;
              return (
                <View key={f.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {`${f.temp}°${f.unit} · ${formatMinutes(f.minutes)}`}
                    </Text>
                    <Text style={styles.rowSub}>
                      {wait === 0 ? t('plan.first') : t('plan.later', { time: formatMinutes(wait) })}
                    </Text>
                  </View>
                  <Pressable onPress={() => onRemove(f.id)} hitSlop={10} style={styles.closeBtn}>
                    <Close s={14} c={C.ink70} />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {mixedTemps && <Text style={styles.warning}>{t('plan.mixed_temps')}</Text>}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStart();
            }}
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Play s={14} c={C.onTerracotta} />
            <Text style={styles.ctaText}>{t('plan.start', { time: formatMinutes(longest) })}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: 24, paddingBottom: 40 },
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
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  list: {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.divider,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.divider },
  rowTitle: { fontFamily: FONT.ui, fontSize: 16, fontWeight: '600', color: C.ink },
  rowSub: { fontFamily: FONT.ui, fontSize: 13, color: C.ink50, marginTop: 2 },
  warning: {
    fontFamily: FONT.ui,
    fontSize: 14,
    lineHeight: 20,
    color: C.terracottaDeep,
    backgroundColor: C.terracottaSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: C.terracotta,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ctaText: { fontFamily: FONT.ui, fontSize: 16, fontWeight: '600', color: C.onTerracotta },
});
