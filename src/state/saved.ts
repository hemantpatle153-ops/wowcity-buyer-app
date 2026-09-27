import { create } from 'zustand';

export function favKey(storeId: string, productId: string) {
  return `${storeId}/${productId}`;
}

type SavedState = {
  keys: Record<string, true>;
  setSaved: (key: string, saved: boolean) => void;
  replaceAll: (keys: string[]) => void;
  clear: () => void;
};

/** Which products the buyer has saved, for heart state on every card. */
export const useSaved = create<SavedState>()((set) => ({
  keys: {},
  setSaved: (key, saved) =>
    set((s) => {
      const keys = { ...s.keys };
      if (saved) keys[key] = true;
      else delete keys[key];
      return { keys };
    }),
  replaceAll: (list) => set({ keys: Object.fromEntries(list.map((k) => [k, true as const])) }),
  clear: () => set({ keys: {} }),
}));

export function useIsSaved(storeId: string, productId: string) {
  return useSaved((s) => !!s.keys[favKey(storeId, productId)]);
}
