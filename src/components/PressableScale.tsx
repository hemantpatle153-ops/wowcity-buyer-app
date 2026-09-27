import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far to shrink on press (0.96 default). */
  scaleTo?: number;
  haptic?: 'tap' | 'select' | 'none';
};

/** Pressable with a spring "press in" scale and optional light haptic; respects reduce motion. */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { scaleTo = 0.96, haptic = 'none', onPressIn, onPressOut, onPress, style, children, ...rest },
  ref,
) {
  const { reduceMotion } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        if (reduceMotion) opacity.value = 0.7;
        else scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        opacity.value = 1;
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic !== 'none') haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
});
