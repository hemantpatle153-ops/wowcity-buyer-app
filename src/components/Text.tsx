import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { typeScale, type ColorTokens, type TypeVariant } from '@/theme/tokens';

type Tone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'onAccent' | 'onPhoto';

const toneToken: Record<Tone, keyof ColorTokens> = {
  default: 'text',
  muted: 'textMuted',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  onAccent: 'accentText',
  onPhoto: 'onPhoto',
};

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Tabular numerals for prices and counts. */
  numeric?: boolean;
  uppercase?: boolean;
};

/**
 * Themed text. Sizes follow the type scale, multiplied by the in-app text size
 * setting; the OS font scale (dynamic type) applies on top, capped so layouts hold.
 */
export function Text({ variant = 'body', tone = 'default', weight, align, numeric, uppercase, style, ...rest }: TextProps) {
  const { colors, textScale } = useTheme();
  const t = typeScale[variant];
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        {
          color: colors[toneToken[tone]],
          fontSize: Math.round(t.size * textScale),
          lineHeight: Math.round(t.line * textScale),
          fontWeight: weight ?? t.weight,
          textAlign: align,
          letterSpacing: uppercase ? 0.6 : variant === 'display' || variant === 'headline' ? -0.4 : 0,
          textTransform: uppercase ? 'uppercase' : undefined,
          fontVariant: numeric ? ['tabular-nums'] : undefined,
        },
        style,
      ]}
    />
  );
}
