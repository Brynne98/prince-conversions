import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { C, PALETTES, useTheme } from '../theme';

const TILE = 140;

// Bridges the native expo-splash-screen image (at imageWidth=140 on a
// cream background) to the app proper. Renders the same icon at the
// same size as the native splash, holds for a beat, then fades out so
// the AdMob/ATT init only fires once the splash is fully gone.
export default function AnimatedSplash({ onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  // The native splash is always cream: it shows before the saved light or
  // dark choice can be read. Once that loads, ease to the app's own page
  // colour, so dark mode does not open on a cream flash.
  const { C: theme } = useTheme();
  const dark = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(dark, {
      toValue: theme.isDark ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [theme.isDark, dark]);
  const backgroundColor = dark.interpolate({
    inputRange: [0, 1],
    outputRange: [PALETTES.light.cream, PALETTES.dark.cream],
  });

  useEffect(() => {
    Animated.sequence([
      Animated.delay(420),
      Animated.timing(fade, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }, [fade, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, { opacity: fade }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  icon: {
    width: TILE,
    height: TILE,
  },
});
