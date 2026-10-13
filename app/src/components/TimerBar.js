import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONT, GROW, RADIUS, PALETTES, buzz, useTheme, useReduceMotion } from '../theme';
import { Close, Bell, Restart } from '../icons';
import { formatRemaining } from '../timer';
import { GLASS, M3, GlassFill, GlassPressable, fade } from '../glass';
import { t } from '../i18n';

const CARD_HEIGHT = 70;
const PEEK = 10;
const CARD_GAP = 8;
const MAX_PEEKS = 2;

// Height of the collapsed stack, for screens that scroll behind it.
export function stackHeight(timers) {
  if (timers.length === 0) return 0;
  return CARD_HEIGHT + Math.min(timers.length - 1, MAX_PEEKS) * PEEK + 12;
}

// The cards wear the opposite palette to the screen, dark on light and light
// on dark, so a running timer never blends into what is behind it.
function useCardTheme() {
  const { mode } = useTheme();
  const scheme = mode === 'dark' ? 'light' : 'dark';
  const C = PALETTES[scheme];
  const styles = useMemo(() => makeStyles(C), [C]);
  return { C, styles, scheme };
}

export default function TimerStack({
  timers, onPressTimer, onCancel, onRestart, bottomInset = 0,
}) {
  const { C: pageC } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const expand = useRef(new Animated.Value(0)).current;

  const still = useReduceMotion();
  useEffect(() => {
    if (still) {
      expand.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.spring(expand, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 22,
      stiffness: 240,
    }).start();
  }, [expanded, expand, still]);

  // Newest first.
  const items = useMemo(() => [...timers].reverse(), [timers]);

  useEffect(() => {
    if (items.length <= 1 && expanded) setExpanded(false);
  }, [items.length, expanded]);

  if (items.length === 0) return null;

  const visiblePeeks = Math.min(items.length - 1, MAX_PEEKS);
  const collapsedH = CARD_HEIGHT + visiblePeeks * PEEK;
  const expandedH = items.length * CARD_HEIGHT + CARD_GAP * (items.length - 1);

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
        {items.map((item, idx) => {
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
          const press = () => {
            if (!expanded && items.length > 1) {
              buzz.choice();
              setExpanded(true);
            } else {
              onPressTimer?.(item.id);
              setExpanded(false);
            }
          };

          return (
            <Animated.View
              key={item.id}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: CARD_HEIGHT,
                zIndex: items.length - idx,
                transform: [{ translateY }, { scale }],
                opacity,
              }}
              pointerEvents={interactive ? 'auto' : 'none'}
            >
              <TimerCard
                timer={item}
                onPress={press}
                onCancel={() => onCancel?.(item.id)}
                onRestart={() => onRestart?.(item.id)}
              />
            </Animated.View>
          );
        })}
      </Animated.View>

      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={{ position: 'absolute', top: -22, left: 0, right: 0, alignItems: 'center', paddingVertical: 8 }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: pageC.ink30 }} />
        </Pressable>
      )}
    </View>
  );
}

// Time passed, as a ring.
function Ring({ frac, size = 38, C, done }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={mid} cy={mid} r={r} fill="none"
        stroke={done ? C.onTerracotta20 : C.ink10}
        strokeWidth={stroke}
      />
      <Circle
        cx={mid} cy={mid} r={r} fill="none"
        stroke={done ? C.onTerracotta : C.terracotta}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len * (1 - Math.max(0, Math.min(1, frac)))}
        transform={`rotate(-90 ${mid} ${mid})`}
      />
    </Svg>
  );
}

// Pulse a card while it is in the completed, ringing state.
function usePulse(active) {
  const pulse = useRef(new Animated.Value(1)).current;
  const still = useReduceMotion();
  useEffect(() => {
    if (!active || still) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 520, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 520, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, still]);
  return pulse;
}

function IconButton({ onPress, label, done, children }) {
  const { styles, scheme } = useCardTheme();
  return (
    <GlassPressable
      onPress={() => { buzz.action(); onPress?.(); }}
      hitSlop={12}
      clear
      scheme={scheme}
      accessibilityLabel={label}
      style={[styles.iconBtn, done && styles.iconBtnDone]}
    >
      {children}
    </GlassPressable>
  );
}

function TimerCard({ timer, onPress, onCancel, onRestart }) {
  const { C, styles, scheme } = useCardTheme();
  const isDone = timer.completed;
  const pulse = usePulse(isDone);
  const fg = isDone ? C.onTerracotta : C.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // Android keeps its shrink until AFC-44 gives the card a ripple.
      style={(state) => [{ flex: 1 }, M3 && state.pressed && { transform: [{ scale: 0.985 }] }]}
    >
      {(state) => (
        <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
          <View style={[styles.card, GLASS && styles.cardGlass, isDone && styles.cardDone]}>
            <GlassFill tint={isDone ? C.terracotta : C.paper} scheme={scheme} radius={RADIUS.lg} />
            {/* Only what is on the card fades: the card floats over the page,
                and a faded fill would let the page show through. */}
            <View style={[styles.cardRow, fade(state)]}>
              <Ring frac={timer.elapsedFrac} C={C} done={isDone} />
              <View style={styles.left}>
                <View style={styles.kickerRow}>
                  <Text style={[styles.kicker, isDone && { color: C.onTerracotta85 }]} numberOfLines={1} maxFontSizeMultiplier={GROW.display}>
                    {timer.label || t('timer.fallback_label')}
                  </Text>
                  {!isDone && timer.remindHalfway && <Bell s={11} c={C.ink50} />}
                </View>
                <Text style={[styles.time, { color: fg }]} numberOfLines={1} maxFontSizeMultiplier={GROW.display}>
                  {isDone ? t('timer.done') : formatRemaining(timer.remainingSec)}
                </Text>
              </View>

              {isDone && (
                <IconButton onPress={onRestart} label={t('timer.restart_a11y')} done>
                  <Restart s={18} c={fg} />
                </IconButton>
              )}
              <IconButton onPress={onCancel} label={t('timer.stop')} done={isDone}>
                <Close s={18} c={fg} />
              </IconButton>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: {
    flex: 1,
    // Solid under the glass: on its own the pale card of dark mode lets the
    // page show through.
    backgroundColor: C.paper,
    paddingHorizontal: 14,
    borderRadius: M3 ? 20 : RADIUS.lg,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: M3 ? 3 : 8,
    overflow: 'hidden',
  },
  cardRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardGlass: { shadowOpacity: 0, elevation: 0 },
  cardDone: { backgroundColor: C.terracotta },
  left: { flex: 1, minWidth: 0 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: M3 ? '500' : '600',
    color: C.ink70,
    flexShrink: 1,
  },
  time: {
    fontFamily: FONT.display,
    fontSize: 24,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  iconBtn: {
    width: M3 ? 40 : 44, height: M3 ? 40 : 44, borderRadius: 22,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDone: { backgroundColor: C.onTerracotta18 },
});
