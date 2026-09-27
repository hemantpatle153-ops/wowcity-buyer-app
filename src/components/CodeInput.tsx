import { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

/** Six boxes backed by one hidden input, so SMS autofill and paste work. */
export const CodeInput = forwardRef<TextInput, { value: string; onChange: (v: string) => void; error?: boolean; length?: number }>(
  function CodeInput({ value, onChange, error, length = 6 }, ref) {
    const { colors, radius, textScale } = useTheme();
    const focusInput = () => (ref && typeof ref !== 'function' ? ref.current?.focus() : undefined);
    return (
      <Pressable onPress={focusInput} accessible={false} style={styles.wrap}>
        <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length }, (_, i) => {
            const char = value[i] ?? '';
            const active = i === Math.min(value.length, length - 1);
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    borderRadius: radius.control + 2,
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.danger : active ? colors.accent : colors.border,
                    borderWidth: active || error ? 2 : 1,
                    height: Math.round(58 * Math.min(textScale, 1.2)),
                  },
                ]}
              >
                <Text variant="headline" numeric>
                  {char}
                </Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          accessibilityLabel={`${length}-digit code`}
          style={styles.hidden}
          caretHidden
        />
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  row: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hidden: { ...StyleSheet.absoluteFill, opacity: 0.011, color: 'transparent' },
});
