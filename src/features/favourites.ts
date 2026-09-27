import { ApiError } from '@/api/client';
import type { Endpoints } from '@/api/endpoints';
import type { PendingSave } from '@/state/auth';
import { favKey, useSaved } from '@/state/saved';

export type SaveTarget = { storeId: string; productId: string };
export type SaveOutcome = 'saved' | 'removed' | 'not_listed' | 'failed' | 'signed_out';

type Deps = { api: Pick<Endpoints, 'setFavourite' | 'favourites'> };

/** Loads every saved product key (the API caps favourites at 500). */
export async function loadAllFavouriteKeys({ api }: Deps): Promise<string[]> {
  const keys: string[] = [];
  for (let page = 1; page <= 25; page++) {
    const res = await api.favourites({ page });
    keys.push(...res.items.map((i) => favKey(i.storeId, i.productId)));
    if (res.items.length === 0 || page * res.pageSize >= res.total) break;
  }
  useSaved.getState().replaceAll(keys);
  return keys;
}

/** Optimistically flips the heart, then confirms with the server; reverts on failure. */
export async function setFavourite({ api }: Deps, target: SaveTarget, saved: boolean): Promise<SaveOutcome> {
  const key = favKey(target.storeId, target.productId);
  const store = useSaved.getState();
  const before = !!store.keys[key];
  store.setSaved(key, saved);
  try {
    const res = await api.setFavourite(target.storeId, target.productId, saved);
    useSaved.getState().setSaved(key, res.saved);
    return res.saved ? 'saved' : 'removed';
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      useSaved.getState().setSaved(key, false);
      return 'not_listed';
    }
    useSaved.getState().setSaved(key, before);
    if (e instanceof ApiError && e.status === 401) return 'signed_out';
    return 'failed';
  }
}

/** After sign-in: sync saved keys, then finish the save that asked the buyer to sign in. */
export async function completePendingSave(deps: Deps, pending: PendingSave | null): Promise<SaveOutcome | null> {
  try {
    await loadAllFavouriteKeys(deps);
  } catch {
    // Not fatal: hearts will sync when the Saved tab loads.
  }
  if (!pending) return null;
  return setFavourite(deps, pending, true);
}
