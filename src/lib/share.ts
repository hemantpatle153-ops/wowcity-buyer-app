import { Directory, File, Paths } from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import type { ProductDetail } from '@/api/types';

import { formatPriceRange } from './format';

export function productLink(storeId: string, productId: string) {
  return Linking.createURL(`/product/${encodeURIComponent(storeId)}/${encodeURIComponent(productId)}`);
}

export function shareMessage(p: Pick<ProductDetail, 'name' | 'category' | 'store' | 'storeId' | 'productId'> & { price?: number; maxPrice?: number }) {
  const what = p.name ?? p.category ?? 'This';
  const where = [p.store.name, p.store.city].filter(Boolean).join(', ');
  const price = formatPriceRange(p.price, p.maxPrice);
  return `${what} at ${where}${price ? ` – ${price}` : ''}. Found on WowCity: ${productLink(p.storeId, p.productId)}`;
}

/** Shares a text + link (works everywhere). */
export async function shareText(message: string, url?: string) {
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator | undefined;
    if (nav?.share) {
      await nav.share({ text: message, url }).catch(() => {});
      return 'shared';
    }
    await nav?.clipboard?.writeText(message).catch(() => {});
    return 'copied';
  }
  await Share.share(Platform.OS === 'ios' && url ? { message, url } : { message });
  return 'shared';
}

/** Downloads the product photo to the cache and opens the share sheet with it (native only). */
export async function sharePhoto(imageUrl: string, name: string) {
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) return false;
  const dir = new Directory(Paths.cache, 'shared');
  if (!dir.exists) dir.create({ idempotent: true });
  const file = await File.downloadFileAsync(imageUrl, new File(dir, `${name.replace(/[^\w-]+/g, '_').slice(0, 40)}.jpg`), {
    idempotent: true,
  });
  await Sharing.shareAsync(file.uri, { mimeType: 'image/jpeg', dialogTitle: name, UTI: 'public.jpeg' });
  return true;
}
