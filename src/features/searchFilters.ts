import type { SearchQuery, SortOption } from '@/api/types';

/** Filters on the Search screen. List filters are multi-select: any of the picked values matches. */
export type SearchFilters = {
  categories: string[];
  brands: string[];
  sizes: string[];
  colours: string[];
  /** Shop ids. */
  shops: string[];
  minPrice?: number;
  maxPrice?: number;
  /** Minimum % off MRP. */
  minDiscount?: number;
  inStockOnly: boolean;
  sort?: SortOption;
};

export type ListFilterKey = 'categories' | 'brands' | 'sizes' | 'colours' | 'shops';

export const emptyFilters: SearchFilters = { categories: [], brands: [], sizes: [], colours: [], shops: [], inStockOnly: false };

export const SORT_LABELS: Record<SortOption, string> = {
  nearest: 'Nearest first',
  newest: 'Newest first',
  price_low: 'Price: low to high',
  price_high: 'Price: high to low',
  discount: 'Biggest discount',
};

export const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ₹500', max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: 'Over ₹10,000', min: 10000 },
];

export const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50];

/** Toggles one value in a list filter. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Number of filter groups in use (sort doesn't count). */
export function activeFilterCount(f: SearchFilters): number {
  return (
    [f.categories, f.brands, f.sizes, f.colours, f.shops].filter((l) => l.length > 0).length +
    (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
    (f.minDiscount ? 1 : 0) +
    (f.inStockOnly ? 1 : 0)
  );
}

export function priceLabel(min?: number, max?: number): string | null {
  const preset = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
  if (preset) return preset.label;
  const r = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min !== undefined && max !== undefined) return `${r(min)} – ${r(max)}`;
  if (min !== undefined) return `Over ${r(min)}`;
  if (max !== undefined) return `Under ${r(max)}`;
  return null;
}

const joined = (list: string[]) => (list.length ? list.join(',') : undefined);

/** Query params for /search from the text box and filters. */
export function toSearchQuery(q: string, f: SearchFilters): Omit<SearchQuery, 'page'> {
  return {
    q: q.trim() || undefined,
    category: joined(f.categories),
    brand: joined(f.brands),
    size: joined(f.sizes),
    colour: joined(f.colours),
    storeIds: joined(f.shops),
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    minDiscount: f.minDiscount || undefined,
    inStockOnly: f.inStockOnly || undefined,
    sort: f.sort,
  };
}

/** Parses a user-typed price ("1,200", "₹ 800") into whole rupees. */
export function parsePriceInput(s: string): number | undefined {
  const digits = s.replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : undefined;
}

const SORTS: SortOption[] = ['nearest', 'newest', 'price_low', 'price_high', 'discount'];
const listOf = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const positive = (v?: string) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : undefined);

export type SearchLinkParams = Partial<
  Record<'q' | 'category' | 'brand' | 'size' | 'colour' | 'inStockOnly' | 'sort' | 'minPrice' | 'maxPrice' | 'minDiscount', string>
>;

/** Filters from a link into Search (Home banners, category tiles, "See all"). */
export function filtersFromLink(p: SearchLinkParams): SearchFilters {
  return {
    ...emptyFilters,
    categories: listOf(p.category),
    brands: listOf(p.brand),
    sizes: listOf(p.size),
    colours: listOf(p.colour),
    minPrice: positive(p.minPrice),
    maxPrice: positive(p.maxPrice),
    minDiscount: positive(p.minDiscount),
    inStockOnly: p.inStockOnly === '1',
    sort: SORTS.includes(p.sort as SortOption) ? (p.sort as SortOption) : undefined,
  };
}
