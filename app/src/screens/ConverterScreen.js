import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, Animated, Easing, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, GROW, RADIUS, EDGE, BUTTON, LABEL, buzz, useTheme, useStyles, useReduceMotion } from '../theme';
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
    buzz.tap();
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

  const still = useReduceMotion();
  const spinTurns = useRef(0);
  const spin = useRef(new Animated.Value(0)).current;
  const flip = () => {
    setDirection(isOvenToAir ? 'air-to-oven' : 'oven-to-air');
    buzz.tap();
    spinTurns.current += 1;
    Animated.timing(spin, {
      toValue: spinTurns.current,
      duration: still ? 0 : 420,
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
                style={styles.shareBtn}
              >
                <ShareIcon s={18} c={C.onTerracotta} />
              </GlassPressable>
              <Segmented
                compact
                tone="onTerracotta"
                options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
                value={targetUnit}
                onChange={setTargetUnit}
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
                buzz.action();
                onStartTimer?.(result.time);
              }}
              tint={C.onTerracotta}
              scheme="light"
              style={[styles.actionBtn, styles.actionPrimary]}
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
              onPress={() => { buzz.action(); onSave(); }}
              clear
              scheme="light"
              style={[styles.actionBtn, styles.actionSecondary]}
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
  kicker: { ...LABEL, color: C.terracotta },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  flameDot: {
    width: M3 ? 28 : 22,
    height: M3 ? 28 : 22,
    // A circle on both.
    borderRadius: M3 ? 14 : 11,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '500',
    color: C.ink70,
    letterSpacing: 0.1,
    flexShrink: 1,
  } : { ...LABEL, color: C.ink70, flexShrink: 1 },
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
    borderWidth: EDGE,
    borderColor: C.ink10,
  },
  resultCard: M3 ? {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 20,
  } : {
    borderRadius: RADIUS.lg,
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
  resultKicker: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '500',
    color: C.onTerracotta85,
    letterSpacing: 0.1,
    flexShrink: 1,
  } : { ...LABEL, color: C.onTerracotta85, flexShrink: 1 },
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
  resultLabel: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 11,
    color: C.onTerracotta70,
    marginTop: 6,
    letterSpacing: 0.4,
    fontWeight: '500',
  } : { ...LABEL, color: C.onTerracotta70, marginTop: 6 },
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
    height: M3 ? 56 : BUTTON.height,
    borderRadius: M3 ? 28 : GLASS ? BUTTON.height / 2 : RADIUS.md,
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
