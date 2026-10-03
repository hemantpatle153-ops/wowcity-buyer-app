import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { LocationPicker } from '@/components/LocationPicker';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useAuth } from '@/state/auth';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/contrast';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { colors, reduceMotion } = useTheme();
  const hasLocation = useSettings((s) => !!s.location);
  const complete = useSettings((s) => s.completeOnboarding);
  const signedIn = useAuth((s) => s.status === 'signedIn');

  const start = () => {
    complete();
    router.replace('/home');
  };

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[withAlpha(colors.accent, 0.16), withAlpha(colors.accent, 0)]}
        style={[styles.glow, { height: 320 + insets.top }]}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.springify().damping(18)} style={styles.hero}>
          <BrandMark size={72} />
          <Text variant="display" accessibilityRole="header">
            WowCity
          </Text>
          <Text variant="subtitle" tone="muted" weight="500">
            See what’s in stock at shops near you. Save it, then walk in and try it on.
          </Text>
          <View style={styles.points}>
            {[
              ['storefront-outline', 'Real local shops, real stock'],
              ['heart-outline', 'Save favourites for later'],
              ['walk-outline', 'Directions and a call away'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.point}>
                <Icon name={icon as 'heart'} size={18} color="accent" />
                <Text variant="bodyStrong">{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(120).springify().damping(18)} style={styles.card}>
          <Text variant="title" accessibilityRole="header">
            Where are you shopping?
          </Text>
          <LocationPicker />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <Button label="Start exploring" icon="arrow-forward" onPress={start} disabled={!hasLocation} testID="start" />
        {!signedIn ? (
          <PressableScale onPress={() => router.push('/sign-in')} accessibilityRole="button" accessibilityLabel="Sign in, optional" style={styles.signIn}>
            <Text variant="bodyStrong" tone="accent">
              Sign in (optional)
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glow: { position: 'absolute', left: 0, right: 0, top: 0 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 28, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { gap: 10 },
  points: { gap: 8, marginTop: 6 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  card: { gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 2, maxWidth: 560, width: '100%', alignSelf: 'center' },
  signIn: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
