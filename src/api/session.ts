import { ApiError } from './client';
import type { Session, User } from './types';

export type TokenStorage = {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  clear(): Promise<void>;
};

export type SessionManager = {
  getAccessToken(): string | null;
  /** Resolves to a fresh access token, or null when the buyer must sign in again. Concurrent calls share one refresh. */
  refreshAccessToken(): Promise<string | null>;
  setSession(session: Session): Promise<void>;
  clear(): Promise<void>;
  hasRefreshToken(): Promise<boolean>;
};

export function createSessionManager(opts: {
  storage: TokenStorage;
  refresh: (refreshToken: string) => Promise<Session>;
  onUser: (user: User | null) => void;
}): SessionManager {
  let accessToken: string | null = null;
  let inflight: Promise<string | null> | null = null;

  async function clear() {
    accessToken = null;
    await opts.storage.clear();
    opts.onUser(null);
  }

  async function setSession(session: Session) {
    accessToken = session.accessToken;
    await opts.storage.set(session.refreshToken);
    opts.onUser(session.user);
  }

  async function doRefresh(): Promise<string | null> {
    const refreshToken = await opts.storage.get();
    if (!refreshToken) {
      accessToken = null;
      opts.onUser(null);
      return null;
    }
    try {
      const session = await opts.refresh(refreshToken);
      await setSession(session);
      return session.accessToken;
    } catch (e) {
      // Offline or server hiccup: keep the refresh token so the buyer stays signed in.
      if (e instanceof ApiError && (e.isNetwork || e.status >= 500 || e.status === 429)) throw e;
      await clear();
      return null;
    }
  }

  return {
    getAccessToken: () => accessToken,
    refreshAccessToken() {
      if (!inflight) {
        inflight = doRefresh().finally(() => {
          inflight = null;
        });
      }
      return inflight;
    },
    setSession,
    clear,
    async hasRefreshToken() {
      return (await opts.storage.get()) !== null;
    },
  };
}
