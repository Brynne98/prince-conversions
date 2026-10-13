import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, View, Animated, StyleSheet, Modal, Platform, Switch,
  Alert, ActionSheetIOS, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, GROW, RADIUS, EDGE, buzz, useTheme, useStyles, useReduceMotion } from './theme';
import { GLASS, M3, GlassFill, GlassPressable } from './glass';
import { Plus, Minus, Close, ArrowBack, Check } from './icons';
import { t } from './i18n';

// Expo's SwiftUI pieces, for Apple's own sheet. They exist on iOS only, so
// they are loaded only there.
const SwiftUI = Platform.OS === 'ios' ? require('@expo/ui/swift-ui') : null;
const swiftModifiers = Platform.OS === 'ios' ? require('@expo/ui/swift-ui/modifiers') : null;

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
    buzz.choice();
    triggerRef.current?.();
    let delay = 320;
    const tick = () => {
      triggerRef.current?.();
      buzz.choice();
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
    buzz.choice();
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
      <Text style={baseStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={GROW.display}>
        {minutes}
        <Text style={suffixStyle}> {t('common.min')}</Text>
      </Text>
    );
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <Text style={baseStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={GROW.display}>
      {h}
      <Text style={suffixStyle}> {t('common.hr')}</Text>
      {m > 0 ? ` ${m}` : ''}
      {m > 0 ? <Text style={suffixStyle}> {t('common.min')}</Text> : null}
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
      <HoldButton onTrigger={dec} style={styles.stepBtn}>
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
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            maxFontSizeMultiplier={GROW.display}
          >
            {value}
            {suffix ? (
              <Text style={[styles.stepperSuffix, { fontSize: suffixSize }]}>{suffix}</Text>
            ) : null}
          </Text>
        )}
      </View>
      <HoldButton onTrigger={inc} style={styles.stepBtn}>
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
  // 'plain' is Material's icon button, for Android's top app bar.
  const plain = tone === 'plain';
  const s = plain ? 48 : size;
  return (
    <GlassPressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        plain ? styles.roundM3 : tone === 'flat' ? styles.roundFlat : styles.roundBtn,
        { width: s, height: s, borderRadius: s / 2 },
      ]}
    >
      {children}
    </GlassPressable>
  );
}

export function CloseButton({ onPress, size = 44 }) {
  const { C } = useTheme();
  return (
    <RoundButton onPress={onPress} size={size} tone="flat" accessibilityLabel={t('common.close')}>
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
      android_ripple={{ color: C.ink10, foreground: true }}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={styles.textBtn}
    >
      <Text style={[styles.textBtnLabel, disabled && { color: C.ink30 }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Top app bar (Android) ───────────────────────────────────────────
// Material's small top app bar, on every Android screen and page: the title
// leads from the left and actions trail. iOS has its own headers.
export function AppBar({ title, leading, onLeading, children }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.appBar}>
      {leading && (
        <RoundButton onPress={onLeading} tone="plain" accessibilityLabel={t(leading === 'back' ? 'common.back' : 'common.close')}>
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

// ─── Sheet header (iOS) ──────────────────────────────────────────────
// The one header of every iOS sheet: the title in the centre, close on the
// right. `leading` and `trailing` replace the two sides, for a sheet that
// carries its own Cancel and Save.
export function SheetHeader({ title, onClose, leading, trailing }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetHeaderSide}>{leading}</View>
      <Text
        style={styles.sheetHeaderTitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={GROW.bar}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={[styles.sheetHeaderSide, { alignItems: 'flex-end' }]}>
        {trailing ?? <CloseButton onPress={onClose} />}
      </View>
    </View>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────
// iOS 26 opens Apple's own sheet. Older iPhones and the web keep React
// Native's page sheet, with the app's grabber. Android shows a full-screen
// page, edge to edge, so the content is padded clear of the status and
// navigation bars there (AFC-10); a page cannot be dragged away, so it has no
// grabber.
export function Sheet({ visible, onClose, children }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  if (GLASS) return <AppleSheet visible={visible} onClose={onClose}>{children}</AppleSheet>;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheetRoot, M3 && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {!M3 && <View style={styles.sheetHandle} />}
        {children}
      </View>
    </Modal>
  );
}

// Apple's sheet, with the app's content inside it. It is painted in the page
// colour: the sheet's own glass follows the system's light or dark, not the
// app's, and would turn dark mode's text unreadable.
function AppleSheet({ visible, onClose, children }) {
  const { C, mode } = useTheme();
  const { Host, BottomSheet, Group, RNHostView } = SwiftUI;
  const { presentationDetents, presentationDragIndicator, presentationBackground } = swiftModifiers;
  return (
    <Host colorScheme={mode} style={{ position: 'absolute', width: 1, height: 1 }}>
      <BottomSheet
        isPresented={visible}
        // Only a swipe down is news; a close the app asked for is not.
        onIsPresentedChange={(open) => { if (!open && visible) onClose(); }}
      >
        <Group
          modifiers={[
            presentationDetents(['large']),
            presentationDragIndicator('visible'),
            presentationBackground(C.cream),
          ]}
        >
          <RNHostView>
            {/* The grabber floats over the content; this keeps the header clear of it. */}
            <View style={{ flex: 1, paddingTop: 16 }}>{children}</View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

// ─── Alerts and confirmations ────────────────────────────────────────
let present = null;   // set by DialogHost while it is mounted
// Only iOS has system alerts worth using: Android's wear Material 2, and the
// web build has none at all.
const OWN_DIALOGS = Platform.OS !== 'ios';
let scheme = 'light'; // the app's own light or dark, which the system does not know

// An alert. iOS shows Apple's own; elsewhere the app draws Material 3's
// dialog. Same arguments as Alert.alert.
export function alert(title, message, buttons) {
  if (OWN_DIALOGS && present) {
    present({ title, message, buttons: buttons?.length ? buttons : [{ text: t('common.ok') }] });
    return;
  }
  Alert.alert(title, message, buttons, { userInterfaceStyle: scheme });
}

// Confirming something the person chose to do, like a delete: Apple asks
// with an action sheet rising from the control (`anchor`), Material with a
// dialog.
export function confirmDestructive({ title, message, confirmLabel, onConfirm, anchor }) {
  if (OWN_DIALOGS) {
    alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: confirmLabel, onPress: onConfirm },
    ]);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      message,
      options: [t('common.cancel'), confirmLabel],
      cancelButtonIndex: 0,
      destructiveButtonIndex: 1,
      anchor,
      userInterfaceStyle: scheme,
    },
    (index) => { if (index === 1) onConfirm(); },
  );
}

// Mounted once at the root. Draws the app's own dialogs; on iOS it only
// keeps the system alerts in the app's light or dark.
export function DialogHost() {
  const { mode } = useTheme();
  const styles = useStyles(makeStyles);
  // Alerts wait their turn, as the system's do.
  const [queue, setQueue] = useState([]);
  const dialog = queue[0] ?? null;
  // The last dialog stays drawn while it fades out.
  const shown = useRef(null);
  if (dialog) shown.current = dialog;
  useEffect(() => { scheme = mode; }, [mode]);
  useEffect(() => {
    present = (next) => setQueue((q) => [...q, next]);
    return () => { present = null; };
  }, []);
  if (!OWN_DIALOGS) return null;
  const d = shown.current;
  const close = (button) => {
    setQueue((q) => q.slice(1));
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
            {d?.buttons.map((b, i) => (
              <TextButton key={i} label={b.text} onPress={() => close(b)} />
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
                buzz.choice();
              }
            }}
            hitSlop={{ top: 4, bottom: 4 }}
            android_ripple={{ color: C.ink10, foreground: true }}
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
            <Text maxFontSizeMultiplier={GROW.bar} style={{
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
  const still = useReduceMotion();
  useEffect(() => {
    Animated.timing(slide, {
      toValue: idx,
      duration: still ? 0 : 180,
      useNativeDriver: false,
    }).start();
  }, [idx, slide, still]);

  // Where each label sits, so the thumb can match it: labels differ in width
  // ("Air fryer", "Oven"), and a thumb cut to an equal share sits off-centre.
  const [spans, setSpans] = useState([]);
  const measure = (i) => (e) => {
    const { x, width } = e.nativeEvent.layout;
    setSpans((prev) => {
      if (prev[i]?.x === x && prev[i]?.width === width) return prev;
      const next = [...prev];
      next[i] = { x, width };
      return next;
    });
  };

  const padH = compact ? 14 : 18;
  const fontSize = compact ? 14 : 15;

  const trackBg = onTerracotta ? 'rgba(255,247,238,0.18)' : C.ink06;
  const pillBg = onTerracotta ? '#FFF7EE' : C.paper;
  const inactiveColor = onTerracotta ? 'rgba(255,247,238,0.75)' : C.ink50;
  const activeColor = onTerracotta ? C.terracotta : C.ink;

  return (
    <View style={[styles.segWrap, { backgroundColor: trackBg }]}>
      <SegmentedTrack spans={spans.slice(0, options.length)} count={options.length} slide={slide} pillBg={pillBg} scheme={onTerracotta ? 'light' : undefined} />
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) {
                onChange(o.value);
                buzz.choice();
              }
            }}
            onLayout={measure(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            // With the track's 3pt edge above and below, a 44pt target.
            hitSlop={{ top: 3, bottom: 3 }}
            style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: padH, zIndex: 1, flexShrink: 1 }}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={GROW.bar} style={{
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
function SegmentedTrack({ spans, count, slide, pillBg, scheme }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const inputRange = Array.from({ length: count }, (_, i) => i);
  const ready = inputRange.every((i) => spans[i]);
  const left = ready && slide.interpolate({ inputRange, outputRange: spans.map((s) => s.x) });
  const width = ready && slide.interpolate({ inputRange, outputRange: spans.map((s) => s.width) });
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      style={StyleSheet.absoluteFill}
    >
      {ready && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left,
            width,
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
    borderWidth: EDGE,
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
    borderWidth: EDGE,
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  // Both sides are at least a close button wide, so a title with one button
  // beside it still sits in the centre.
  sheetHeaderSide: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  // Shrinks before it touches the buttons: Cancel and Save are wider in French.
  sheetHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
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
    maxWidth: '100%',
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
    borderRadius: RADIUS.lg,
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
