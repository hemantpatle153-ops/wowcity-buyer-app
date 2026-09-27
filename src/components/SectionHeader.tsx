import { StyleSheet, View } from 'react-native';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function SectionHeader({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text variant="subtitle" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`} style={styles.action}>
          <Text variant="bodyStrong" tone="accent">
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  titles: { flex: 1, gap: 2 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
});
