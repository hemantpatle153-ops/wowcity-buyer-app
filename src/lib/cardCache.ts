import type { ProductCard } from '@/api/types';

/**
 * Cards the buyer tapped, so the detail screen can paint the same photo, name
 * and price instantly (shared-element style) while the full detail loads.
 */
const cache = new Map<string, ProductCard>();

export const cardKey = (storeId: string, productId: string) => `${storeId}/${productId}`;

export function rememberCard(card: ProductCard) {
  cache.set(cardKey(card.storeId, card.productId), card);
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
}

export function recallCard(storeId: string, productId: string): ProductCard | undefined {
  return cache.get(cardKey(storeId, productId));
}
