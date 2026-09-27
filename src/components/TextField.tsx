import { forwardRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
  trailing?: ReactNode;
  error?: boolean;
  /** 'outline' = surface with border; 'filled' = sunken fill (search boxes). */
  look?: 'outline' | 'filled';
  size?: 'md' | 'lg';
};

/** Themed text input with a visible accent focus border (replaces the browser focus ring on web). */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { style, leading, trailing, error, look = 'outline', size = 'lg', onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radius, textScale } = useTheme();
  const [focused, setFocused] = useState(false);
  const border = error ? colors.danger : focused ? colors.accent : look === 'filled' ? 'transparent' : colors.border;
  return (
    <View
      style={[
        styles.wrap,
        {
          minHeight: size === 'lg' ? 54 : 48,
          backgroundColor: look === 'filled' ? colors.surfaceSunken : colors.surface,
          borderColor: border,
          borderRadius: radius.control + 4,
          paddingLeft: leading ? 14 : 0,
        },
        style,
      ]}
    >
      {leading}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={1.6}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: colors.text, fontSize: Math.round((size === 'lg' ? 17 : 16) * textScale), paddingLeft: leading ? 0 : 14 },
        ]}
      />
      {trailing}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5 },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingRight: 14,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
