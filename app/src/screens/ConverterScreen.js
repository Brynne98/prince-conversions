import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, Animated, Easing, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, GROW, useTheme, useStyles } from '../theme';
import { Stepper, Segmented, Card, RoundButton, AppBar } from '../primitives';
import { GLASS, M3, cap, GlassPressable } from '../glass';
import { BannerAd } from '../ads';
import {
  Bookmark, Flame, Gear, List, MaterialList, MaterialSettings, Swap, Play, ShareIcon,
} from '../icons';
import { convert, fToC, cToF, formatMinutes } from '../convert';
import { capture } from '../analytics';
import { t } from '../i18n';

const STORE_URL = Platform.select({
  android: 'https://play.google.com/store/apps/details?id=com.brynneprince.airfryerconverter',
  default: 'https://apps.apple.com/app/id6764600062',
});

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
  const sourceLabel = cap(t(isOvenToAir ? 'converter.oven_recipe' : 'converter.air_fryer_recipe'));
  const targetLabel = cap(t(isOvenToAir ? 'common.air_fryer' : 'common.oven'));

  // "425°F oven for 25 min → 400°F air fryer for 20 min"
  const share = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const from = t(isOvenToAir ? 'converter.share_oven' : 'converter.share_air', {
      temp: `${ovenTemp}°${unit}`, time: formatMinutes(ovenTime),
    });
    const to = t(isOvenToAir ? 'converter.share_air' : 'converter.share_oven', {
      temp: `${result.temp}°${targetUnit}`, time: formatMinutes(result.time),
    });
    const message = `${from} → ${to}\n\n${t('converter.share_footer')}\n${STORE_URL}`;
    try {
      // Message only: the link is already in the text, and passing it as a
      // separate `url` on iOS makes Messages send it twice.
      const res = await Share.share({ message }, { subject: t('converter.share_subject') });
      if (res.action === Share.sharedAction) {
        capture('result_shared', { direction, source_unit: unit, target_unit: targetUnit });
      }
    } catch {}
  };

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
      {M3 ? (
        <AppBar title={t('converter.kicker')}>
          <RoundButton onPress={onOpenSaved} tone="plain" accessibilityLabel={t('converter.saved_recipes')}>
            <MaterialList />
          </RoundButton>
          <RoundButton onPress={onOpenSettings} tone="plain" accessibilityLabel={t('settings.title')}>
            <MaterialSettings />
          </RoundButton>
        </AppBar>
      ) : (
        <View style={styles.topBar}>
          <RoundButton onPress={onOpenSaved} size={44} accessibilityLabel={t('converter.saved_recipes')}>
            <List s={20} />
          </RoundButton>
          <View style={styles.topTitleWrap}>
            <Text style={styles.kicker} maxFontSizeMultiplier={GROW.bar}>{t('converter.kicker').toUpperCase()}</Text>
          </View>
          <RoundButton onPress={onOpenSettings} size={44} accessibilityLabel={t('settings.title')}>
            <Gear s={19} />
          </RoundButton>
        </View>
      )}

      {/* Direction toggle */}
      <View style={styles.directionRow}>
        <Segmented
          options={[
            { value: 'oven-to-air', label: t('converter.oven_to_air') },
            { value: 'air-to-oven', label: t('converter.air_to_oven') },
          ]}
          value={direction}
          onChange={setDirection}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: M3 ? 16 : 20, paddingTop: 0, paddingBottom: 24 + bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        {/* Source card */}
        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.cardLabelRow}>
              <View style={styles.flameDot}>
                <Flame s={M3 ? 16 : 14} c={C.terracottaDeep} />
              </View>
              <Text style={styles.cardLabel} numberOfLines={1} maxFontSizeMultiplier={GROW.bar}>{sourceLabel}</Text>
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
          <GlassPressable onPress={flip} hitSlop={10} style={styles.flipBtn} accessibilityLabel={t('converter.swap')}>
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              <Swap s={M3 ? 20 : 18} c={C.terracotta} />
            </Animated.View>
          </GlassPressable>
        </View>

        {/* Result card */}
        <LinearGradient
          // Flat on Android: Material lifts with colour, not a gradient or a shadow.
          colors={[C.terracotta, M3 ? C.terracotta : '#B14E29']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultKicker} numberOfLines={1} maxFontSizeMultiplier={GROW.bar}>{targetLabel}</Text>
            <View style={styles.resultHeaderRight}>
              <GlassPressable
                onPress={share}
                hitSlop={8}
                accessibilityLabel={t('converter.share')}
                clear
                scheme="light"
                style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <ShareIcon s={18} c={C.onTerracotta} />
              </GlassPressable>
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
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCol}>
              <Text
                style={styles.resultBig}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={GROW.display}
              >
                {result.temp}
                <Text style={styles.resultBigSuffix}>°{targetUnit}</Text>
              </Text>
              <Text style={styles.resultLabel} numberOfLines={1} maxFontSizeMultiplier={GROW.bar}>{cap(t('converter.temperature'))}</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCol}>
              <Text
                style={styles.resultBig}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={GROW.display}
              >
                {result.time < 60 ? (
                  <>
                    {result.time}
                    <Text style={styles.resultBigSuffix}> {t('common.min')}</Text>
                  </>
                ) : (
                  <>
                    {Math.floor(result.time / 60)}
                    <Text style={styles.resultBigSuffix}> {t('common.hr')}</Text>
                    {result.time % 60 > 0 ? ` ${result.time % 60}` : ''}
                    {result.time % 60 > 0 ? <Text style={styles.resultBigSuffix}> {t('common.min')}</Text> : null}
                  </>
                )}
              </Text>
              <Text style={styles.resultLabel} numberOfLines={1} maxFontSizeMultiplier={GROW.bar}>{cap(t('converter.time'))}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <GlassPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onStartTimer?.(result.time);
              }}
              tint={C.onTerracotta}
              scheme="light"
              style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Play s={14} c={C.terracotta} />
              <Text
                style={[styles.actionBtnText, { color: C.terracotta }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={GROW.bar}
              >
                {t('converter.start_timer')}
              </Text>
            </GlassPressable>
            <GlassPressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSave(); }}
              clear
              scheme="light"
              style={({ pressed }) => [styles.actionBtn, styles.actionSecondary, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Bookmark s={16} c={C.onTerracotta} />
              <Text
                style={[styles.actionBtnText, { color: C.onTerracotta }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={GROW.bar}
              >
                {t('common.save')}
              </Text>
            </GlassPressable>
          </View>
        </LinearGradient>

        <View style={{ marginTop: 22 }}>
          <BannerAd placement="converter" size="box" />
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
  directionRow: M3
    ? { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, alignItems: 'center' }
    : { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, alignItems: 'center' },
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
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  flameDot: {
    width: M3 ? 28 : 22,
    height: M3 ? 28 : 22,
    borderRadius: M3 ? 14 : 6,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: M3 ? '500' : '700',
    color: C.ink70,
    letterSpacing: M3 ? 0.1 : 0.5,
    flexShrink: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginVertical: 16,
    marginHorizontal: -4,
  },
  // Android: a small tonal icon button.
  flipBtn: M3 ? {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  } : {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.ink10,
  },
  resultCard: M3 ? {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 20,
  } : {
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
  resultHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Matches the °C/°F switch beside it; the hit area reaches 44pt.
  shareBtn: {
    width: M3 ? 40 : 38, height: M3 ? 40 : 38, borderRadius: 20,
    backgroundColor: C.onTerracotta18,
    alignItems: 'center', justifyContent: 'center',
  },
  resultKicker: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: M3 ? '500' : '700',
    color: C.onTerracotta85,
    letterSpacing: M3 ? 0.1 : 1.6,
    flexShrink: 1,
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
    letterSpacing: M3 ? 0.4 : 0.8,
    fontWeight: M3 ? '500' : '600',
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
  // On iOS 26 the buttons are glass capsules, as Apple's are. Android's are
  // Material's medium buttons: 56dp and fully round.
  actionBtn: {
    height: M3 ? 56 : 48,
    borderRadius: M3 ? 28 : GLASS ? 24 : 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  actionPrimary: {
    flex: 2,
    backgroundColor: C.onTerracotta,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: C.onTerracotta18,
  },
  // Shrinks a little for a long word, such as the French for Save.
  actionBtnText: {
    flexShrink: 1,
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: M3 ? '500' : '600',
  },
});
