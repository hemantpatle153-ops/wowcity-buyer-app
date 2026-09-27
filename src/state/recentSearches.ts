import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX = 10;

type RecentState = {
  items: string[];
  add: (q: string) => void;
  remove: (q: string) => void;
  clear: () => void;
};

export function addRecent(list: string[], q: string): string[] {
  const term = q.trim().replace(/\s+/g, ' ');
  if (!term) return list;
  return [term, ...list.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, MAX);
}

/** Recent searches, kept on this device only. */
export const useRecentSearches = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      add: (q) => set((s) => ({ items: addRecent(s.items, q) })),
      remove: (q) => set((s) => ({ items: s.items.filter((x) => x !== q) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'wowcity.recentSearches', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
