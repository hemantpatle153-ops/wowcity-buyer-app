import { Switch } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';

export function ThemedSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const { colors, dark } = useTheme();
  const haptics = useHaptics();
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        haptics.select();
        onValueChange(v);
      }}
      accessibilityLabel={label}
      trackColor={{ true: colors.accent, false: colors.borderStrong }}
      thumbColor={dark ? colors.text : colors.surfaceRaised}
      ios_backgroundColor={colors.borderStrong}
      {...({ activeThumbColor: dark ? colors.text : colors.surfaceRaised } as object)}
    />
  );
}
