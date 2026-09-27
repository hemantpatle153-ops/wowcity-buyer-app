import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { typeScale } from '@/theme/tokens';

import { Icon } from './Icon';
import { IconButton } from './IconButton';

export const SearchField = forwardRef<TextInput, TextInputProps & { onClear?: () => void }>(function SearchField(
  { value, onClear, style, ...rest },
  ref,
) {
  const { colors, radius, textScale } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control + 6 }, style]}>
      <Icon name="search" size={20} color="textMuted" />
      <TextInput
        ref={ref}
        value={value}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel={rest.placeholder ?? 'Search'}
        maxFontSizeMultiplier={1.6}
        style={[styles.input, { color: colors.text, fontSize: Math.round(typeScale.bodyLarge.size * textScale) }]}
        {...rest}
      />
      {value ? <IconButton icon="close-circle" label="Clear search" onPress={onClear} variant="plain" color="textMuted" size={40} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4, minHeight: 52, gap: 8 },
  input: { flex: 1, paddingVertical: 12, outlineStyle: 'none' } as never,
});
