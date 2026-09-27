import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { TokenStorage } from '@/api/session';

const KEY = 'wowcity.refreshToken';

/**
 * Refresh token lives in the Keychain / Keystore via expo-secure-store.
 * The web build (used only for demos and screenshots) falls back to localStorage.
 */
export const tokenStorage: TokenStorage = {
  async get() {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
    return SecureStore.getItemAsync(KEY);
  },
  async set(value) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  },
  async clear() {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};
