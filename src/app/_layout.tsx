import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, restoreSession } from '@/api';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ToastHost } from '@/components/ToastHost';
import { loadAllFavouriteKeys } from '@/features/favourites';
import { useAuth } from '@/state/auth';
import { useSettings } from '@/state/settings';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: (count, err) => {
        const status = (err as { status?: number }).status;
        if (status && status >= 400 && status < 500 && status !== 429) return false;
        return count < 2;
      },
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  const theme = useTheme();
  const hydrated = useSettings((s) => s.hydrated);
  const authStatus = useAuth((s) => s.status);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (authStatus === 'signedIn') loadAllFavouriteKeys({ api }).catch(() => {});
  }, [authStatus]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bg).catch(() => {});
  }, [theme.colors.bg]);

  const navTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.bg,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [theme]);

  if (!hydrated) return null;

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: theme.reduceMotion ? 'fade' : 'default',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="product/[storeId]/[productId]" />
        <Stack.Screen name="shop/[storeId]" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="location" />
        <Stack.Screen name="assistant" />
      </Stack>
      <OfflineBanner />
      <ToastHost />
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
