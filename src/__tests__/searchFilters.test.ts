import { buildQuery } from '@/api/params';
import { activeFilterCount, parsePriceInput, priceLabel, toSearchQuery } from '@/features/searchFilters';
import { addRecent } from '@/state/recentSearches';

describe('search filters → query params', () => {
  it('omits empty values so the URL stays clean', () => {
    expect(buildQuery(toSearchQuery('  ', { inStockOnly: false }))).toBe('');
  });

  it('includes every set filter', () => {
    const q = toSearchQuery(' red kurta ', {
      category: 'Ethnic wear',
      brand: 'Zari & Thread',
      size: 'M',
      colour: 'Red',
      minPrice: 500,
      maxPrice: 1000,
      inStockOnly: true,
      sort: 'price_low',
    });
    expect(buildQuery(q)).toBe(
      '?brand=Zari%20%26%20Thread&category=Ethnic%20wear&colour=Red&inStockOnly=true&maxPrice=1000&minPrice=500&q=red%20kurta&size=M&sort=price_low',
    );
  });

  it('counts active filters (price range counts once, sort not at all)', () => {
    expect(activeFilterCount({ inStockOnly: false, sort: 'newest' })).toBe(0);
    expect(activeFilterCount({ inStockOnly: true, minPrice: 1, maxPrice: 2, size: 'L' })).toBe(3);
  });

  it('labels price ranges', () => {
    expect(priceLabel(undefined, 500)).toBe('Under ₹500');
    expect(priceLabel(700, undefined)).toBe('Over ₹700');
    expect(priceLabel(100, 200)).toBe('₹100 – ₹200');
    expect(priceLabel()).toBeNull();
  });

  it('parses typed prices', () => {
    expect(parsePriceInput('₹ 1,200')).toBe(1200);
    expect(parsePriceInput('abc')).toBeUndefined();
  });
});

describe('recent searches', () => {
  it('dedupes case-insensitively, most recent first, max 10', () => {
    let list: string[] = [];
    for (let i = 0; i < 12; i++) list = addRecent(list, `q${i}`);
    expect(list).toHaveLength(10);
    expect(list[0]).toBe('q11');
    list = addRecent(list, 'Q5');
    expect(list[0]).toBe('Q5');
    expect(list.filter((x) => x.toLowerCase() === 'q5')).toHaveLength(1);
    expect(addRecent(list, '   ')).toBe(list);
  });
});
