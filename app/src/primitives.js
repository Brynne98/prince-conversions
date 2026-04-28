import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, View, Animated, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, FONT } from './theme';
import { Plus, Minus } from './icons';

// ─── Hold-to-repeat button ────────────────────────────────────────────
// Tap fires onTrigger once. Holding past 320ms starts auto-repeat that
// gets faster the longer you hold (clamped at 35ms between ticks).
function HoldButton({ onTrigger, children, style }) {
  const timerRef = useRef(null);
  const triggerRef = useRef(onTrigger);
  useEffect(() => { triggerRef.current = onTrigger; }, [onTrigger]);

  const stop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    stop();
    Haptics.selectionAsync();
    triggerRef.current?.();
    let delay = 320;
    const tick = () => {
      triggerRef.current?.();
      Haptics.selectionAsync();
      delay = Math.max(35, delay * 0.8);
      timerRef.current = setTimeout(tick, delay);
    };
    timerRef.current = setTimeout(tick, delay);
  };

  useEffect(() => () => stop(), []);

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      hitSlop={10}
      style={style}
    >
      {children}
    </Pressable>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────
export function Stepper({ value, onChange, step, min = 0, max = 999, suffix, big = false }) {
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const dec = () => {
    const next = Math.max(min, valueRef.current - step);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
  };
  const inc = () => {
    const next = Math.min(max, valueRef.current + step);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
  };

  const valueSize = big ? 88 : 64;
  const suffixSize = big ? 36 : 28;

  return (
    <View style={styles.stepperRow}>
      <HoldButton onTrigger={dec} style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Minus s={20} c={C.ink} />
      </HoldButton>
      <View style={styles.stepperValueWrap}>
        <Text
          style={[styles.stepperValue, { fontSize: valueSize, lineHeight: valueSize }]}
          numberOfLines={1}
        >
          {value}
          {suffix ? (
            <Text style={[styles.stepperSuffix, { fontSize: suffixSize }]}>{suffix}</Text>
          ) : null}
        </Text>
      </View>
      <HoldButton onTrigger={inc} style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Plus s={20} c={C.ink} />
      </HoldButton>
    </View>
  );
}

// ─── Custom toggle ───────────────────────────────────────────────────
// Owns its own Animated.Value so parent re-renders (e.g. timer ticks)
// don't interrupt the slide animation.
export function Toggle({ value, onValueChange, onColor = C.terracotta }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      damping: 18,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <Pressable
      onPress={() => {
        onValueChange?.(!value);
        Haptics.selectionAsync();
      }}
      hitSlop={8}
    >
      <View style={[styles.toggleTrack, { backgroundColor: C.ink10 }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: onColor, borderRadius: 14, opacity: anim },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.toggleThumb, { transform: [{ translateX: thumbX }] }]}
        />
      </View>
    </Pressable>
  );
}

export function RoundButton({ onPress, children, size = 44 }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [
      styles.roundBtn,
      { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.6 : 1 },
    ]}>
      {children}
    </Pressable>
  );
}

// ─── Segmented control ───────────────────────────────────────────────
export function Segmented({ options, value, onChange, compact = false }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const slide = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: idx,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [idx, slide]);

  const padV = compact ? 6 : 8;
  const padH = compact ? 14 : 18;
  const fontSize = compact ? 13 : 14;

  return (
    <View style={styles.segWrap}>
      <SegmentedTrack count={options.length} slide={slide} />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) {
                onChange(o.value);
                Haptics.selectionAsync();
              }
            }}
            style={{ paddingVertical: padV, paddingHorizontal: padH, zIndex: 1 }}
          >
            <Text style={{
              fontFamily: FONT.ui,
              fontSize,
              fontWeight: '600',
              color: active ? C.ink : C.ink50,
              letterSpacing: -0.1,
            }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SegmentedTrack({ count, slide }) {
  const [width, setWidth] = useState(0);
  const segW = width > 0 ? (width - 6) / count : 0;
  const left = slide.interpolate({
    inputRange: Array.from({ length: count }, (_, i) => i),
    outputRange: Array.from({ length: count }, (_, i) => 3 + i * segW),
  });
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={StyleSheet.absoluteFill}
    >
      {segW > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left,
            width: segW,
            backgroundColor: C.paper,
            borderRadius: 999,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        />
      )}
    </View>
  );
}

// ─── Ad slot ─────────────────────────────────────────────────────────
export function AdSlot({ height = 64, label = 'Ad · 320×50 banner', native = false, style }) {
  if (native) {
    return (
      <View style={[styles.adNative, style]}>
        <View style={styles.adNativeThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.adNativeTitle}>Sponsored</Text>
          <Text style={styles.adNativeSub}>Native ad placement · in-feed</Text>
        </View>
        <Text style={styles.adNativeTag}>AD</Text>
      </View>
    );
  }
  return (
    <View style={[styles.adBanner, { height }, style]}>
      <Text style={styles.adBannerLabel}>{label}</Text>
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  stepperValueWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: FONT.display,
    fontWeight: '500',
    color: C.ink,
    letterSpacing: -3,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepperSuffix: {
    fontFamily: FONT.display,
    fontWeight: '400',
    color: C.ink50,
    letterSpacing: -0.5,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  roundBtn: {
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF7EE',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: C.ink06,
    borderRadius: 999,
    padding: 3,
  },
  card: {
    backgroundColor: C.paper,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  adBanner: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.ink30,
    borderRadius: 12,
    backgroundColor: C.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBannerLabel: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: C.ink50,
    letterSpacing: 0.5,
  },
  adNative: {
    backgroundColor: C.creamDeep,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.ink30,
  },
  adNativeThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.ink10,
  },
  adNativeTitle: {
    fontFamily: FONT.ui,
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  adNativeSub: {
    fontFamily: FONT.ui,
    fontSize: 11,
    color: C.ink50,
    marginTop: 2,
  },
  adNativeTag: {
    fontFamily: FONT.ui,
    fontSize: 10,
    color: C.ink50,
    letterSpacing: 1,
  },
});
