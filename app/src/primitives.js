import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, View, Animated, StyleSheet, Modal, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, useTheme, useStyles } from './theme';
import { GLASS, GlassFill, GlassPressable } from './glass';
import { Plus, Minus, Close } from './icons';

// ─── Hold-to-repeat button ────────────────────────────────────────────
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
    <GlassPressable
      onPressIn={start}
      onPressOut={stop}
      hitSlop={10}
      style={style}
    >
      {children}
    </GlassPressable>
  );
}

// ─── Custom toggle ───────────────────────────────────────────────────
export function Toggle({ value, onValueChange, onColor }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
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
            { backgroundColor: onColor || C.terracotta, borderRadius: 14, opacity: anim },
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

// Renders mixed-size time text.
function TimeRich({ minutes, baseStyle, suffixStyle }) {
  if (minutes < 60) {
    return (
      <Text style={baseStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {minutes}
        <Text style={suffixStyle}> min</Text>
      </Text>
    );
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <Text style={baseStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
      {h}
      <Text style={suffixStyle}>hr</Text>
      {m > 0 ? ` ${m}` : ''}
      {m > 0 ? <Text style={suffixStyle}>min</Text> : null}
    </Text>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────
export function Stepper({ value, onChange, step, min = 0, max = 999, suffix, formatTime = false, big = false }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);

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
        {formatTime ? (
          <TimeRich
            minutes={value}
            baseStyle={[styles.stepperValue, { fontSize: valueSize, lineHeight: valueSize }]}
            suffixStyle={[styles.stepperSuffix, { fontSize: suffixSize }]}
          />
        ) : (
          <Text
            style={[styles.stepperValue, { fontSize: valueSize, lineHeight: valueSize }]}
            numberOfLines={1}
          >
            {value}
            {suffix ? (
              <Text style={[styles.stepperSuffix, { fontSize: suffixSize }]}>{suffix}</Text>
            ) : null}
          </Text>
        )}
      </View>
      <HoldButton onTrigger={inc} style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Plus s={20} c={C.ink} />
      </HoldButton>
    </View>
  );
}

// A circle button. `raised` sits on the page (paper, hairline, shadow);
// `flat` sits inside a sheet (a faint ink wash). Glass on iOS 26.
export function RoundButton({ onPress, children, size = 44, tone = 'raised', accessibilityLabel }) {
  const styles = useStyles(makeStyles);
  return (
    <GlassPressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        tone === 'flat' ? styles.roundFlat : styles.roundBtn,
        { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </GlassPressable>
  );
}

export function CloseButton({ onPress, size = 30 }) {
  const { C } = useTheme();
  return (
    <RoundButton onPress={onPress} size={size} tone="flat" accessibilityLabel="Close">
      <Close s={16} c={C.ink70} />
    </RoundButton>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────
// Apple's page sheet, which iOS 26 draws in its own glass style. Android
// shows it full screen, edge to edge, so the content is padded clear of the
// status and navigation bars there (AFC-10). The grabber is drawn on iOS
// only: an Android sheet cannot be dragged away.
export function Sheet({ visible, onClose, handle = true, children }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheetRoot, android && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {handle && !android && <View style={styles.sheetHandle} />}
        {children}
      </View>
    </Modal>
  );
}

// ─── Segmented control ───────────────────────────────────────────────
export function Segmented({ options, value, onChange, compact = false, tone = 'default' }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const onTerracotta = tone === 'onTerracotta';
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

  const trackBg = onTerracotta ? 'rgba(255,247,238,0.18)' : C.ink06;
  const pillBg = onTerracotta ? '#FFF7EE' : C.paper;
  const inactiveColor = onTerracotta ? 'rgba(255,247,238,0.75)' : C.ink50;
  const activeColor = onTerracotta ? C.terracotta : C.ink;

  return (
    <View style={[styles.segWrap, { backgroundColor: trackBg }]}>
      <SegmentedTrack count={options.length} slide={slide} pillBg={pillBg} scheme={onTerracotta ? 'light' : undefined} />
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
              color: active ? activeColor : inactiveColor,
              letterSpacing: -0.1,
            }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// On iOS 26 the thumb is a glass pill tinted with the thumb's colour.
function SegmentedTrack({ count, slide, pillBg, scheme }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width } = size;
  const segW = width > 0 ? (width - 6) / count : 0;
  const left = slide.interpolate({
    inputRange: Array.from({ length: count }, (_, i) => i),
    outputRange: Array.from({ length: count }, (_, i) => 3 + i * segW),
  });
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
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
            borderRadius: 999,
            ...(GLASS ? null : {
              backgroundColor: pillBg,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }),
          }}
        >
          <GlassFill tint={pillBg} scheme={scheme} radius={(size.height - 6) / 2} />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Ad slot ─────────────────────────────────────────────────────────
export function AdSlot({ height = 64, label = 'Ad · 320×50 banner', native = false, style }) {
  const styles = useStyles(makeStyles);
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
  const styles = useStyles(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (C) => ({
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
    shadowOpacity: C.isDark ? 0.4 : 0.08,
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
  roundBtn: {
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: C.isDark ? 0.4 : 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  roundFlat: {
    backgroundColor: C.ink06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRoot: { flex: 1, backgroundColor: C.cream },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 4,
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
    shadowOpacity: C.isDark ? 0.4 : 0.06,
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
