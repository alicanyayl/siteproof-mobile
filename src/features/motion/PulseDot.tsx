import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/features/motion/useReduceMotion';

type PulseDotProps = {
  color: string;
  size?: number;
};

export function PulseDot({ color, size = 10 }: PulseDotProps) {
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            duration: 750,
            toValue: 1.35,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            duration: 750,
            toValue: 0.45,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            duration: 750,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            duration: 750,
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [opacityAnim, reduceMotion, scaleAnim]);

  return (
    <View style={[styles.container, { height: size, width: size }]}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            borderRadius: size / 2,
            height: size,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            width: size,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
