import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.group}>
      {title ? (
        <Text variant="caption" tone="muted" uppercase weight="700" style={styles.groupTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>{children}</View>
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  danger,
  disabled,
  last,
  trailing,
  hint,
  external,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  last?: boolean;
  trailing?: ReactNode;
  hint?: string;
  external?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.iconWrap, { backgroundColor: danger ? colors.surfaceSunken : colors.accentSoft }]}>
        <Icon name={icon} size={18} color={danger ? 'danger' : 'accent'} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyLarge" tone={danger ? 'danger' : 'default'} weight="600">
          {label}
        </Text>
        {value ? (
          <Text variant="body" tone="muted" numberOfLines={2}>
            {value}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress && !disabled ? <Icon name={external ? 'open-outline' : 'chevron-forward'} size={18} color="textMuted" /> : null)}
    </View>
  );
  if (!onPress || disabled) {
    return (
      <View accessible accessibilityLabel={[label, value].filter(Boolean).join(', ')} accessibilityState={{ disabled }}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      onPress={onPress}
      haptic="tap"
      scaleTo={0.985}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={[label, value].filter(Boolean).join(', ')}
      accessibilityHint={hint}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  groupTitle: { paddingHorizontal: 4 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 60, paddingVertical: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 1 },
});
