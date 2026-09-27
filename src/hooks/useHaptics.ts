import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useSettings } from '@/state/settings';

/** Haptics that respect Settings → Appearance → Haptics (no-ops on web). */
export function useHaptics() {
  const enabled = useSettings((s) => s.appearance.haptics) && Platform.OS !== 'web';
  return useMemo(
    () => ({
      tap: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
      select: () => enabled && Haptics.selectionAsync().catch(() => {}),
      success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
      warning: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
      heavy: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
    }),
    [enabled],
  );
}
