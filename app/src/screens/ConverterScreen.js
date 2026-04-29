import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Stepper, Segmented, Card, RoundButton } from '../primitives';
import { BannerAd } from '../ads';
import { Bookmark, Flame, Gear, List, Swap, Play } from '../icons';
import { convert, fToC, cToF } from '../convert';

export default function ConverterScreen({
  unit, setUnit,
  targetUnit, setTargetUnit,
  ovenTemp, setOvenTemp,
  ovenTime, setOvenTime,
  direction, setDirection,
  onOpenSaved, onOpenSettings, onSave, onStartTimer,
  topInset = 0, bottomInset = 0,
}) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const sameUnitResult = convert(ovenTemp, unit, ovenTime, direction);
  const result = unit === targetUnit
    ? sameUnitResult
    : {
        temp: unit === 'F' ? fToC(sameUnitResult.temp) : cToF(sameUnitResult.temp),
        time: sameUnitResult.time,
      };
  const tempStep = 5;
  const tempMin = unit === 'F' ? 200 : 95;
  const tempMax = unit === 'F' ? 500 : 260;

  const isOvenToAir = direction === 'oven-to-air';
  const sourceLabel = isOvenToAir ? 'OVEN RECIPE' : 'AIR FRYER RECIPE';
  const targetLabel = isOvenToAir ? 'AIR FRYER' : 'OVEN';

  const spinTurns = useRef(0);
  const spin = useRef(new Animated.Value(0)).current;
  const flip = () => {
    setDirection(isOvenToAir ? 'air-to-oven' : 'oven-to-air');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spinTurns.current += 1;
    Animated.timing(spin, {
      toValue: spinTurns.current,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'extend',
  });

  const switchUnit = (u) => {
    if (u === unit) return;
    setOvenTemp(u === 'F' ? cToF(ovenTemp) : fToC(ovenTemp));
    setUnit(u);
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <RoundButton onPress={onOpenSaved} size={40}>
          <List s={20} />
        </RoundButton>
        <View style={styles.topTitleWrap}>
          <Text style={styles.kicker}>CONVERT</Text>
        </View>
        <RoundButton onPress={onOpenSettings} size={40}>
          <Gear s={19} />
        </RoundButton>
      </View>

      {/* Direction toggle */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, alignItems: 'center' }}>
        <Segmented
          options={[
            { value: 'oven-to-air', label: 'Oven → Air fryer' },
            { value: 'air-to-oven', label: 'Air fryer → Oven' },
          ]}
          value={direction}
          onChange={setDirection}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 24 + bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        {/* Source card */}
        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.cardLabelRow}>
              <View style={styles.flameDot}>
                <Flame s={14} c={C.terracottaDeep} />
              </View>
              <Text style={styles.cardLabel}>{sourceLabel}</Text>
            </View>
            <Segmented
              compact
              options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
              value={unit}
              onChange={switchUnit}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <Stepper
              value={ovenTemp}
              onChange={setOvenTemp}
              step={tempStep}
              min={tempMin}
              max={tempMax}
              suffix={'°' + unit}
            />
          </View>
          <View style={styles.divider} />
          <Stepper
            value={ovenTime}
            onChange={setOvenTime}
            step={1}
            min={1}
            max={240}
            formatTime
          />
        </Card>

        {/* Flip arrow */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Pressable onPress={flip} hitSlop={10} style={styles.flipBtn}>
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              <Swap s={14} c={C.terracotta} />
            </Animated.View>
          </Pressable>
        </View>

        {/* Result card */}
        <LinearGradient
          colors={[C.terracotta, '#B14E29']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultKicker}>{targetLabel}</Text>
            <Segmented
              compact
              tone="onTerracotta"
              options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
              value={targetUnit}
              onChange={(u) => {
                if (u !== targetUnit) {
                  setTargetUnit(u);
                  Haptics.selectionAsync();
                }
              }}
            />
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCol}>
              <Text style={styles.resultBig} numberOfLines={1}>
                {result.temp}
                <Text style={styles.resultBigSuffix}>°{targetUnit}</Text>
              </Text>
              <Text style={styles.resultLabel}>TEMPERATURE</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCol}>
              <Text
                style={styles.resultBig}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {result.time < 60 ? (
                  <>
                    {result.time}
                    <Text style={styles.resultBigSuffix}> min</Text>
                  </>
                ) : (
                  <>
                    {Math.floor(result.time / 60)}
                    <Text style={styles.resultBigSuffix}>hr</Text>
                    {result.time % 60 > 0 ? ` ${result.time % 60}` : ''}
                    {result.time % 60 > 0 ? <Text style={styles.resultBigSuffix}>min</Text> : null}
                  </>
                )}
              </Text>
              <Text style={styles.resultLabel}>TIME</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onStartTimer?.(result.time);
              }}
              style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Play s={14} c={C.terracotta} />
              <Text style={[styles.actionBtnText, { color: C.terracotta }]}>Start timer</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSave(); }}
              style={({ pressed }) => [styles.actionBtn, styles.actionSecondary, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Bookmark s={16} c={C.onTerracotta} />
              <Text style={[styles.actionBtnText, { color: C.onTerracotta }]}>Save</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={{ marginTop: 22 }}>
          <BannerAd />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitleWrap: { alignItems: 'center' },
  kicker: {
    fontFamily: FONT.ui,
    fontSize: 11,
    fontWeight: '700',
    color: C.terracotta,
    letterSpacing: 1.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flameDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '700',
    color: C.ink70,
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginVertical: 16,
    marginHorizontal: -4,
  },
  flipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.ink10,
  },
  resultCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    shadowColor: C.terracotta,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultKicker: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '700',
    color: C.onTerracotta85,
    letterSpacing: 1.6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  resultCol: { alignItems: 'center', flex: 1 },
  resultBig: {
    fontFamily: FONT.display,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 60,
    color: C.onTerracotta,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  resultBigSuffix: {
    fontSize: 26,
    color: C.onTerracotta85,
  },
  resultLabel: {
    fontFamily: FONT.ui,
    fontSize: 11,
    color: C.onTerracotta70,
    marginTop: 6,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  resultDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: C.onTerracotta20,
    marginHorizontal: 8,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionPrimary: {
    flex: 2,
    backgroundColor: C.onTerracotta,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: C.onTerracotta18,
  },
  actionBtnText: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '600',
  },
});
