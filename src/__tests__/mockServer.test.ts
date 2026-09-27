import { createApiClient } from '@/api/client';
import { createEndpoints } from '@/api/endpoints';
import { BHOPAL } from '@/api/mock/fixtures';
import { createMockFetch, normaliseIdentifier } from '@/api/mock/server';

const api = createEndpoints(
  createApiClient({ baseUrl: 'https://m/api/v1/public', fetch: createMockFetch({ latencyMs: [0, 0] }) }),
);
const here = { lat: BHOPAL.lat, lng: BHOPAL.lng };

describe('mock server', () => {
  it('filters by radius and sorts nearest first', async () => {
    const res = await api.search({ ...here, radiusKm: 10 });
    expect(res.total).toBeGreaterThan(24);
    expect(res.items).toHaveLength(24);
    expect(res.items.every((i) => i.store.city === 'Bhopal')).toBe(true);
    const d = res.items.map((i) => i.store.distanceKm!);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
    const page2 = await api.search({ ...here, radiusKm: 10, page: 2 });
    expect(page2.items.length).toBe(res.total - 24);
  });

  it('never exposes stock counts and omits hidden fields', async () => {
    const res = await api.search({ city: 'Bhopal', storeId: 'st_stylestreet' });
    for (const card of res.items) {
      expect(card.price).toBeUndefined();
      expect(card.mrp).toBeUndefined();
      expect(JSON.stringify(card)).not.toMatch(/stock"?:\s*\d|quantity|qty/i);
    }
    const urban = await api.store('st_urbanloom');
    expect(urban.address).toBeUndefined();
    expect(urban.latitude).toBeUndefined();
  });

  it('shows sold-out items unless inStockOnly', async () => {
    const all = await api.search({ city: 'Bhopal', q: 'trench' });
    expect(all.items[0].inStock).toBe(false);
    const only = await api.search({ city: 'Bhopal', q: 'trench', inStockOnly: true });
    expect(only.total).toBe(0);
  });

  it('applies text, category, size, colour and price filters', async () => {
    const jeans = await api.search({ city: 'Bhopal', category: 'Jeans', size: '32', minPrice: 2000, sort: 'price_low' });
    expect(jeans.items.length).toBeGreaterThan(0);
    for (const c of jeans.items) {
      expect(c.category).toBe('Jeans');
      expect(c.sizes).toContain('32');
      expect(c.price!).toBeGreaterThanOrEqual(2000);
    }
    const prices = jeans.items.map((c) => c.price!);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    const q = await api.search({ city: 'Bhopal', q: 'chikankari' });
    expect(q.items.map((c) => c.productId)).toEqual(['p_zt_anarkali']);
  });

  it('lists stores and filters for an area', async () => {
    const stores = await api.stores({ ...here, radiusKm: 5 });
    expect(stores.length).toBeGreaterThan(2);
    expect(stores[0].distanceKm!).toBeLessThanOrEqual(stores[1].distanceKm!);
    const f = await api.filters({ city: 'Indore' });
    expect(f.categories).toEqual(['Dresses', 'Tops']);
  });

  it('returns 404 for unknown products', async () => {
    await expect(api.product('st_zari', 'nope')).rejects.toMatchObject({ status: 404 });
  });

  it('normalises identifiers like the server', () => {
    expect(normaliseIdentifier('98765 43210')).toEqual({ value: '+919876543210', channel: 'sms' });
    expect(normaliseIdentifier('Me@Mail.com ')).toEqual({ value: 'me@mail.com', channel: 'email' });
    expect(normaliseIdentifier('12345')).toBeNull();
  });
});

describe('mock server persistence', () => {
  it('keeps demo accounts and favourites across restarts', async () => {
    let saved: string | null = null;
    const persistence = { load: async () => saved, save: async (j: string) => void (saved = j) };
    const first = createEndpoints(
      createApiClient({ baseUrl: 'https://m/api/v1/public', fetch: createMockFetch({ latencyMs: [0, 0], persistence }) }),
    );
    const session = await first.verifyOtp('demo@wowcity.in', '123456');
    // A restarted app: new mock server instance, same storage.
    const fetch2 = createMockFetch({ latencyMs: [0, 0], persistence });
    const second = createEndpoints(createApiClient({ baseUrl: 'https://m/api/v1/public', fetch: fetch2 }));
    const refreshed = await second.refresh(session.refreshToken);
    expect(refreshed.user.email).toBe('demo@wowcity.in');
  });
});
