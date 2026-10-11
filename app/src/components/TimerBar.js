import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { FONT, PALETTES, useTheme } from '../theme';
import { Close, Bell, Restart } from '../icons';
import { formatRemaining } from '../timer';
import { GLASS, M3, GlassFill, GlassPressable } from '../glass';
import { t } from '../i18n';

const CARD_HEIGHT = 70;
const PLAN_HEAD = 44;
const PLAN_ROW = 52;
const PLAN_PAD = 8;
const PEEK = 10;
const CARD_GAP = 8;
const MAX_PEEKS = 2;

// Newest first. Foods started as one plan become one item, placed where the
// newest of them would be. A plan down to one food is an ordinary timer.
function groupTimers(timers) {
  const items = [];
  const byPlan = new Map();
  for (const timer of [...timers].reverse()) {
    const group = timer.planId && byPlan.get(timer.planId);
    if (group) {
      group.timers.push(timer);
      continue;
    }
    const item = { key: timer.planId || timer.id, timers: [timer] };
    if (timer.planId) byPlan.set(timer.planId, item);
    items.push(item);
  }
  // Inside a plan: the food that goes in first on top.
  for (const item of items) item.timers.sort((x, y) => x.startedAt - y.startedAt);
  return items;
}

const itemHeight = (item) => (
  item.timers.length > 1
    ? PLAN_HEAD + PLAN_ROW * item.timers.length + PLAN_PAD
    : CARD_HEIGHT
);

// Height of the collapsed stack, for screens that scroll behind it.
export function stackHeight(timers) {
  const items = groupTimers(timers);
  if (items.length === 0) return 0;
  return itemHeight(items[0]) + Math.min(items.length - 1, MAX_PEEKS) * PEEK + 12;
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

  useEffect(() => {
    Animated.spring(expand, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 22,
      stiffness: 240,
    }).start();
  }, [expanded, expand]);

  const items = useMemo(() => groupTimers(timers), [timers]);

  useEffect(() => {
    if (items.length <= 1 && expanded) setExpanded(false);
  }, [items.length, expanded]);

  if (items.length === 0) return null;

  const heights = items.map(itemHeight);
  const frontH = heights[0];
  const visiblePeeks = Math.min(items.length - 1, MAX_PEEKS);
  const collapsedH = frontH + visiblePeeks * PEEK;
  const expandedH = heights.reduce((sum, h) => sum + h, 0) + CARD_GAP * (items.length - 1);

  const containerHeight = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedH, expandedH],
  });

  let above = 0;

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
          const expandedY = -above;
          above += heights[idx] + CARD_GAP;

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
          // Behind the front card, a taller card is cut to the front's height
          // so only its edge peeks out.
          const height = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [frontH, heights[idx]],
          });

          const interactive = expanded || idx <= visiblePeeks;
          const press = (id) => {
            if (!expanded && items.length > 1) {
              Haptics.selectionAsync();
              setExpanded(true);
            } else {
              onPressTimer?.(id);
              setExpanded(false);
            }
          };

          return (
            <Animated.View
              key={item.key}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height,
                zIndex: items.length - idx,
                transform: [{ translateY }, { scale }],
                opacity,
              }}
              pointerEvents={interactive ? 'auto' : 'none'}
            >
              {item.timers.length > 1 ? (
                <PlanCard
                  timers={item.timers}
                  onPress={press}
                  onCancel={() => onCancel?.(item.timers.map((x) => x.id))}
                />
              ) : (
                <TimerCard
                  timer={item.timers[0]}
                  onPress={() => press(item.timers[0].id)}
                  onCancel={() => onCancel?.(item.timers[0].id)}
                  onRestart={() => onRestart?.(item.timers[0].id)}
                />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>

      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          hitSlop={8}
          style={{ position: 'absolute', top: -22, left: 0, right: 0, alignItems: 'center', paddingVertical: 8 }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: pageC.ink30 }} />
        </Pressable>
      )}
    </View>
  );
}

// Time passed, as a ring. A food still waiting to go in has a dashed ring.
function Ring({ frac, waiting, size = 38, C, done }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        // Keyed: the dashes don't clear when the prop is removed.
        key={waiting ? 'waiting' : 'track'}
        cx={mid} cy={mid} r={r} fill="none"
        stroke={done ? C.onTerracotta20 : C.ink10}
        strokeWidth={waiting ? 2 : stroke}
        strokeDasharray={waiting ? '3 5' : undefined}
      />
      {!waiting && (
        <Circle
          cx={mid} cy={mid} r={r} fill="none"
          stroke={done ? C.onTerracotta : C.terracotta}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - Math.max(0, Math.min(1, frac)))}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      )}
    </Svg>
  );
}

// Pulse a card while it is in the completed, ringing state.
function usePulse(active) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) {
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
  }, [active, pulse]);
  return pulse;
}

function IconButton({ onPress, label, done, children }) {
  const { styles, scheme } = useCardTheme();
  return (
    <GlassPressable
      onPress={onPress}
      hitSlop={12}
      clear
      scheme={scheme}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, done && styles.iconBtnDone, { opacity: pressed ? 0.7 : 1 }]}
    >
      {children}
    </GlassPressable>
  );
}

function TimerCard({ timer, onPress, onCancel, onRestart }) {
  const { C, styles, scheme } = useCardTheme();
  const isDone = timer.completed;
  const isWaiting = !isDone && timer.waitingSec > 0;
  const pulse = usePulse(isDone);
  const fg = isDone ? C.onTerracotta : C.ink;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
        <View style={[styles.card, styles.cardRow, GLASS && styles.cardGlass, isDone && styles.cardDone]}>
          <GlassFill tint={isDone ? C.terracotta : C.paper} scheme={scheme} radius={26} />
          <Ring frac={timer.elapsedFrac} waiting={isWaiting} C={C} done={isDone} />
          <View style={styles.left}>
            <View style={styles.kickerRow}>
              <Text style={[styles.kicker, isDone && { color: C.onTerracotta85 }]} numberOfLines={1}>
                {timer.label || 'Cook timer'}
              </Text>
              {!isDone && !isWaiting && timer.remindHalfway && <Bell s={11} c={C.ink50} />}
            </View>
            <Text style={[isWaiting ? styles.wait : styles.time, { color: fg }]} numberOfLines={1}>
              {isDone
                ? t('plan.done')
                : isWaiting
                  ? t('plan.later', { time: formatRemaining(timer.waitingSec) })
                  : formatRemaining(timer.remainingSec)}
            </Text>
          </View>

          {isDone && (
            <IconButton onPress={onRestart} label="Restart timer" done>
              <Restart s={18} c={fg} />
            </IconButton>
          )}
          <IconButton onPress={onCancel} label="Cancel timer" done={isDone}>
            <Close s={18} c={fg} />
          </IconButton>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// A running "finish together" plan: when it is ready, and what each food is
// doing. Cancelling it cancels every food in it.
function PlanCard({ timers, onPress, onCancel }) {
  const { C, styles, scheme } = useCardTheme();
  const allDone = timers.every((x) => x.completed);
  const pulse = usePulse(allDone);
  const readySec = Math.max(...timers.map((x) => x.waitingSec + x.remainingSec));
  const fg = allDone ? C.onTerracotta : C.ink;

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
      <View style={[styles.card, GLASS && styles.cardGlass, allDone && styles.cardDone]}>
        <GlassFill tint={allDone ? C.terracotta : C.paper} scheme={scheme} radius={26} />
        <Pressable onPress={() => onPress(timers[0].id)} style={styles.planHead}>
          <Text style={[styles.planTitle, { color: fg }]} numberOfLines={1}>{t('plan.title')}</Text>
          <Text style={[styles.planReady, allDone && { color: C.onTerracotta85 }]} numberOfLines={1}>
            {allDone ? t('plan.done') : t('plan.ready_in', { time: formatRemaining(readySec) })}
          </Text>
          <IconButton onPress={onCancel} label="Cancel plan" done={allDone}>
            <Close s={18} c={fg} />
          </IconButton>
        </Pressable>
        {timers.map((timer) => {
          const isDone = timer.completed;
          const isWaiting = !isDone && timer.waitingSec > 0;
          return (
            <Pressable key={timer.id} onPress={() => onPress(timer.id)} style={styles.planRow}>
              <Ring frac={timer.elapsedFrac} waiting={isWaiting} size={32} C={C} done={allDone} />
              <Text style={[styles.planLabel, { color: fg }]} numberOfLines={1}>{timer.label}</Text>
              <Text style={[isWaiting ? styles.planWait : styles.planTime, !isWaiting && { color: fg }]} numberOfLines={1}>
                {isDone
                  ? t('plan.done')
                  : isWaiting
                    ? t('plan.later', { time: formatRemaining(timer.waitingSec) })
                    : formatRemaining(timer.remainingSec)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: GLASS ? 'transparent' : C.paper,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: M3 ? 3 : 8,
    overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardGlass: { borderRadius: 26, shadowOpacity: 0, elevation: 0 },
  cardDone: { backgroundColor: GLASS ? 'transparent' : C.terracotta },
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
  wait: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  iconBtn: {
    width: M3 ? 40 : 44, height: M3 ? 40 : 44, borderRadius: 22,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDone: { backgroundColor: C.onTerracotta18 },
  planHead: {
    height: PLAN_HEAD + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planTitle: { flex: 1, fontFamily: FONT.ui, fontSize: 14, fontWeight: '600' },
  planReady: {
    fontFamily: FONT.ui, fontSize: 13, color: C.ink70, fontVariant: ['tabular-nums'],
  },
  planRow: {
    height: PLAN_ROW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.divider,
  },
  planLabel: { flex: 1, fontFamily: FONT.ui, fontSize: 14, fontWeight: M3 ? '500' : '600' },
  planTime: {
    fontFamily: FONT.display,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  planWait: {
    fontFamily: FONT.ui, fontSize: 13, color: C.ink70, fontVariant: ['tabular-nums'],
  },
});
