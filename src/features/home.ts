import type { ProductCard } from '@/api/types';
import { discountPercent } from '@/lib/format';

/** Categories shown as their own rows on Home, in this order, when shops nearby have them. */
export const FEATURED_CATEGORIES = ['Saree', 'Lehenga', 'Kurta', 'Kurti', 'Jeans', 'Dress', 'Sherwani', 'Hoodie', 'Blazer', 'Jacket', 'T-shirt'];

/** Up to `max` featured categories that exist nearby (case-insensitive), in featured order. */
export function railCategories(available: string[], max = 3): string[] {
  const lower = new Map(available.map((c) => [c.toLowerCase(), c]));
  return FEATURED_CATEGORIES.map((c) => lower.get(c.toLowerCase())).filter((c): c is string => !!c).slice(0, max);
}

/** First photo seen per category and per shop, from whatever product lists are already loaded. */
export function coverPhotos(items: ProductCard[]) {
  const byCategory = new Map<string, string>();
  const byShop = new Map<string, string>();
  for (const item of items) {
    if (!item.image) continue;
    if (item.category && !byCategory.has(item.category.toLowerCase())) byCategory.set(item.category.toLowerCase(), item.image);
    if (!byShop.has(item.storeId)) byShop.set(item.storeId, item.image);
  }
  return { byCategory, byShop };
}

/** Biggest discount among in-stock items, for the "up to N% off" banner. */
export function maxDiscount(items: ProductCard[]): number | null {
  let best = 0;
  for (const i of items) best = Math.max(best, i.inStock ? (discountPercent(i.price, i.mrp) ?? 0) : 0);
  return best >= 5 ? best : null;
}

/** Featured categories first (sarees, lehengas…), then others with a photo, then the rest, so the strip looks full. */
export function orderCategories(categories: string[], photos: Map<string, string>): string[] {
  const featured = (c: string) => {
    const i = FEATURED_CATEGORIES.findIndex((f) => f.toLowerCase() === c.toLowerCase());
    return i < 0 ? FEATURED_CATEGORIES.length : i;
  };
  const rank = (c: string) => (photos.has(c.toLowerCase()) ? 0 : 1);
  return [...categories].sort((a, b) => rank(a) - rank(b) || featured(a) - featured(b) || a.localeCompare(b));
}

export function plural(category: string): string {
  if (/s$/i.test(category) || /wear$/i.test(category)) return category;
  if (/sh$|ch$/i.test(category)) return `${category}es`;
  return `${category}s`;
}
