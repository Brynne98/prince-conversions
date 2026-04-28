import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const TILE = 140;
const REST_Y = 28;        // translateY of the ° at rest (center y ≈ 44)

// The tile + "F" are static, matching the native splash. Only the ° ring
// animates — it lifts slightly, drops onto the F with a squashy bounce,
// settles, then the whole splash fades out.
export default function AnimatedSplash({ onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(REST_Y)).current;
  const squash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      // Anticipation: lift ° up off its rest spot.
      Animated.timing(bounceY, {
        toValue: 6,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Drop onto F with gravity.
      Animated.timing(bounceY, {
        toValue: 38,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Squish on contact, then bounce back up.
      Animated.parallel([
        Animated.sequence([
          Animated.timing(squash, {
            toValue: 0.78,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(squash, {
            toValue: 1.04,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(squash, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: 18,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceY, {
            toValue: REST_Y,
            duration: 140,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.delay(180),
      Animated.timing(fade, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }, [bounceY, squash, fade, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, { opacity: fade }]}
    >
      <View style={styles.tile}>
        <LinearGradient
          colors={['#D86A3E', C.terracotta, C.terracottaDeep]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* F — three cream rectangles */}
        <View style={[styles.fPart, { left: 50, top: 68, width: 42, height: 8  }]} />
        <View style={[styles.fPart, { left: 50, top: 68, width: 8,  height: 52 }]} />
        <View style={[styles.fPart, { left: 50, top: 89, width: 30, height: 7  }]} />

        {/* ° — animated ring */}
        <Animated.View
          style={[
            styles.degree,
            {
              transform: [
                { translateY: bounceY },
                { scaleY: squash },
              ],
            },
          ]}
        />
      </View>
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
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: TILE * 0.226, // iOS app-icon squircle
    overflow: 'hidden',
  },
  fPart: {
    position: 'absolute',
    backgroundColor: '#FFF7EE',
    borderRadius: 1.5,
  },
  degree: {
    position: 'absolute',
    left: 70 - 16,  // center horizontally on the tile (cx = 70)
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 8,
    borderColor: '#FFF7EE',
    backgroundColor: 'transparent',
  },
});
