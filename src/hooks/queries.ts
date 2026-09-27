import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from '@/api';
import type { Page, ProductCard, SearchQuery } from '@/api/types';
import { recallCard } from '@/lib/cardCache';
import { useAuth } from '@/state/auth';
import { locationParams, useSettings } from '@/state/settings';

/** Current location + radius as API params (lat/lng or city). */
export function useLocationQuery() {
  const location = useSettings((s) => s.location);
  const radiusKm = useSettings((s) => s.radiusKm);
  return locationParams(location, radiusKm);
}

export function useCoords() {
  const location = useSettings((s) => s.location);
  return location?.kind === 'gps' ? { lat: location.lat, lng: location.lng } : {};
}

export function nextPage<T>(last: Page<T>): number | undefined {
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

export function flattenPages<T>(pages: Page<T>[] | undefined): T[] {
  if (!pages) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of pages)
    for (const item of p.items) {
      const k = JSON.stringify([(item as ProductCard).storeId, (item as ProductCard).productId]);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
  return out;
}

/** Infinite product search (home feed, search results, shop products). */
export function useSearchFeed(
  query: Omit<SearchQuery, 'page'>,
  opts: { enabled?: boolean; /** 'coords' sends only lat/lng (distances), not the radius filter. */ scope?: 'area' | 'coords' } = {},
) {
  const loc = useLocationQuery();
  const coords = useCoords();
  const params = { ...(opts.scope === 'coords' ? coords : loc), ...query };
  return useInfiniteQuery({
    queryKey: ['search', params],
    queryFn: ({ pageParam }) => api.search({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
    enabled: opts.enabled ?? true,
  });
}

export function useProduct(storeId: string, productId: string) {
  const coords = useCoords();
  return useQuery({
    queryKey: ['product', storeId, productId, coords],
    queryFn: () => api.product(storeId, productId, coords),
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

/** The card the buyer tapped (if any), used to paint the detail screen instantly. */
export function useCardPreview(storeId: string, productId: string) {
  return recallCard(storeId, productId);
}

export function useStores(q?: string) {
  const loc = useLocationQuery();
  const params = { ...loc, q: q || undefined };
  return useQuery({ queryKey: ['stores', params], queryFn: () => api.stores(params), placeholderData: keepPreviousData });
}

export function useStore(storeId: string) {
  const coords = useCoords();
  return useQuery({
    queryKey: ['store', storeId, coords],
    queryFn: () => api.store(storeId, coords),
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

export function useFilters() {
  const loc = useLocationQuery();
  return useQuery({ queryKey: ['filters', loc], queryFn: () => api.filters(loc), staleTime: 10 * 60_000 });
}

export function useFavourites() {
  const signedIn = useAuth((s) => s.status === 'signedIn');
  const coords = useCoords();
  return useInfiniteQuery({
    queryKey: ['favourites', coords],
    queryFn: ({ pageParam }) => api.favourites({ ...coords, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: signedIn,
  });
}
