import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from './theme';

/**
 * iOS 26 and later: Apple's Liquid Glass behind controls. Older iPhones and
 * Android have no glass to show, so every component that branches on this
 * keeps its flat fallback there. Copied from Health Switch.
 */
// The major version only: point releases read "26.0.1", which Number() makes NaN.
export const GLASS = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

// Android wears Material 3, drawn by the app as Health Switch does it. The
// third look, iOS before 26, is whatever is neither.
export const M3 = Platform.OS === 'android';

// Material sets labels in sentence case; the iOS looks keep the spaced capitals.
export const cap = (s) => (M3 ? s : s.toUpperCase());

// Paint the glass replaces: Apple's glass draws its own fill, edge and
// shadow, and a press is answered by the glass itself, not a fade.
const PAINT = new Set([
  'backgroundColor', 'borderWidth', 'borderColor', 'overflow', 'opacity', 'transform',
  'shadowColor', 'shadowOpacity', 'shadowRadius', 'shadowOffset', 'elevation',
]);
// Where the control sits among its siblings: kept on the Pressable.
const PLACE = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'position', 'zIndex',
  'top', 'right', 'bottom', 'left',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'marginHorizontal', 'marginVertical',
]);

function split(style) {
  const place = {};
  const surface = {};
  Object.entries(StyleSheet.flatten(style) || {}).forEach(([k, v]) => {
    if (PLACE.has(k)) place[k] = v;
    else if (!PAINT.has(k)) surface[k] = v;
  });
  return { place, surface };
}

function glassProps({ tint, clear, scheme }, mode) {
  return {
    glassEffectStyle: clear ? 'clear' : 'regular',
    colorScheme: scheme ?? mode,
    tintColor: tint,
  };
}

/**
 * A glass layer filling its parent, behind the parent's content, for shapes
 * that move or hold more than a button (the segmented thumb, a timer card).
 * `radius` must match the parent's corners: the glass draws its own rounded
 * edge, and a parent clipping a squarer glass cuts that edge off.
 * Told the app's own scheme, since the in-app dark mode is not the system's.
 * Renders nothing below iOS 26.
 *
 * `clear` is the see-through glass Apple uses over colour (the result card);
 * `tint` colours the glass, for a filled button or a card.
 */
export function GlassFill({ tint, clear = false, scheme, radius = 0 }) {
  const { mode } = useTheme();
  if (!GLASS) return null;
  return (
    <GlassView
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      {...glassProps({ tint, clear, scheme }, mode)}
    />
  );
}

/**
 * A surface that is glass on iOS 26 and a plain View in `style` elsewhere.
 * The glass takes the style's shape and layout and drops its paint.
 */
export function GlassSurface({ style, tint, clear, scheme, children }) {
  const { mode } = useTheme();
  if (!GLASS) return <View style={style}>{children}</View>;
  const { place, surface } = split(style);
  return (
    <GlassView style={[place, surface]} {...glassProps({ tint, clear, scheme }, mode)}>
      {children}
    </GlassView>
  );
}

/**
 * A Pressable whose face is interactive glass on iOS 26: the glass carries
 * the button's shape and content and answers the finger itself, with
 * Apple's shimmer and stretch. Android gets a ripple; older iPhones a plain
 * Pressable in `style`.
 * `style` may be a function of { pressed }, as on Pressable.
 */
export function GlassPressable({ style, tint, clear, scheme, children, ...rest }) {
  const { mode, C } = useTheme();
  if (M3) {
    // Material answers a press with a ripple clipped to the button, not a fade.
    // Drawn in front: behind the button, Android ignores its rounded corners
    // and the ripple shows as a square patch.
    return (
      <Pressable
        android_ripple={{ color: C.ink10, foreground: true }}
        {...rest}
        style={[typeof style === 'function' ? style({ pressed: false }) : style, { overflow: 'hidden' }]}
      >
        {children}
      </Pressable>
    );
  }
  if (!GLASS) return <Pressable style={style} {...rest}>{children}</Pressable>;
  const resolve = (state) => split(typeof style === 'function' ? style(state) : style);
  return (
    <Pressable {...rest} style={(state) => resolve(state).place}>
      {(state) => (
        <GlassView isInteractive style={resolve(state).surface} {...glassProps({ tint, clear, scheme }, mode)}>
          {typeof children === 'function' ? children(state) : children}
        </GlassView>
      )}
    </Pressable>
  );
}
