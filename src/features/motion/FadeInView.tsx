import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/features/motion/useReduceMotion';

type FadeInViewProps = PropsWithChildren<{
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  translateYOffset?: number;
}>;

export function FadeInView({
  children,
  delay = 0,
  duration = 220,
  style,
  translateYOffset = 8,
}: FadeInViewProps) {
  const reduceMotion = useReduceMotion();
  const opacityAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(reduceMotion ? 0 : translateYOffset)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacityAnim.setValue(1);
      translateYAnim.setValue(0);
      return;
    }

    opacityAnim.setValue(0);
    translateYAnim.setValue(translateYOffset);

    const anim = Animated.parallel([
      Animated.timing(opacityAnim, {
        delay,
        duration,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        delay,
        duration,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    anim.start();

    return () => {
      anim.stop();
    };
  }, [delay, duration, opacityAnim, reduceMotion, translateYAnim, translateYOffset]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
