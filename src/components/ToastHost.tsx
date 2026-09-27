import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/state/toast';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function ToastHost({ bottomOffset = 76 }: { bottomOffset?: number }) {
  const current = useToast((s) => s.current);
  const hide = useToast((s) => s.hide);
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(hide, current.action ? 4500 : 2800);
    return () => clearTimeout(t);
  }, [current, hide]);

  if (!current) return null;
  const icon = current.tone === 'success' ? 'checkmark-circle' : current.tone === 'danger' ? 'alert-circle' : 'information-circle';
  const iconColor = current.tone === 'success' ? 'success' : current.tone === 'danger' ? 'danger' : 'textMuted';
  return (
    <Animated.View
      key={current.id}
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(18)}
      exiting={reduceMotion ? undefined : FadeOutDown}
      style={[styles.wrap, { bottom: insets.bottom + bottomOffset }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.toast, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <Icon name={icon} size={20} color={iconColor} />
        <Text variant="bodyStrong" style={styles.msg}>
          {current.message}
        </Text>
        {current.action ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={current.action.label}
            onPress={() => {
              current.action?.onPress();
              hide();
            }}
            style={styles.action}
          >
            <Text variant="label" tone="accent">
              {current.action.label}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 60 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 560,
    width: '100%',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  msg: { flex: 1, paddingVertical: 12 },
  action: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
});
