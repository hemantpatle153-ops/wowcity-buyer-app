import { ApiError } from '@/api/client';
import { createSessionManager, type TokenStorage } from '@/api/session';
import type { Session, User } from '@/api/types';

function memoryStorage(initial: string | null = null): TokenStorage & { value: string | null } {
  const s = {
    value: initial,
    get: async () => s.value,
    set: async (v: string) => {
      s.value = v;
    },
    clear: async () => {
      s.value = null;
    },
  };
  return s;
}

const user: User = { id: 'u1', email: 'a@b.in' };
const sessionFor = (n: number): Session => ({ accessToken: `a${n}`, refreshToken: `r${n}`, expiresIn: 3600, user });

describe('session manager (token refresh)', () => {
  it('stores the refresh token and keeps the access token in memory', async () => {
    const storage = memoryStorage();
    const onUser = jest.fn();
    const sm = createSessionManager({ storage, refresh: jest.fn(), onUser });
    await sm.setSession(sessionFor(1));
    expect(sm.getAccessToken()).toBe('a1');
    expect(storage.value).toBe('r1');
    expect(onUser).toHaveBeenCalledWith(user);
  });

  it('rotates the refresh token on refresh', async () => {
    const storage = memoryStorage('r1');
    const refresh = jest.fn(async () => sessionFor(2));
    const sm = createSessionManager({ storage, refresh, onUser: jest.fn() });
    await expect(sm.refreshAccessToken()).resolves.toBe('a2');
    expect(refresh).toHaveBeenCalledWith('r1');
    expect(storage.value).toBe('r2');
  });

  it('shares one in-flight refresh between concurrent callers', async () => {
    const storage = memoryStorage('r1');
    let resolve!: (s: Session) => void;
    const refresh = jest.fn(() => new Promise<Session>((r) => (resolve = r)));
    const sm = createSessionManager({ storage, refresh, onUser: jest.fn() });
    const a = sm.refreshAccessToken();
    const b = sm.refreshAccessToken();
    await Promise.resolve();
    await Promise.resolve();
    resolve(sessionFor(3));
    await expect(Promise.all([a, b])).resolves.toEqual(['a3', 'a3']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh token is rejected', async () => {
    const storage = memoryStorage('r1');
    const onUser = jest.fn();
    const sm = createSessionManager({
      storage,
      refresh: async () => {
        throw new ApiError(401, 'invalid_refresh', 'Please sign in again.');
      },
      onUser,
    });
    await expect(sm.refreshAccessToken()).resolves.toBeNull();
    expect(storage.value).toBeNull();
    expect(onUser).toHaveBeenLastCalledWith(null);
  });

  it('keeps the refresh token when offline', async () => {
    const storage = memoryStorage('r1');
    const sm = createSessionManager({
      storage,
      refresh: async () => {
        throw new ApiError(0, 'network', 'offline');
      },
      onUser: jest.fn(),
    });
    await expect(sm.refreshAccessToken()).rejects.toMatchObject({ status: 0 });
    expect(storage.value).toBe('r1');
  });

  it('returns null without a stored refresh token', async () => {
    const sm = createSessionManager({ storage: memoryStorage(), refresh: jest.fn(), onUser: jest.fn() });
    await expect(sm.refreshAccessToken()).resolves.toBeNull();
    await expect(sm.hasRefreshToken()).resolves.toBe(false);
  });
});
