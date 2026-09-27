import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useState } from 'react';

import { useSettings } from '@/state/settings';
import {
  buildColors,
  isDarkMode,
  radius,
  resolveMode,
  space,
  textSizeScale,
  type ColorTokens,
  type ResolvedMode,
} from './tokens';

export type Theme = {
  mode: ResolvedMode;
  dark: boolean;
  colors: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  textScale: number;
  reduceMotion: boolean;
  haptics: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

function useSystemReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return reduce;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const appearance = useSettings((s) => s.appearance);
  const systemReduce = useSystemReduceMotion();

  const theme = useMemo<Theme>(() => {
    const mode = resolveMode(appearance.mode, scheme);
    return {
      mode,
      dark: isDarkMode(mode),
      colors: buildColors(mode, appearance.accent),
      space,
      radius,
      textScale: textSizeScale[appearance.textSize],
      reduceMotion: appearance.reduceMotion === 'on' || systemReduce,
      haptics: appearance.haptics,
    };
  }, [appearance, scheme, systemReduce]);

  return (
    <ThemeContext.Provider value={theme}>
      <View style={[styles.fill, { backgroundColor: theme.colors.bg }]}>
        {children}
        <ThemeCrossFade color={theme.colors.bg} reduceMotion={theme.reduceMotion} />
      </View>
    </ThemeContext.Provider>
  );
}

/** Briefly fades the previous background out over the new theme when the mode changes. */
function ThemeCrossFade({ color, reduceMotion }: { color: string; reduceMotion: boolean }) {
  const previous = useRef(color);
  const [fadeColor, setFadeColor] = useState<string | null>(null);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (previous.current !== color) {
      if (!reduceMotion) {
        setFadeColor(previous.current);
        opacity.value = 0.85;
        opacity.value = withTiming(0, { duration: 240 });
      }
      previous.current = color;
    }
  }, [color, opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (!fadeColor) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: fadeColor }, style]}
    />
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
