import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useSaveToggle } from '@/hooks/useSaveToggle';
import { useIsSaved } from '@/state/saved';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

/** Save (heart) toggle with a spring pop, a soft ring burst and a success haptic. */
export function HeartButton({
  storeId,
  productId,
  name,
  variant = 'photo',
  size = 40,
}: {
  storeId: string;
  productId: string;
  name?: string;
  variant?: 'photo' | 'surface';
  size?: number;
}) {
  const { colors, reduceMotion } = useTheme();
  const saved = useIsSaved(storeId, productId);
  const toggle = useSaveToggle();
  const scale = useSharedValue(1);
  const ring = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    if (saved) {
      scale.value = withSequence(withSpring(1.3, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 }));
      ring.value = 0;
      ring.value = withTiming(1, { duration: 420 });
    } else {
      scale.value = withSequence(withTiming(0.85, { duration: 80 }), withSpring(1));
    }
  }, [saved, reduceMotion, scale, ring]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value === 0 ? 0 : 1 - ring.value,
    transform: [{ scale: 0.6 + ring.value * 0.9 }],
  }));

  const onPhoto = variant === 'photo';
  const fill = onPhoto ? colors.heartOnPhoto : colors.heart;
  const outline = onPhoto ? colors.onPhoto : colors.text;
  const label = saved ? `Remove ${name ?? 'item'} from saved` : `Save ${name ?? 'item'}`;

  return (
    <PressableScale
      onPress={() => toggle({ storeId, productId }, !saved)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: saved }}
      hitSlop={(minTouch - size) / 2}
      scaleTo={0.88}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: onPhoto ? colors.photoChip : colors.surface,
          borderWidth: onPhoto ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: fill, borderRadius: size }, ringStyle]} />
      <Animated.View style={iconStyle}>
        <View>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={Math.round(size * 0.55)} color={saved ? fill : outline} />
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  ring: { ...StyleSheet.absoluteFill, borderWidth: 2 },
});
