import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Friendly icon illustration, a short message and one clear action. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const { colors, reduceMotion } = useTheme();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(18)}
      style={[styles.wrap, compact && styles.compact]}
    >
      <View style={[styles.halo, { backgroundColor: colors.accentSoft }]}>
        <View style={[styles.disc, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name={icon} size={36} color="accent" />
        </View>
      </View>
      <Text variant="title" align="center" accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text variant="bodyLarge" tone="muted" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 10 },
  compact: { paddingVertical: 24 },
  halo: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  disc: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  message: { maxWidth: 320 },
  action: { marginTop: 12, minWidth: 200 },
});
