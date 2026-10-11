import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, AccessibilityInfo,
} from 'react-native';
import { FONT, useStyles } from '../theme';
import { M3 } from '../glass';
import { formatMinutes } from '../convert';
import { t } from '../i18n';

// Two foods on one clock: a long one, and a shorter one that goes in later.
// The bars fill as the cook would run, and end together. Shown on the empty
// Plan tab and in the paywall.
export default function PlanExample({ visible, minutes }) {
  const styles = useStyles(makeStyles);
  const long = minutes >= 5 ? minutes : 20;
  const short = Math.round(long * 0.6);
  const clock = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return undefined;
    let anim;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      clock.setValue(0);
      anim = Animated.timing(clock, {
        toValue: 1, duration: 2200, delay: 500, easing: Easing.linear, useNativeDriver: false,
      });
      anim.start();
    });
    return () => anim?.stop();
  }, [visible, clock]);

  const start = 1 - short / long;
  const rows = [
    { time: long, note: t('plan.first'), from: 0 },
    { time: short, note: t('plan.later', { time: formatMinutes(long - short) }), from: start },
  ];

  return (
    <View style={styles.example}>
      {rows.map((r) => (
        <View key={r.time}>
          <View style={styles.exampleRow}>
            <Text style={styles.exampleFood}>
              {t('paywall.example_food', { time: formatMinutes(r.time) })}
            </Text>
            <Text style={styles.exampleNote}>{r.note}</Text>
          </View>
          <View style={styles.exampleTrack}>
            <Animated.View
              style={[styles.exampleBar, {
                marginLeft: `${r.from * 100}%`,
                width: clock.interpolate({
                  inputRange: [r.from, 1],
                  outputRange: ['0%', `${(1 - r.from) * 100}%`],
                  extrapolate: 'clamp',
                }),
              }]}
            />
          </View>
        </View>
      ))}
      <Text style={styles.exampleReady}>{t('paywall.example_ready')}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  example: {
    backgroundColor: M3 ? C.surfaceLow : C.paper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...(M3 ? null : { borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider }),
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  exampleFood: { fontFamily: FONT.ui, fontSize: 14, fontWeight: '600', color: C.ink },
  exampleNote: { fontFamily: FONT.ui, fontSize: 13, color: C.ink70 },
  exampleTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: C.ink06,
    marginBottom: 14,
    overflow: 'hidden',
  },
  exampleBar: { height: 10, borderRadius: 5, backgroundColor: C.terracotta },
  exampleReady: {
    fontFamily: FONT.ui,
    fontSize: 13,
    fontWeight: '600',
    color: C.terracottaDeep,
    textAlign: 'right',
  },
});
