import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

/** Soft pulsing placeholder block. Static when reduce motion is on. */
export function Skeleton({
  width = '100%',
  height = 14,
  radius,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (theme.reduceMotion) {
      pulse.value = 0.8;
      return;
    }
    pulse.value = withRepeat(withTiming(0.45, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, theme.reduceMotion]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius ?? theme.radius.control, backgroundColor: theme.colors.surfaceSunken },
        animated,
        style,
      ]}
    />
  );
}
