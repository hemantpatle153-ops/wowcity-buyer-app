import { Linking, Platform } from 'react-native';

import type { Store } from '@/api/types';

/** Directions are only possible when the shop shares its address. */
export function canGetDirections(store: Store) {
  return !!store.mapsUrl || (store.latitude !== undefined && store.longitude !== undefined);
}

export function directionsUrl(store: Store): string | null {
  if (store.latitude !== undefined && store.longitude !== undefined) {
    const label = encodeURIComponent(store.name);
    const ll = `${store.latitude},${store.longitude}`;
    if (Platform.OS === 'ios') return `maps://?daddr=${ll}&q=${label}`;
    if (Platform.OS === 'android') return `geo:0,0?q=${ll}(${label})`;
  }
  return store.mapsUrl ?? null;
}

export async function openDirections(store: Store) {
  const url = directionsUrl(store);
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    if (store.mapsUrl) await Linking.openURL(store.mapsUrl);
  }
}

export async function callShop(phone: string) {
  await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
}
