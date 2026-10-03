import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  size = 22,
  color = 'text',
  tint,
}: {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens;
  /** A fixed colour (e.g. white on the brand gradient); overrides `color`. */
  tint?: string;
}) {
  const { colors, textScale } = useTheme();
  return (
    <Ionicons
      name={name}
      size={Math.round(size * Math.min(textScale, 1.15))}
      color={tint ?? colors[color]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
