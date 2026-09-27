import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { locationLabel, useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function LocationPill() {
  const { colors } = useTheme();
  const location = useSettings((s) => s.location);
  const radiusKm = useSettings((s) => s.radiusKm);
  const label = locationLabel(location);
  return (
    <PressableScale
      onPress={() => router.push('/location')}
      haptic="tap"
      accessibilityLabel={`Location: ${label}, within ${radiusKm} kilometres`}
      accessibilityHint="Change your location or radius"
      style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Icon name="location" size={16} color="accent" />
      <Text variant="bodyStrong" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Text variant="body" tone="muted" numeric>
        · {radiusKm} km
      </Text>
      <Icon name="chevron-down" size={14} color="textMuted" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginVertical: 2,
  },
  label: { flexShrink: 1 },
});
