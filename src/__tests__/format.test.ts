import {
  discountPercent,
  formatDetailValue,
  formatDistance,
  formatPhoneForDisplay,
  formatPrice,
  formatPriceRange,
  freshness,
  initials,
} from '@/lib/format';
import { directionsUrl } from '@/lib/maps';

describe('format', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatPrice(129999)).toBe('₹1,29,999');
    expect(formatPriceRange(399, 449)).toBe('₹399 – ₹449');
    expect(formatPriceRange(399, 399)).toBe('₹399');
    expect(formatPriceRange(undefined)).toBeNull();
  });

  it('computes discount only when MRP is higher', () => {
    expect(discountPercent(399, 599)).toBe(33);
    expect(discountPercent(599, 599)).toBeNull();
    expect(discountPercent(undefined, 599)).toBeNull();
  });

  it('formats distances', () => {
    expect(formatDistance(0.26)).toBe('250 m');
    expect(formatDistance(0.01)).toBe('50 m');
    expect(formatDistance(3.46)).toBe('3.5 km');
    expect(formatDistance(12.6)).toBe('13 km');
    expect(formatDistance(undefined)).toBeNull();
  });

  it('labels fresh items', () => {
    const now = Date.parse('2026-09-26T10:00:00Z');
    expect(freshness('2026-09-26T02:00:00Z', now)).toBe('New today');
    expect(freshness('2026-09-25T02:00:00Z', now)).toBe('New');
    expect(freshness('2026-09-10T02:00:00Z', now)).toBeNull();
  });

  it('formats custom detail values', () => {
    expect(formatDetailValue(true)).toBe('Yes');
    expect(formatDetailValue(['Cotton', 'Linen'])).toBe('Cotton, Linen');
    expect(formatDetailValue({})).toBeNull();
    expect(formatDetailValue('')).toBeNull();
  });

  it('makes shop initials and phone labels', () => {
    expect(initials('Zari & Thread')).toBe('ZT');
    expect(initials('kapda')).toBe('K');
    expect(formatPhoneForDisplay('+919826012345')).toBe('+91 98260 12345');
  });

  it('only offers directions for shared addresses', () => {
    expect(directionsUrl({ storeId: 's', name: 'X' })).toBeNull();
    expect(directionsUrl({ storeId: 's', name: 'X', mapsUrl: 'https://maps' , latitude: 1, longitude: 2 })).toMatch(/1,2/);
  });
});
