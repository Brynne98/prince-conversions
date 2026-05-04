import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { C } from '../theme';

const TILE = 140;

// Bridges the native expo-splash-screen image (at imageWidth=140 on a
// cream background) to the app proper. Renders the same icon at the
// same size as the native splash, holds for a beat, then fades out so
// the AdMob/ATT init only fires once the splash is fully gone.
export default function AnimatedSplash({ onDone }) {
  const fade = useRef(new Animated.Value(1)).current;

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
