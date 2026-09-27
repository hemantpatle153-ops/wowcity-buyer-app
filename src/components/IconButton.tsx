import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, type ColorTokens } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'surface',
  color,
  size = minTouch,
  style,
  hint,
}: {
  icon: IconName;
  /** Screen-reader label (required: icon buttons have no visible text). */
  label: string;
  onPress?: () => void;
  variant?: 'surface' | 'photo' | 'plain' | 'accent';
  color?: keyof ColorTokens;
  size?: number;
  style?: StyleProp<ViewStyle>;
  hint?: string;
}) {
  const { colors } = useTheme();
  const bg = { surface: colors.surface, photo: colors.photoChip, plain: 'transparent', accent: colors.accent }[variant];
  const fg: keyof ColorTokens = color ?? (variant === 'photo' ? 'onPhoto' : variant === 'accent' ? 'accentText' : 'text');
  return (
    <PressableScale
      onPress={onPress}
      haptic="tap"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={size < minTouch ? (minTouch - size) / 2 : 0}
      scaleTo={0.9}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: colors.border,
          borderWidth: variant === 'surface' ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={fg} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } });
