import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  trailingIcon,
  swatch,
  disabled,
  strike,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  trailingIcon?: IconName;
  /** A small colour dot (for colour filters); label is always shown too. */
  swatch?: string;
  disabled?: boolean;
  /** Draws a strike-through (e.g. a sold-out size). */
  strike?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      haptic={onPress ? 'select' : 'none'}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      disabled={!onPress || disabled}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {swatch ? (
          <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.borderStrong }]} />
        ) : null}
        {icon ? <Icon name={icon} size={16} color={selected ? 'accent' : strike ? 'textMuted' : 'text'} /> : null}
        <Text
          variant="bodyStrong"
          tone={selected ? 'accent' : strike ? 'muted' : 'default'}
          numberOfLines={1}
          style={strike ? { textDecorationLine: 'line-through' } : undefined}
        >
          {label}
        </Text>
        {trailingIcon ? <Icon name={trailingIcon} size={16} color={selected ? 'accent' : 'textMuted'} /> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    // 40dp visual height; the 4dp hit slop on each side keeps the 48dp touch target.
    marginVertical: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
});
