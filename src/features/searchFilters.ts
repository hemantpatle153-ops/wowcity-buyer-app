import type { SearchQuery, SortOption } from '@/api/types';

export type SearchFilters = {
  category?: string;
  brand?: string;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  sort?: SortOption;
};

export const emptyFilters: SearchFilters = { inStockOnly: false };

export const SORT_LABELS: Record<SortOption, string> = {
  nearest: 'Nearest',
  newest: 'Newest',
  price_low: 'Price: low to high',
  price_high: 'Price: high to low',
};

export const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ₹500', max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000 },
];

/** Number of filters the buyer has set (sort doesn't count). */
export function activeFilterCount(f: SearchFilters): number {
  return (
    [f.category, f.brand, f.size, f.colour].filter(Boolean).length +
    (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
    (f.inStockOnly ? 1 : 0)
  );
}

export function priceLabel(min?: number, max?: number): string | null {
  const preset = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
  if (preset) return preset.label;
  if (min !== undefined && max !== undefined) return `₹${min} – ₹${max}`;
  if (min !== undefined) return `Over ₹${min}`;
  if (max !== undefined) return `Under ₹${max}`;
  return null;
}

/** Query params for /search from the text box and filters. */
export function toSearchQuery(q: string, f: SearchFilters): Omit<SearchQuery, 'page'> {
  return {
    q: q.trim() || undefined,
    category: f.category,
    brand: f.brand,
    size: f.size,
    colour: f.colour,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
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
