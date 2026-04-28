import React, { useEffect, useRef } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '../theme';
import { Close, Restart } from '../icons';
import { Toggle } from '../primitives';
import { formatRemaining } from '../timer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerScreen({
  visible, onClose, onCancel, onRestart,
  remainingSec, totalSec, elapsedFrac, startedAt, label,
  remindHalfway, onToggleHalfway, completed,
}) {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.kicker}>COOK TIMER</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Close s={18} c={C.ink70} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={ringSize} height={ringSize}>
              <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={C.ink10}
                  strokeWidth={stroke}
                  fill="none"
                />
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
                  <Text style={styles.doneText}>Done!</Text>
                  <Text style={styles.doneSub}>Tap restart or cancel</Text>
                </>
              ) : (
                <>
                  <Text style={styles.timeText} numberOfLines={1}>
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
                <Text style={styles.halfLabel}>Shake halfway reminder</Text>
                <Text style={styles.halfSub}>Chime at the midpoint of this cook</Text>
              </View>
              <Toggle
                value={!!remindHalfway}
                onValueChange={(v) => onToggleHalfway?.(v)}
              />
            </View>
          )}

          <View style={styles.actionRow}>
            {completed && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onRestart?.();
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.restartBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Restart s={18} c={C.onTerracotta} />
                <Text style={styles.restartText}>Restart</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onCancel?.();
                onClose?.();
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.cancelBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
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
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 12,
  },
  halfRow: {
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
  halfLabel: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  halfSub: {
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: C.ink,
  },
  cancelText: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
    color: C.cream,
    letterSpacing: -0.2,
  },
  restartBtn: {
    backgroundColor: C.terracotta,
  },
  restartText: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
    color: C.onTerracotta,
    letterSpacing: -0.2,
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
