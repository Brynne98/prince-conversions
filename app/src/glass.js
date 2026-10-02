import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from './theme';

/**
 * iOS 26 and later: Apple's Liquid Glass behind controls. Older iPhones and
 * Android have no glass to show, so every component that branches on this
 * keeps its flat fallback there. Copied from Health Switch.
 */
// The major version only: point releases read "26.0.1", which Number() makes NaN.
export const GLASS = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

/**
 * A glass layer filling its parent, drawn behind the parent's content. The
 * parent sets the shape (borderRadius) and clips it (overflow: 'hidden').
 * Told the app's own scheme, since the in-app dark mode is not the system's.
 * Renders nothing below iOS 26.
 *
 * `clear` is the see-through glass Apple uses over colour (the result card);
 * `tint` colours the glass, for a filled button or a card.
 */
export function GlassFill({ tint, clear = false, scheme }) {
  const { mode } = useTheme();
  if (!GLASS) return null;
  return (
    <GlassView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      glassEffectStyle={clear ? 'clear' : 'regular'}
      colorScheme={scheme ?? mode}
      tintColor={tint}
    />
  );
}
