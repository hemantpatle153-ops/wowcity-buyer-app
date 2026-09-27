import { create } from 'zustand';

import type { User } from '@/api/types';

export type PendingSave = { storeId: string; productId: string };

type AuthState = {
  /** 'unknown' until the stored refresh token has been checked on launch. */
  status: 'unknown' | 'signedOut' | 'signedIn';
  user: User | null;
  /** A save the buyer tapped while signed out; completed right after sign-in. */
  pendingSave: PendingSave | null;
  setUser: (user: User | null) => void;
  setPendingSave: (p: PendingSave | null) => void;
};

export const useAuth = create<AuthState>()((set) => ({
  status: 'unknown',
  user: null,
  pendingSave: null,
  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
  setPendingSave: (pendingSave) => set({ pendingSave }),
}));
