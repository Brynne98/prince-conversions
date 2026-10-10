import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, View, Animated, StyleSheet, Modal, Platform, Switch,
  Alert, ActionSheetIOS, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, useTheme, useStyles } from './theme';
import { GLASS, M3, GlassFill, GlassPressable } from './glass';
import { Plus, Minus, Close, ArrowBack, Check } from './icons';

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

// ─── Toggle ──────────────────────────────────────────────────────────
// iOS uses the platform switch, which iOS 26 draws in glass. Only the on
// colour is the app's.
export function Toggle({ value, onValueChange, onColor }) {
  const { C } = useTheme();
  const change = (v) => {
    onValueChange?.(v);
    Haptics.selectionAsync();
  };
  if (M3) return <M3Switch value={!!value} onChange={change} />;
  return (
    <Switch
      value={value}
      onValueChange={change}
      trackColor={{ false: C.ink10, true: onColor || C.terracotta }}
      ios_backgroundColor={C.ink10}
    />
  );
}

// Material 3's switch. React Native's own still draws the Material 2 one on
// Android: a thin track and a shadowed thumb.
function M3Switch({ value, onChange }) {
  const { C } = useTheme();
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(pos, { toValue: value ? 1 : 0, duration: 150, useNativeDriver: false }).start();
  }, [value, pos]);
  // Inside the 2dp outline: a 16dp thumb at rest, 24dp once on.
  const size = pos.interpolate({ inputRange: [0, 1], outputRange: [16, 24] });
  const left = pos.interpolate({ inputRange: [0, 1], outputRange: [6, 22] });
  const top = pos.interpolate({ inputRange: [0, 1], outputRange: [6, 2] });
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: value ? C.terracotta : C.ink50,
        backgroundColor: value ? C.terracotta : C.surfaceHigh,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left,
          top,
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: value ? C.onTerracotta : C.ink50,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value && <Check s={14} c={C.terracotta} />}
      </Animated.View>
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
  // Android: Material's medium tonal icon button.
  const iconSize = M3 ? 24 : 20;
  const iconColor = M3 ? C.terracottaDeep : C.ink;

  return (
    <View style={styles.stepperRow}>
      <HoldButton onTrigger={dec} style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Minus s={iconSize} c={iconColor} />
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
        <Plus s={iconSize} c={iconColor} />
      </HoldButton>
    </View>
  );
}

// A circle button. `raised` sits on the page (paper, hairline, shadow);
// `flat` sits inside a sheet (a faint ink wash). Glass on iOS 26. On Android
// it is Material's standard icon button: no container, a 48dp target.
export function RoundButton({ onPress, children, size = 44, tone = 'raised', accessibilityLabel }) {
  const styles = useStyles(makeStyles);
  const s = M3 ? 48 : size;
  return (
    <GlassPressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        M3 ? styles.roundM3 : tone === 'flat' ? styles.roundFlat : styles.roundBtn,
        { width: s, height: s, borderRadius: s / 2, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </GlassPressable>
  );
}

export function CloseButton({ onPress, size = 44 }) {
  const { C } = useTheme();
  return (
    <RoundButton onPress={onPress} size={size} tone="flat" accessibilityLabel="Close">
      <Close s={18} c={C.ink70} />
    </RoundButton>
  );
}

// A button that is only its label: Material's text button.
export function TextButton({ label, onPress, disabled = false }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      android_ripple={{ color: C.ink10 }}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={styles.textBtn}
    >
      <Text style={[styles.textBtnLabel, disabled && { color: C.ink30 }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Top app bar (Android) ───────────────────────────────────────────
// Material's small top app bar: the title leads from the left and actions
// trail. iOS screens keep their own headers.
export function AppBar({ title, leading, onLeading, children }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.appBar}>
      {leading && (
        <RoundButton onPress={onLeading} accessibilityLabel={leading === 'back' ? 'Back' : 'Close'}>
          {leading === 'back' ? <ArrowBack /> : <Close s={24} />}
        </RoundButton>
      )}
      <Text
        style={[styles.appBarTitle, !leading && { marginLeft: 12 }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────
// Apple's page sheet, which iOS 26 draws in its own glass style. Android
// shows it as a full-screen page, edge to edge, so the content is padded
// clear of the status and navigation bars there (AFC-10). `bottom` makes it
// Material's bottom sheet on Android instead, for a short list and one
// action. The grabber is drawn on iOS only: an Android page cannot be
// dragged away.
export function Sheet({ visible, onClose, handle = true, bottom = false, children }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  if (android && bottom) {
    return (
      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomHandle} />
            {children}
          </View>
        </View>
      </Modal>
    );
  }
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheetRoot, android && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {handle && !android && <View style={styles.sheetHandle} />}
        {children}
      </View>
    </Modal>
  );
}

// ─── Alerts and confirmations ────────────────────────────────────────
let present = null;   // set by DialogHost while it is mounted
let scheme = 'light'; // the app's own light or dark, which the system does not know

// An alert. iOS shows Apple's own. Android's system alert still wears
// Material 2, so the app draws Material 3's dialog there. Same arguments as
// Alert.alert.
export function alert(title, message, buttons) {
  if (M3 && present) {
    present({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
    return;
  }
  Alert.alert(title, message, buttons, { userInterfaceStyle: scheme });
}

// Confirming something the person chose to do, like a delete: Apple asks
// with an action sheet rising from the control (`anchor`), Material with a
// dialog.
export function confirmDestructive({ title, message, confirmLabel, onConfirm, anchor }) {
  if (M3) {
    alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, onPress: onConfirm },
    ]);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      message,
      options: ['Cancel', confirmLabel],
      cancelButtonIndex: 0,
      destructiveButtonIndex: 1,
      anchor,
      userInterfaceStyle: scheme,
    },
    (index) => { if (index === 1) onConfirm(); },
  );
}

// Mounted once at the root. Draws Android's dialogs; on iOS it only keeps
// the system alerts in the app's light or dark.
export function DialogHost() {
  const { mode } = useTheme();
  const styles = useStyles(makeStyles);
  const [dialog, setDialog] = useState(null);
  // The last dialog stays drawn while it fades out.
  const shown = useRef(null);
  if (dialog) shown.current = dialog;
  useEffect(() => { scheme = mode; }, [mode]);
  useEffect(() => {
    present = setDialog;
    return () => { present = null; };
  }, []);
  if (!M3) return null;
  const d = shown.current;
  const close = (button) => {
    setDialog(null);
    button?.onPress?.();
  };
  return (
    <Modal
      visible={!!dialog}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={() => close(d?.buttons.find((b) => b.style === 'cancel'))}
    >
      <View style={[styles.scrim, styles.dialogScrim]}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.dialogTitle} accessibilityRole="header">{d?.title}</Text>
          {!!d?.message && <Text style={styles.dialogBody}>{d.message}</Text>}
          <View style={styles.dialogActions}>
            {d?.buttons.map((b) => (
              <TextButton key={b.text} label={b.text} onPress={() => close(b)} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Text field (Android) ────────────────────────────────────────────
// Material's outlined text field: the label rides up into the outline once
// the field is in use.
export function Field({ label, value, style, ...input }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  const up = focused || !!value;
  return (
    <View style={[styles.field, focused && styles.fieldFocused, style]}>
      {up && <Text style={[styles.fieldLabel, focused && { color: C.terracotta }]}>{label}</Text>}
      <TextInput
        value={value}
        placeholder={up ? undefined : label}
        placeholderTextColor={C.ink70}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.fieldInput}
        {...input}
      />
    </View>
  );
}

// ─── Segmented control ───────────────────────────────────────────────
export function Segmented(props) {
  return M3 ? <ConnectedGroup {...props} /> : <SlidingSegmented {...props} />;
}

// Android: Material's connected button group, which replaced segmented
// buttons. The chosen button rounds off fully; the rest keep a squarer
// inner edge.
function ConnectedGroup({ options, value, onChange, compact = false, tone = 'default' }) {
  const { C } = useTheme();
  const onTerracotta = tone === 'onTerracotta';
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', gap: 2 }}>
      {options.map((o, i) => {
        const active = o.value === value;
        const lead = active || i === 0 ? 20 : 8;
        const trail = active || i === options.length - 1 ? 20 : 8;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) {
                onChange(o.value);
                Haptics.selectionAsync();
              }
            }}
            hitSlop={{ top: 4, bottom: 4 }}
            android_ripple={{ color: C.ink10 }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              height: 40,
              paddingHorizontal: compact ? 14 : 16,
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: active
                ? (onTerracotta ? C.onTerracotta : C.terracotta)
                : (onTerracotta ? C.onTerracotta18 : C.surfaceHigh),
              borderTopLeftRadius: lead,
              borderBottomLeftRadius: lead,
              borderTopRightRadius: trail,
              borderBottomRightRadius: trail,
            }}
          >
            <Text style={{
              fontFamily: FONT.ui,
              fontSize: 14,
              fontWeight: '500',
              color: active
                ? (onTerracotta ? C.terracotta : C.onTerracotta)
                : (onTerracotta ? C.onTerracotta : C.ink70),
            }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SlidingSegmented({ options, value, onChange, compact = false, tone = 'default' }) {
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

  // Tall enough to hit: about 38pt compact, 44pt full.
  const padV = compact ? 8 : 10;
  const padH = compact ? 14 : 18;
  const fontSize = compact ? 14 : 15;

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
    gap: M3 ? 8 : 16,
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
  stepBtn: M3 ? {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  } : {
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
  roundM3: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtnLabel: {
    fontFamily: FONT.ui,
    fontSize: 14,
    fontWeight: '500',
    color: C.terracotta,
  },
  appBar: {
    height: 64,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarTitle: {
    flex: 1,
    marginLeft: 4,
    fontFamily: FONT.ui,
    fontSize: 22,
    lineHeight: 28,
    color: C.ink,
  },
  sheetRoot: { flex: 1, backgroundColor: C.cream },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 4,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    maxHeight: '90%',
    backgroundColor: C.surfaceLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bottomHandle: {
    width: 32, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 16, marginBottom: 14,
  },
  dialogScrim: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 312,
    backgroundColor: C.surfaceHigh,
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dialogTitle: {
    fontFamily: FONT.ui,
    fontSize: 24,
    lineHeight: 32,
    color: C.ink,
  },
  dialogBody: {
    fontFamily: FONT.ui,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink70,
    marginTop: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    marginRight: -12,
  },
  field: {
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.ink30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  // One pixel less padding, so the thicker outline does not nudge the text.
  fieldFocused: {
    borderWidth: 2,
    borderColor: C.terracotta,
    paddingHorizontal: 15,
  },
  fieldLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    paddingHorizontal: 4,
    backgroundColor: C.cream,
    fontFamily: FONT.ui,
    fontSize: 12,
    color: C.ink70,
  },
  fieldInput: {
    fontFamily: FONT.ui,
    fontSize: 16,
    color: C.ink,
    padding: 0,
  },
  segWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: C.ink06,
    borderRadius: 999,
    padding: 3,
  },
  // Android: a tonal Material card, lifted by colour, not shadow.
  card: M3 ? {
    backgroundColor: C.surfaceLow,
    borderRadius: 28,
    padding: 16,
  } : {
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
