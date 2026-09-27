import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnline } from '@/hooks/useOnline';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { Text } from './Text';

/** Calm, non-blocking notice shown while the phone is offline. */
export function OfflineBanner() {
  const online = useOnline();
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp}
      exiting={reduceMotion ? undefined : FadeOutUp}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.wrap, { top: insets.top + 6 }]}
    >
      <View style={[styles.pill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <Icon name="cloud-offline-outline" size={18} color="textMuted" />
        <Text variant="bodyStrong">You’re offline. Showing what we saved earlier.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
