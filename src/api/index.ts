import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokenStorage } from '@/lib/tokenStorage';
import { useAuth } from '@/state/auth';

import { createApiClient, type FetchLike } from './client';
import { createEndpoints } from './endpoints';
import { createMockFetch } from './mock/server';
import { createSessionManager } from './session';

export const isMock = process.env.EXPO_PUBLIC_MOCK === '1' || !process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mock.wowcity.local/api/v1/public';

const httpFetch: FetchLike = async (url, init) => {
  const res = await fetch(url, init);
  return { status: res.status, ok: res.ok, json: () => res.json() };
};

const MOCK_KEY = 'wowcity.mockServer';
const transport: FetchLike = isMock
  ? createMockFetch({
      persistence: { load: () => AsyncStorage.getItem(MOCK_KEY), save: (json) => AsyncStorage.setItem(MOCK_KEY, json) },
    })
  : httpFetch;

// A client without auth hooks for the refresh call itself (no recursion).
const bareApi = createEndpoints(createApiClient({ baseUrl: API_BASE_URL, fetch: transport }));

export const session = createSessionManager({
  storage: tokenStorage,
  refresh: (refreshToken) => bareApi.refresh(refreshToken),
  onUser: (user) => useAuth.getState().setUser(user),
});

export const api = createEndpoints(
  createApiClient({
    baseUrl: API_BASE_URL,
    fetch: transport,
    auth: {
      getAccessToken: session.getAccessToken,
      refreshAccessToken: session.refreshAccessToken,
    },
  }),
);

/** On launch: restore the session from the stored refresh token, if any. */
export async function restoreSession() {
  try {
    if (await session.hasRefreshToken()) {
      await session.refreshAccessToken();
      return;
    }
  } catch {
    // Offline at launch: stay signed in with the cached profile; the next call will refresh.
    await useAuth.persist.rehydrate();
    const user = useAuth.getState().user;
    if (user) {
      useAuth.setState({ status: 'signedIn' });
      return;
    }
    useAuth.setState({ status: 'signedOut' });
    return;
  }
  useAuth.getState().setUser(null);
}

export { ApiError } from './client';
export type * from './types';
