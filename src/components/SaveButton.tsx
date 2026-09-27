import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useSaveToggle } from '@/hooks/useSaveToggle';
import { useAuth } from '@/state/auth';
import { useIsSaved } from '@/state/saved';
import { useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Big Save (heart) button for product detail. */
export function SaveButton({ storeId, productId, name }: { storeId: string; productId: string; name?: string }) {
  const { colors, radius, reduceMotion } = useTheme();
  const saved = useIsSaved(storeId, productId);
  const signedIn = useAuth((s) => s.status === 'signedIn');
  const toggle = useSaveToggle();
  const scale = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    scale.value = saved
      ? withSequence(withSpring(1.35, { damping: 5, stiffness: 420 }), withSpring(1, { damping: 10 }))
      : withSequence(withTiming(0.85, { duration: 80 }), withSpring(1));
  }, [saved, reduceMotion, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <PressableScale
      onPress={() => toggle({ storeId, productId }, !saved)}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Saved. Remove ${name ?? 'item'} from saved` : `Save ${name ?? 'item'}`}
      accessibilityHint={signedIn ? undefined : 'You will be asked to sign in first'}
      accessibilityState={{ selected: saved }}
      testID="save-button"
      style={[
        styles.btn,
        {
          borderRadius: radius.control + 4,
          backgroundColor: saved ? colors.surface : colors.text,
          borderColor: saved ? colors.heart : colors.text,
        },
      ]}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={saved ? colors.heart : colors.bg} />
      </Animated.View>
      <View>
        <Text variant="label" style={{ color: saved ? colors.text : colors.bg }}>
          {saved ? 'Saved' : 'Save'}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5 },
});
