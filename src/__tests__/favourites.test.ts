import { createApiClient } from '@/api/client';
import { createEndpoints } from '@/api/endpoints';
import { createMockFetch } from '@/api/mock/server';
import { createSessionManager, type TokenStorage } from '@/api/session';
import { completePendingSave, loadAllFavouriteKeys, setFavourite } from '@/features/favourites';
import { useAuth } from '@/state/auth';
import { favKey, useSaved } from '@/state/saved';

function setup() {
  let stored: string | null = null;
  const storage: TokenStorage = {
    get: async () => stored,
    set: async (v) => {
      stored = v;
    },
    clear: async () => {
      stored = null;
    },
  };
  const fetch = createMockFetch({ latencyMs: [0, 0] });
  const bare = createEndpoints(createApiClient({ baseUrl: 'https://m/api/v1/public', fetch }));
  const session = createSessionManager({
    storage,
    refresh: (t) => bare.refresh(t),
    onUser: (u) => useAuth.getState().setUser(u),
  });
  const api = createEndpoints(
    createApiClient({
      baseUrl: 'https://m/api/v1/public',
      fetch,
      auth: { getAccessToken: session.getAccessToken, refreshAccessToken: session.refreshAccessToken },
    }),
  );
  return { api, session, fetch, getStored: () => stored };
}

const target = { storeId: 'st_kapdaghar', productId: 'p_kg_crewtee' };

beforeEach(() => {
  useSaved.getState().clear();
  useAuth.setState({ status: 'signedOut', user: null, pendingSave: null });
});

describe('favourites flow', () => {
  it('signs in with a code, then finishes the pending save', async () => {
    const { api, session } = setup();
    // Signed out: the heart stores a pending save and asks the buyer to sign in.
    useAuth.getState().setPendingSave(target);
    const sent = await api.requestOtp('9876543210');
    expect(sent.channel).toBe('sms');
    await session.setSession(await api.verifyOtp('9876543210', '123456'));
    expect(useAuth.getState().status).toBe('signedIn');
    expect(useAuth.getState().user?.phone).toBe('+919876543210');

    await expect(completePendingSave({ api }, useAuth.getState().pendingSave)).resolves.toBe('saved');
    expect(useSaved.getState().keys[favKey(target.storeId, target.productId)]).toBe(true);
    const list = await api.favourites({});
    expect(list.items.map((i) => i.productId)).toEqual(['p_kg_crewtee']);
  });

  it('rejects a wrong code with a friendly message', async () => {
    const { api } = setup();
    await expect(api.verifyOtp('a@b.in', '000000')).rejects.toMatchObject({ status: 422, code: 'invalid_code' });
  });

  it('removes a favourite and syncs keys', async () => {
    const { api, session } = setup();
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    await setFavourite({ api }, target, true);
    await setFavourite({ api }, { storeId: 'st_zari', productId: 'p_zt_saree' }, true);
    await expect(setFavourite({ api }, target, false)).resolves.toBe('removed');
    useSaved.getState().clear();
    await expect(loadAllFavouriteKeys({ api })).resolves.toEqual([favKey('st_zari', 'p_zt_saree')]);
  });

  it('reports unlisted products and clears the heart', async () => {
    const { api, session } = setup();
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    await expect(setFavourite({ api }, { storeId: 'st_zari', productId: 'gone' }, true)).resolves.toBe('not_listed');
    expect(useSaved.getState().keys[favKey('st_zari', 'gone')]).toBeUndefined();
  });

  it('reverts the optimistic heart when signed out', async () => {
    const { api } = setup();
    await expect(setFavourite({ api }, target, true)).resolves.toBe('signed_out');
    expect(useSaved.getState().keys[favKey(target.storeId, target.productId)]).toBeUndefined();
  });

  it('transparently refreshes an expired access token', async () => {
    const { api, session, fetch, getStored } = setup();
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    const firstRefresh = getStored();
    fetch.state.access.clear(); // every access token expires
    await expect(api.me()).resolves.toMatchObject({ email: 'buyer@wowcity.in' });
    expect(getStored()).not.toBe(firstRefresh);
  });

  it('deletes the account and its favourites', async () => {
    const { api, session } = setup();
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    await setFavourite({ api }, target, true);
    await expect(api.deleteAccount()).resolves.toEqual({ deleted: true });
    await session.clear();
    expect(useAuth.getState().status).toBe('signedOut');
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    await expect(api.favourites({})).resolves.toMatchObject({ total: 0 });
  });
});
