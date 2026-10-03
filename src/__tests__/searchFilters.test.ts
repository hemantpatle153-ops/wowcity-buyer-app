import { buildQuery } from '@/api/params';
import { activeFilterCount, emptyFilters, filtersFromLink, parsePriceInput, priceLabel, toggleValue, toSearchQuery } from '@/features/searchFilters';
import { addRecent } from '@/state/recentSearches';

describe('search filters → query params', () => {
  it('omits empty values so the URL stays clean', () => {
    expect(buildQuery(toSearchQuery('  ', emptyFilters))).toBe('');
  });

  it('includes every set filter', () => {
    const q = toSearchQuery(' red kurta ', {
      categories: ['Ethnic wear'],
      brands: ['Zari & Thread'],
      sizes: ['M', 'L'],
      colours: ['Red', 'Maroon'],
      shops: ['s1', 's2'],
      minPrice: 500,
      maxPrice: 1000,
      minDiscount: 20,
      inStockOnly: true,
      sort: 'discount',
    });
    expect(buildQuery(q)).toBe(
      '?brand=Zari%20%26%20Thread&category=Ethnic%20wear&colour=Red%2CMaroon&inStockOnly=true&maxPrice=1000&minDiscount=20&minPrice=500&q=red%20kurta&size=M%2CL&sort=discount&storeIds=s1%2Cs2',
    );
  });

  it('counts active filters (price range counts once, sort not at all)', () => {
    expect(activeFilterCount({ ...emptyFilters, sort: 'newest' })).toBe(0);
    expect(activeFilterCount({ ...emptyFilters, inStockOnly: true, minPrice: 1, maxPrice: 2, sizes: ['L', 'XL'], minDiscount: 10 })).toBe(4);
  });

  it('toggles multi-select values and reads Home links', () => {
    expect(toggleValue(['M'], 'L')).toEqual(['M', 'L']);
    expect(toggleValue(['M', 'L'], 'M')).toEqual(['L']);
    expect(filtersFromLink({ category: 'Lehenga', inStockOnly: '1', maxPrice: '999', sort: 'discount', size: 'M,L' })).toEqual({
      ...emptyFilters,
      categories: ['Lehenga'],
      sizes: ['M', 'L'],
      maxPrice: 999,
      inStockOnly: true,
      sort: 'discount',
    });
    expect(filtersFromLink({ sort: 'bogus', maxPrice: '-5' })).toEqual(emptyFilters);
  });

  it('labels price ranges', () => {
    expect(priceLabel(undefined, 500)).toBe('Under ₹500');
    expect(priceLabel(700, undefined)).toBe('Over ₹700');
    expect(priceLabel(100, 2000)).toBe('₹100 – ₹2,000');
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
