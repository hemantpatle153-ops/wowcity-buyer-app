import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, type ColorTokens } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'lg',
  style,
  accessibilityHint,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const palette: Record<Variant, { bg: string; fg: keyof ColorTokens; border?: string }> = {
    primary: { bg: colors.accent, fg: 'accentText' },
    secondary: { bg: colors.surface, fg: 'text', border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: 'accent' },
    soft: { bg: colors.accentSoft, fg: 'accent' },
    danger: { bg: colors.danger, fg: 'bg' },
  };
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <PressableScale
      testID={testID}
      onPress={inactive ? undefined : onPress}
      haptic={variant === 'primary' || variant === 'danger' ? 'tap' : 'none'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        {
          minHeight: size === 'lg' ? 52 : minTouch,
          backgroundColor: p.bg,
          borderRadius: radius.control + 4,
          borderWidth: p.border ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: p.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={colors[p.fg]} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
            <Text variant="label" style={{ color: colors[p.fg] }} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
