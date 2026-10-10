import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Close, Play } from '../icons';
import { Sheet, CloseButton, RoundButton } from '../primitives';
import { GLASS, M3, GlassPressable } from '../glass';
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
    // A half-height sheet on iOS; Material's bottom sheet on Android, closed
    // by its scrim or the back button.
    <Sheet visible={visible} onClose={onClose} bottom>
      {!M3 && (
        <View style={styles.header}>
          <Text style={styles.title}>{t('plan.title')}</Text>
          <CloseButton onPress={onClose} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {M3 && <Text style={styles.title}>{t('plan.title')}</Text>}
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
                <RoundButton onPress={() => onRemove(f.id)} size={40} tone="flat" accessibilityLabel="Remove from plan">
                  <Close s={M3 ? 22 : 16} c={C.ink70} />
                </RoundButton>
              </View>
            );
          })}
        </View>

        {mixedTemps && <Text style={styles.warning}>{t('plan.mixed_temps')}</Text>}

        <GlassPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStart();
          }}
          tint={C.terracotta}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Play s={14} c={C.onTerracotta} />
          <Text style={styles.ctaText}>{t('plan.start', { time: formatMinutes(longest) })}</Text>
        </GlassPressable>
      </ScrollView>
    </Sheet>
  );
}

const makeStyles = (C) => StyleSheet.create({
  // Clear of the system's drag indicator at the top of the sheet.
  header: {
    paddingLeft: 24,
    paddingRight: 16,
    paddingTop: 22,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: M3 ? { paddingHorizontal: 24 } : { paddingHorizontal: 24, paddingBottom: 40 },
  title: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 24,
    lineHeight: 32,
    color: C.ink,
  } : {
    fontFamily: FONT.display,
    fontSize: 24,
    fontWeight: '500',
    color: C.ink,
    letterSpacing: -0.4,
  },
  subtitle: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink70,
    marginTop: 4,
    marginBottom: 8,
  } : {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink70,
    lineHeight: 20,
    marginBottom: 14,
  },
  // Android: plain Material list items, straight on the sheet.
  list: M3 ? { marginRight: -12 } : {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.divider,
    marginBottom: 16,
  },
  row: M3
    ? { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 16 }
    : { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowDivider: M3 ? {} : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.divider },
  rowTitle: M3
    ? { fontFamily: FONT.ui, fontSize: 16, lineHeight: 24, color: C.ink }
    : { fontFamily: FONT.ui, fontSize: 16, fontWeight: '600', color: C.ink },
  rowSub: M3
    ? { fontFamily: FONT.ui, fontSize: 14, lineHeight: 20, color: C.ink70 }
    : { fontFamily: FONT.ui, fontSize: 13, color: C.ink50, marginTop: 2 },
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
    borderRadius: M3 ? 28 : GLASS ? 26 : 16,
    ...(M3 ? { height: 56 } : null),
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ctaText: { fontFamily: FONT.ui, fontSize: 16, fontWeight: M3 ? '500' : '600', color: C.onTerracotta },
});
