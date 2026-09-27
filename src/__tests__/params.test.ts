import { buildQuery, joinUrl, parseQuery } from '@/api/params';
import { locationParams } from '@/state/settings';

describe('buildQuery', () => {
  it('returns empty string for no params', () => {
    expect(buildQuery(undefined)).toBe('');
    expect(buildQuery({})).toBe('');
  });

  it('skips undefined, null, blank strings and non-finite numbers', () => {
    expect(buildQuery({ a: undefined, b: null, c: '  ', d: NaN, e: Infinity, f: 'x' })).toBe('?f=x');
  });

  it('serialises booleans and numbers, keeps zero and false', () => {
    expect(buildQuery({ inStockOnly: false, page: 0, lat: 23.25 })).toBe('?inStockOnly=false&lat=23.25&page=0');
  });

  it('sorts keys for stable cache keys and encodes values', () => {
    expect(buildQuery({ q: 'kurta & saree', city: 'Bhopal' })).toBe('?city=Bhopal&q=kurta%20%26%20saree');
  });

  it('trims string values', () => {
    expect(buildQuery({ q: '  jeans ' })).toBe('?q=jeans');
  });

  it('round-trips through parseQuery', () => {
    const qs = buildQuery({ q: 'red dress', minPrice: 500, inStockOnly: true });
    expect(parseQuery(qs)).toEqual({ q: 'red dress', minPrice: '500', inStockOnly: 'true' });
  });
});

describe('joinUrl', () => {
  it('joins without doubling slashes', () => {
    expect(joinUrl('https://x.in/api/v1/public/', '/search')).toBe('https://x.in/api/v1/public/search');
    expect(joinUrl('https://x.in/api', 'stores')).toBe('https://x.in/api/stores');
  });
});

describe('locationParams', () => {
  it('prefers coordinates', () => {
    expect(locationParams({ kind: 'gps', lat: 1, lng: 2, label: 'x' }, 5)).toEqual({ lat: 1, lng: 2, radiusKm: 5 });
  });
  it('falls back to city', () => {
    expect(locationParams({ kind: 'city', city: 'Bhopal' }, 10)).toEqual({ city: 'Bhopal', radiusKm: 10 });
  });
  it('is empty without a location', () => {
    expect(locationParams(null, 10)).toEqual({});
  });
});
