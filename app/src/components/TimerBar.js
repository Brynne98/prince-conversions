import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '../theme';
import { Close, Bell, Restart } from '../icons';
import { formatRemaining } from '../timer';

const CARD_HEIGHT = 70;
const PEEK = 10;
const CARD_GAP = 8;
const MAX_PEEKS = 2;

export default function TimerStack({
  timers, onPressTimer, onCancel, onRestart, bottomInset = 0,
}) {
  const [expanded, setExpanded] = useState(false);
  const expand = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(expand, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 22,
      stiffness: 240,
    }).start();
  }, [expanded, expand]);

  useEffect(() => {
    if (timers.length <= 1 && expanded) setExpanded(false);
  }, [timers.length, expanded]);

  const reversed = useMemo(() => [...timers].reverse(), [timers]);

  if (reversed.length === 0) return null;

  const visiblePeeks = Math.min(reversed.length - 1, MAX_PEEKS);
  const collapsedH = CARD_HEIGHT + visiblePeeks * PEEK;
  const expandedH =
    CARD_HEIGHT * reversed.length + CARD_GAP * (reversed.length - 1);

  const containerHeight = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedH, expandedH],
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12 + bottomInset,
      }}
    >
      <Animated.View style={{ height: containerHeight }}>
        {reversed.map((t, idx) => {
          const isFront = idx === 0;
          const collapsedY = -idx * PEEK;
          const collapsedScale = Math.max(0.88, 1 - idx * 0.05);
          const collapsedOpacity = idx > visiblePeeks ? 0 : 1 - idx * 0.18;
          const expandedY = -idx * (CARD_HEIGHT + CARD_GAP);

          const translateY = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [collapsedY, expandedY],
          });
          const scale = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [collapsedScale, 1],
          });
          const opacity = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [collapsedOpacity, 1],
          });

          const interactive = expanded || idx <= visiblePeeks;

          return (
            <Animated.View
              key={t.id}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: CARD_HEIGHT,
                zIndex: reversed.length - idx,
                transform: [{ translateY }, { scale }],
                opacity,
              }}
              pointerEvents={interactive ? 'auto' : 'none'}
            >
              <TimerCard
                timer={t}
                onPress={() => {
                  if (!expanded && reversed.length > 1) {
                    Haptics.selectionAsync();
                    setExpanded(true);
                  } else {
                    onPressTimer?.(t.id);
                    setExpanded(false);
                  }
                }}
                onCancel={() => onCancel?.(t.id)}
                onRestart={() => onRestart?.(t.id)}
              />
            </Animated.View>
          );
        })}
      </Animated.View>

      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          hitSlop={8}
          style={styles.collapseHandle}
        >
          <View style={styles.collapseGrip} />
        </Pressable>
      )}
    </View>
  );
}

function TimerCard({ timer, onPress, onCancel, onRestart }) {
  // Pulse the card while it's in the completed/ringing state.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!timer.completed) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 520, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 520, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [timer.completed, pulse]);

  const isDone = timer.completed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
        <LinearGradient
          colors={isDone ? ['#E07246', '#A8451F'] : [C.terracotta, '#B14E29']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.left}>
            <View style={styles.kickerRow}>
              <Text style={styles.kicker} numberOfLines={1}>
                {timer.label || 'COOK TIMER'}
              </Text>
              {isDone ? (
                <View style={[styles.badge, styles.badgeDone]}>
                  <Text style={[styles.badgeText, { color: C.terracottaDeep }]}>DONE</Text>
                </View>
              ) : timer.remindHalfway ? (
                <View style={styles.badge}>
                  <Bell s={11} c={C.onTerracotta} />
                  <Text style={styles.badgeText}>HALFWAY</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.time} numberOfLines={1}>
              {isDone ? 'Done!' : formatRemaining(timer.remainingSec)}
            </Text>
          </View>

          {isDone && (
            <Pressable
              onPress={onRestart}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Restart s={18} c={C.onTerracotta} />
            </Pressable>
          )}
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Close s={18} c={C.onTerracotta} />
          </Pressable>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${timer.elapsedFrac * 100}%` }]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: C.terracotta,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: 'hidden',
  },
  left: { flex: 1, minWidth: 0 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    fontFamily: FONT.ui,
    fontSize: 11,
    fontWeight: '700',
    color: C.onTerracotta85,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,247,238,0.20)',
  },
  badgeDone: {
    backgroundColor: '#FFF7EE',
  },
  badgeText: {
    fontFamily: FONT.ui,
    fontSize: 9,
    fontWeight: '700',
    color: C.onTerracotta,
    letterSpacing: 0.6,
  },
  time: {
    fontFamily: FONT.display,
    fontSize: 24,
    fontWeight: '500',
    color: C.onTerracotta,
    marginTop: 1,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,247,238,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  progressTrack: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,247,238,0.20)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.onTerracotta,
  },
  collapseHandle: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
  },
  collapseGrip: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.ink30,
  },
});
