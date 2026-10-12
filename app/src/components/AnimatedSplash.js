import React, { useEffect, useRef, useState } from 'react';
import { Appearance, StyleSheet, Animated, Easing } from 'react-native';
import { PALETTES, useTheme } from '../theme';

// imageWidth in app.json: the system splash draws its picture this wide.
const SIZE = 144;

// The system splash follows the phone's light or dark setting. Read it here,
// before the app tells the system its own choice.
const launchedDark = Appearance.getColorScheme() === 'dark';

const MARK = {
  light: require('../../assets/splash-icon.png'),
  dark: require('../../assets/splash-icon-dark.png'),
};

// Takes over from the system splash with the same picture in the same place
// on the same colour, then fades out so the AdMob/ATT init only fires once
// the splash is fully gone. It needs none of the app's fonts, so it starts
// before they load and only waits for them (`ready`) before fading out.
export default function AnimatedSplash({ ready, onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  // The app's light or dark follows the phone until the owner picks one, and
  // a saved pick can differ from the phone's. Start in the phone's, as the
  // system splash did, and ease to the app's, so the app never opens on a
  // flash of the other colour.
  const { C: theme } = useTheme();
  const dark = useRef(new Animated.Value(launchedDark ? 1 : 0)).current;
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
  const lightOpacity = dark.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // Run once: a parent re-render hands in a new onDone and must not restart it.
  const done = useRef(onDone);
  done.current = onDone;
  // A beat first, so a change of colour above has eased before the fade.
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHeld(true), 160);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!held || !ready) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) done.current?.();
    });
  }, [held, ready, fade]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, { opacity: fade }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <Animated.Image source={MARK.light} style={[styles.mark, { opacity: lightOpacity }]} />
      <Animated.Image source={MARK.dark} style={[styles.mark, { opacity: dark }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  mark: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
