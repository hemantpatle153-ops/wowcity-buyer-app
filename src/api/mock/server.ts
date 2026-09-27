import type { FetchLike, HttpResponse } from '../client';
import { parseQuery } from '../params';
import type {
  Filters,
  Page,
  ProductCard,
  ProductDetail,
  Session,
  SortOption,
  Store,
  StoreSummary,
  User,
  Variant,
} from '../types';
import {
  fixtureProducts,
  fixtureStores,
  MOCK_NOW,
  type FixtureProduct,
  type FixtureStore,
  type HideableField,
} from './fixtures';

const PAGE_SIZE = 24;
export const MOCK_BAD_CODE = '000000';

type Coords = { lat: number; lng: number } | null;

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function storeById(id: string) {
  return fixtureStores.find((s) => s.storeId === id);
}

function toStore(s: FixtureStore, at: Coords): Store {
  const out: Store = { storeId: s.storeId, name: s.name, city: s.city, state: s.state };
  if (s.sharesAddress) {
    out.address = s.address;
    out.latitude = s.lat;
    out.longitude = s.lng;
    out.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
  }
  if (s.phone) out.phone = s.phone;
  if (at) out.distanceKm = round1(haversineKm(at.lat, at.lng, s.lat, s.lng));
  return out;
}

function hides(s: FixtureStore, f: HideableField) {
  return s.hidden.includes(f);
}

function uniq<T>(xs: (T | undefined)[]): T[] {
  return [...new Set(xs.filter((x): x is T => x !== undefined))];
}

function publishedAt(p: FixtureProduct) {
  return new Date(MOCK_NOW - p.daysAgo * 86_400_000).toISOString();
}

function toCard(p: FixtureProduct, at: Coords): ProductCard {
  const s = storeById(p.storeId)!;
  const inStockVariants = p.variants.filter((v) => v.inStock);
  const priced = inStockVariants.length ? inStockVariants : p.variants;
  const prices = priced.map((v) => v.price);
  const card: ProductCard = {
    productId: p.productId,
    storeId: p.storeId,
    inStock: inStockVariants.length > 0,
    image: p.photos[0] ?? null,
    publishedAt: publishedAt(p),
    store: toStore(s, at),
  };
  if (!hides(s, 'name')) card.name = p.name;
  if (!hides(s, 'brand') && p.brand) card.brand = p.brand;
  if (!hides(s, 'category')) card.category = p.category;
  if (!hides(s, 'price')) {
    card.price = Math.min(...prices);
    if (Math.max(...prices) !== card.price) card.maxPrice = Math.max(...prices);
  }
  const mrp = priced.find((v) => v.mrp)?.mrp;
  if (!hides(s, 'mrp') && mrp) card.mrp = mrp;
  if (!hides(s, 'size')) {
    const sizes = uniq(inStockVariants.map((v) => v.size));
    if (sizes.length) card.sizes = sizes;
  }
  if (!hides(s, 'colour')) {
    const colours = uniq(inStockVariants.map((v) => v.colour));
    if (colours.length) card.colours = colours;
  }
  return card;
}

function toDetail(p: FixtureProduct, at: Coords): ProductDetail {
  const s = storeById(p.storeId)!;
  const card = toCard(p, at);
  const variants: Variant[] = p.variants.map((v, i) => {
    const out: Variant = { variantId: `${p.productId}_v${i + 1}`, inStock: v.inStock };
    if (!hides(s, 'size') && v.size) out.size = v.size;
    if (!hides(s, 'colour') && v.colour) out.colour = v.colour;
    if (!hides(s, 'style') && v.style) out.style = v.style;
    if (!hides(s, 'price')) out.price = v.price;
    if (!hides(s, 'mrp') && v.mrp) out.mrp = v.mrp;
    return out;
  });
  const detail: ProductDetail = {
    productId: p.productId,
    storeId: p.storeId,
    inStock: card.inStock,
    images: p.photos,
    variants,
    store: card.store,
  };
  if (card.name) detail.name = card.name;
  if (card.brand) detail.brand = card.brand;
  if (card.category) detail.category = card.category;
  if (p.description) detail.description = p.description;
  if (p.tags) detail.tags = p.tags;
  if (p.details) detail.details = p.details;
  return detail;
}

type Area = { at: Coords; radiusKm: number; city?: string };

function readArea(q: Record<string, string>): Area {
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  const at = q.lat !== undefined && q.lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  const radiusKm = Math.min(100, Math.max(0.1, Number(q.radiusKm ?? 10) || 10));
  return { at, radiusKm, city: q.city?.trim() || undefined };
}

function storesIn(area: Area): FixtureStore[] {
  return fixtureStores.filter((s) => {
    if (area.at) return haversineKm(area.at.lat, area.at.lng, s.lat, s.lng) <= area.radiusKm;
    if (area.city) return s.city.toLowerCase() === area.city.toLowerCase();
    return true;
  });
}

function eq(a: string | undefined, b: string | undefined) {
  return a !== undefined && b !== undefined && a.toLowerCase() === b.toLowerCase();
}

function search(q: Record<string, string>): Page<ProductCard> {
  const area = readArea(q);
  const allowed = new Set(storesIn(area).map((s) => s.storeId));
  let cards = fixtureProducts
    .filter((p) => (q.storeId ? p.storeId === q.storeId : allowed.has(p.storeId)))
    .map((p) => ({ p, card: toCard(p, area.at) }));

  const terms = (q.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length) {
    cards = cards.filter(({ p, card }) => {
      const hay = [card.name, card.brand, card.category, ...(p.tags ?? []), card.store.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (q.category) cards = cards.filter(({ card }) => eq(card.category, q.category));
  if (q.brand) cards = cards.filter(({ card }) => eq(card.brand, q.brand));
  if (q.size) cards = cards.filter(({ card }) => card.sizes?.some((s) => eq(s, q.size)));
  if (q.colour) cards = cards.filter(({ card }) => card.colours?.some((c) => eq(c, q.colour)));
  if (q.minPrice) cards = cards.filter(({ card }) => card.price !== undefined && card.price >= Number(q.minPrice));
  if (q.maxPrice) cards = cards.filter(({ card }) => card.price !== undefined && card.price <= Number(q.maxPrice));
  if (q.inStockOnly === 'true') cards = cards.filter(({ card }) => card.inStock);

  const sort = (q.sort as SortOption | undefined) ?? (area.at ? 'nearest' : 'newest');
  const newest = (a: ProductCard, b: ProductCard) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
  const byPrice = (dir: 1 | -1) => (a: ProductCard, b: ProductCard) => {
    if (a.price === undefined) return b.price === undefined ? 0 : 1;
    if (b.price === undefined) return -1;
    return (a.price - b.price) * dir;
  };
  const list = cards.map((c) => c.card);
  if (sort === 'nearest') list.sort((a, b) => (a.store.distanceKm ?? 0) - (b.store.distanceKm ?? 0) || newest(a, b));
  else if (sort === 'price_low') list.sort(byPrice(1));
  else if (sort === 'price_high') list.sort(byPrice(-1));
  else list.sort(newest);

  const page = Math.max(1, Math.floor(Number(q.page ?? 1)) || 1);
  return {
    total: list.length,
    page,
    pageSize: PAGE_SIZE,
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}

function summary(s: FixtureStore, at: Coords): StoreSummary {
  const products = fixtureProducts.filter((p) => p.storeId === s.storeId);
  return {
    ...toStore(s, at),
    listedProducts: products.length,
    inStockProducts: products.filter((p) => p.variants.some((v) => v.inStock)).length,
  };
}

function filtersFor(area: Area): Filters {
  const ids = new Set(storesIn(area).map((s) => s.storeId));
  const cards = fixtureProducts.filter((p) => ids.has(p.storeId)).map((p) => toCard(p, area.at));
  const sorted = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  return {
    categories: sorted(cards.flatMap((c) => (c.category ? [c.category] : []))),
    brands: sorted(cards.flatMap((c) => (c.brand ? [c.brand] : []))),
    sizes: sorted(cards.flatMap((c) => c.sizes ?? [])),
    colours: sorted(cards.flatMap((c) => c.colours ?? [])),
  };
}

// ---------- auth + favourites (in memory, per app session) ----------

type MockAccount = { user: User; favourites: { storeId: string; productId: string; at: number }[] };

export type MockState = {
  accounts: Map<string, MockAccount>;
  access: Map<string, string>; // token -> user id
  refresh: Map<string, string>;
  seq: number;
};

export function createMockState(): MockState {
  return { accounts: new Map(), access: new Map(), refresh: new Map(), seq: 0 };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normaliseIdentifier(raw: string): { value: string; channel: 'email' | 'sms' } | null {
  const v = raw.trim();
  if (EMAIL.test(v)) return { value: v.toLowerCase(), channel: 'email' };
  const digits = v.replace(/[\s-]/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return { value: `+91${digits}`, channel: 'sms' };
  if (/^\+91[6-9]\d{9}$/.test(digits)) return { value: digits, channel: 'sms' };
  if (/^\+\d{8,15}$/.test(digits)) return { value: digits, channel: 'sms' };
  return null;
}

function maskIdentifier(id: string, channel: 'email' | 'sms') {
  if (channel === 'email') {
    const [name, domain] = id.split('@');
    return `${name.slice(0, 2)}•••@${domain}`;
  }
  return `${id.slice(0, 3)} •••••${id.slice(-4)}`;
}

function issue(state: MockState, userId: string): Session {
  state.seq += 1;
  const accessToken = `mock-access-${state.seq}`;
  const refreshToken = `mock-refresh-${state.seq}`;
  state.access.set(accessToken, userId);
  state.refresh.set(refreshToken, userId);
  return { accessToken, refreshToken, expiresIn: 3600, user: { ...state.accounts.get(userId)!.user } };
}

// ---------- router ----------

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function respond(status: number, payload: unknown): HttpResponse {
  return { status, ok: status >= 200 && status < 300, json: async () => payload };
}

export type MockOptions = { latencyMs?: [number, number]; state?: MockState };

export function createMockFetch(opts: MockOptions = {}): FetchLike & { state: MockState } {
  const state = opts.state ?? createMockState();
  const [minLatency, maxLatency] = opts.latencyMs ?? [250, 650];

  function authed(headers: Record<string, string>): MockAccount {
    const token = headers.Authorization?.replace(/^Bearer\s+/, '');
    const userId = token ? state.access.get(token) : undefined;
    const account = userId ? state.accounts.get(userId) : undefined;
    if (!account) throw new HttpError(401, 'unauthorized', 'Please sign in again.');
    return account;
  }

  function handle(method: string, path: string, q: Record<string, string>, headers: Record<string, string>, body: any) {
    const seg = path.split('/').filter(Boolean);
    const area = readArea(q);

    if (method === 'GET' && path === '/search') return search(q);
    if (method === 'GET' && seg[0] === 'products' && seg.length === 3) {
      const p = fixtureProducts.find((x) => x.storeId === seg[1] && x.productId === seg[2]);
      if (!p) throw new HttpError(404, 'not_found', 'This item is no longer listed.');
      return toDetail(p, area.at);
    }
    if (method === 'GET' && path === '/stores') {
      const term = (q.q ?? '').trim().toLowerCase();
      return storesIn(area)
        .filter((s) => !term || s.name.toLowerCase().includes(term))
        .map((s) => summary(s, area.at))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.name.localeCompare(b.name));
    }
    if (method === 'GET' && seg[0] === 'stores' && seg.length === 2) {
      const s = storeById(seg[1]);
      if (!s) throw new HttpError(404, 'not_found', 'This shop is no longer listed.');
      return summary(s, area.at);
    }
    if (method === 'GET' && path === '/filters') return filtersFor(area);

    if (method === 'POST' && path === '/auth/otp/request') {
      const id = normaliseIdentifier(String(body?.identifier ?? ''));
      if (!id) throw new HttpError(422, 'invalid_identifier', 'Enter a valid email address or 10-digit mobile number.');
      return { sentTo: maskIdentifier(id.value, id.channel), channel: id.channel };
    }
    if (method === 'POST' && path === '/auth/otp/verify') {
      const id = normaliseIdentifier(String(body?.identifier ?? ''));
      const code = String(body?.code ?? '');
      if (!id) throw new HttpError(422, 'invalid_identifier', 'Enter a valid email address or 10-digit mobile number.');
      if (!/^\d{6}$/.test(code) || code === MOCK_BAD_CODE) {
        throw new HttpError(422, 'invalid_code', 'That code is not right. Check it and try again.');
      }
      let account = [...state.accounts.values()].find(
        (a) => a.user.email === id.value || a.user.phone === id.value,
      );
      if (!account) {
        const user: User = { id: `u_${state.accounts.size + 1}` };
        if (id.channel === 'email') user.email = id.value;
        else user.phone = id.value;
        account = { user, favourites: [] };
        state.accounts.set(user.id, account);
      }
      return issue(state, account.user.id);
    }
    if (method === 'POST' && path === '/auth/refresh') {
      const token = String(body?.refreshToken ?? '');
      const userId = state.refresh.get(token);
      if (!userId || !state.accounts.has(userId)) {
        throw new HttpError(401, 'invalid_refresh', 'Please sign in again.');
      }
      state.refresh.delete(token); // rotation: the old refresh token stops working
      return issue(state, userId);
    }
    if (method === 'POST' && path === '/auth/logout') {
      const token = headers.Authorization?.replace(/^Bearer\s+/, '');
      if (token) state.access.delete(token);
      return { signedOut: true };
    }
    if (path === '/me') {
      const account = authed(headers);
      if (method === 'PATCH') {
        const name = String(body?.name ?? '').trim();
        if (!name || name.length > 60) throw new HttpError(422, 'invalid_name', 'Enter a name up to 60 characters.');
        account.user.name = name;
      }
      return { ...account.user };
    }
    if (path === '/favourites' && method === 'GET') {
      const account = authed(headers);
      const listed = account.favourites
        .slice()
        .sort((a, b) => b.at - a.at)
        .map((f) => fixtureProducts.find((p) => p.productId === f.productId && p.storeId === f.storeId))
        .filter((p): p is FixtureProduct => !!p)
        .map((p) => toCard(p, area.at));
      const page = Math.max(1, Number(q.page ?? 1) || 1);
      return { total: listed.length, page, pageSize: PAGE_SIZE, items: listed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
    }
    if (path === '/favourites' && method === 'PUT') {
      const account = authed(headers);
      const { storeId, productId, saved } = body ?? {};
      const exists = fixtureProducts.some((p) => p.productId === productId && p.storeId === storeId);
      if (!exists) throw new HttpError(404, 'not_listed', 'This item is no longer listed.');
      account.favourites = account.favourites.filter((f) => !(f.productId === productId && f.storeId === storeId));
      if (saved) {
        if (account.favourites.length >= 500) throw new HttpError(422, 'limit', 'You can save up to 500 items.');
        account.favourites.push({ storeId, productId, at: Date.now() + state.seq++ });
      }
      return { saved: !!saved };
    }
    if (path === '/account' && method === 'DELETE') {
      const account = authed(headers);
      state.accounts.delete(account.user.id);
      for (const [k, v] of state.access) if (v === account.user.id) state.access.delete(k);
      for (const [k, v] of state.refresh) if (v === account.user.id) state.refresh.delete(k);
      return { deleted: true };
    }
    throw new HttpError(404, 'not_found', 'Not found.');
  }

  const fetchImpl = (async (url, init) => {
    const wait = minLatency + Math.random() * (maxLatency - minLatency);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const match = /\/api\/v1\/public(\/[^?]*)(\?.*)?$/.exec(url) ?? /^[a-z]+:\/\/[^/]+(\/[^?]*)(\?.*)?$/i.exec(url);
    const path = match?.[1] ?? '/';
    const query = parseQuery(match?.[2] ?? '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    try {
      return respond(200, { data: handle(init.method, path, query, init.headers, body) });
    } catch (e) {
      if (e instanceof HttpError) return respond(e.status, { error: { code: e.code, message: e.message } });
      return respond(500, { error: { code: 'server_error', message: 'Something went wrong.' } });
    }
  }) as FetchLike & { state: MockState };
  fetchImpl.state = state;
  return fetchImpl;
}
