import React, { useEffect, useRef } from 'react';
import { Appearance, StyleSheet, Animated, Easing, Image } from 'react-native';
import { PALETTES, useTheme } from '../theme';

// imageWidth in app.json: the system splash draws its picture this wide.
const SIZE = 144;

// The system splash follows the phone's light or dark setting. Read it here,
// before the app tells the system its own choice.
const launchedDark = Appearance.getColorScheme() === 'dark';

const MARK = {
  light: {
    top: require('../../assets/splash-icon.png'),
    full: require('../../assets/splash-mark.png'),
  },
  dark: {
    top: require('../../assets/splash-icon-dark.png'),
    full: require('../../assets/splash-mark-dark.png'),
  },
};

// Takes over from the system splash, which shows "425°" alone on the page
// colour. Starts as the same picture in the same place, writes the line and
// "400°" in under it, then fades out so the AdMob/ATT init only fires once
// the splash is fully gone.
export default function AnimatedSplash({ onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  const write = useRef(new Animated.Value(0)).current;
  // The app's own light or dark is a saved choice and can differ from the
  // phone's. Start in the phone's, as the system splash did, and ease to the
  // app's, so the app never opens on a flash of the other colour.
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
  useEffect(() => {
    Animated.sequence([
      // No wait first: the system splash has already held "425°" alone for
      // as long as the app took to load.
      Animated.timing(write, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(320),
      Animated.timing(fade, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) done.current?.();
    });
  }, [fade, write]);

  const mark = (images, opacity) => (
    <Animated.View style={[styles.mark, { opacity }]}>
      <Image source={images.top} style={styles.image} />
      <Animated.Image source={images.full} style={[styles.image, { opacity: write }]} />
    </Animated.View>
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, { opacity: fade }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      {mark(MARK.light, lightOpacity)}
      {mark(MARK.dark, dark)}
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
  image: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
