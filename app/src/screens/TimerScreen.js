import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { FONT, GROW, useTheme, useStyles } from '../theme';
import { Restart } from '../icons';
import { Toggle, Sheet, CloseButton, AppBar } from '../primitives';
import { GLASS, M3, GlassPressable } from '../glass';
import { formatRemaining } from '../timer';
import { t } from '../i18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerScreen({
  visible, onClose, onCancel, onRestart,
  remainingSec, totalSec, elapsedFrac, startedAt, label,
  remindHalfway, onToggleHalfway, completed,
}) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const screenW = Dimensions.get('window').width;
  const ringSize = Math.min(screenW - 64, 320);
  const stroke = 14;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useRef(new Animated.Value(0)).current;

  // When the screen opens, fast-forward to the current elapsed fraction,
  // then animate the rest of the way to 1 over the remaining time.
  useEffect(() => {
    if (!visible) return;
    const initialFrac = Math.max(0, Math.min(1, elapsedFrac));
    progress.setValue(initialFrac);
    if (initialFrac >= 1) return;
    const remainingMs = (totalSec * (1 - initialFrac)) * 1000;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(200, remainingMs),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
    // We re-run when startedAt changes (timer restarted), not on every elapsedFrac tick.
  }, [visible, startedAt, totalSec]); // eslint-disable-line react-hooks/exhaustive-deps

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  // Android: Material's progress ring leaves a gap between the done part and
  // the rest. A page-coloured arc, a little longer than the done part at both
  // ends, cuts that gap out of the track.
  const gap = stroke / 2 + 6;
  const gapOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference - 2 * gap, -2 * gap],
  });
  const gapTurn = (gap / circumference) * 360;

  return (
    <Sheet visible={visible} onClose={onClose} handle={false}>
      {M3 ? (
        <AppBar title={t('timer.fallback_label')} leading="close" onLeading={onClose} />
      ) : (
        <View style={styles.header}>
          <Text style={styles.kicker} maxFontSizeMultiplier={GROW.bar}>{t('timer.fallback_label').toUpperCase()}</Text>
          <CloseButton onPress={onClose} />
        </View>
      )}

      <View style={styles.center}>
        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={M3 ? C.terracottaSoft : C.ink10}
                strokeWidth={stroke}
                fill="none"
              />
              {M3 && !completed && (
                <AnimatedCircle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={C.cream}
                  strokeWidth={stroke + 2}
                  fill="none"
                  rotation={-gapTurn}
                  origin={`${ringSize / 2}, ${ringSize / 2}`}
                  strokeDasharray={`${circumference}, ${circumference}`}
                  strokeDashoffset={gapOffset}
                />
              )}
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={C.terracotta}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference}, ${circumference}`}
                strokeDashoffset={dashOffset}
              />
            </G>
          </Svg>

          <View style={styles.centerText} pointerEvents="none">
            {completed ? (
              <>
                <Text style={styles.doneText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={GROW.display}>{t('timer.done')}</Text>
                <Text style={styles.doneSub}>{t('timer.done_hint')}</Text>
              </>
            ) : (
              <>
                <Text
                  style={styles.timeText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  maxFontSizeMultiplier={GROW.display}
                >
                  {formatRemaining(remainingSec)}
                </Text>
                {!!label && <Text style={styles.labelText}>{label}</Text>}
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {!completed && (
          <View style={styles.halfRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.halfLabel}>{t('timer.half_label')}</Text>
              <Text style={styles.halfSub}>{t('timer.half_sub')}</Text>
            </View>
            <Toggle
              value={!!remindHalfway}
              onValueChange={(v) => onToggleHalfway?.(v)}
            />
          </View>
        )}

        <View style={styles.actionRow}>
          {completed && (
            <GlassPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRestart?.();
              }}
              tint={C.terracotta}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.restartBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Restart s={18} c={C.onTerracotta} />
              <Text style={styles.restartText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={GROW.bar}>{t('timer.restart')}</Text>
            </GlassPressable>
          )}
          <GlassPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onCancel?.();
              onClose?.();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.stopBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {/* Stopping a running timer throws its time away, so it reads as
                a delete; a finished one has nothing left to lose. */}
            <Text
              style={[styles.stopText, !completed && { color: C.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={GROW.bar}
            >
              {t('timer.stop')}
            </Text>
          </GlassPressable>
        </View>
      </View>
    </Sheet>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '700',
    color: C.terracotta,
    letterSpacing: 1.6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: FONT.display,
    fontSize: 76,
    color: C.ink,
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
    lineHeight: 80,
  },
  labelText: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: M3 ? 16 : 20,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 12,
  },
  // Android: a plain Material list item, with no card around it.
  halfRow: M3 ? {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  } : {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  halfLabel: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 15,
    lineHeight: 22,
    color: C.ink,
  } : {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  halfSub: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 12,
    lineHeight: 16,
    color: C.ink70,
  } : {
    fontFamily: FONT.ui,
    fontSize: 12,
    color: C.ink50,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: GLASS || M3 ? 28 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  // Plain glass on iOS 26; a tonal button on Android; a faint wash on older
  // iPhones.
  stopBtn: {
    backgroundColor: M3 ? C.terracottaSoft : C.ink06,
  },
  stopText: {
    flexShrink: 1,
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: M3 ? '500' : '600',
    color: M3 ? C.terracottaDeep : C.ink,
    letterSpacing: M3 ? 0 : -0.2,
  },
  restartBtn: {
    backgroundColor: C.terracotta,
  },
  restartText: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: M3 ? '500' : '600',
    color: C.onTerracotta,
    letterSpacing: M3 ? 0 : -0.2,
    flexShrink: 1,
  },
  doneText: {
    fontFamily: FONT.display,
    fontSize: 64,
    color: C.terracottaDeep,
    letterSpacing: -2,
    lineHeight: 68,
  },
  doneSub: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
    marginTop: 8,
    fontWeight: '500',
  },
});
