import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AccentName, AppearanceMode, TextSize } from '@/theme/tokens';

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];

export type UserLocation =
  | { kind: 'gps'; lat: number; lng: number; label: string }
  | { kind: 'city'; city: string };

export type Appearance = {
  mode: AppearanceMode;
  accent: AccentName;
  textSize: TextSize;
  /** 'system' follows the phone setting; 'on' forces reduced motion. */
  reduceMotion: 'system' | 'on';
  haptics: boolean;
};

export const defaultAppearance: Appearance = {
  mode: 'system',
  accent: 'blue',
  textSize: 'default',
  reduceMotion: 'system',
  haptics: true,
};

type SettingsState = {
  onboarded: boolean;
  location: UserLocation | null;
  radiusKm: RadiusKm;
  appearance: Appearance;
  hydrated: boolean;
  setLocation: (location: UserLocation | null) => void;
  setRadius: (radiusKm: RadiusKm) => void;
  completeOnboarding: () => void;
  setAppearance: (patch: Partial<Appearance>) => void;
  reset: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      location: null,
      radiusKm: 5,
      appearance: defaultAppearance,
      hydrated: false,
      setLocation: (location) => set({ location }),
      setRadius: (radiusKm) => set({ radiusKm }),
      completeOnboarding: () => set({ onboarded: true }),
      setAppearance: (patch) => set((s) => ({ appearance: { ...s.appearance, ...patch } })),
      reset: () => set({ onboarded: false, location: null, radiusKm: 5, appearance: defaultAppearance }),
    }),
    {
      name: 'wowcity.settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ onboarded, location, radiusKm, appearance }) => ({ onboarded, location, radiusKm, appearance }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return { ...current, ...p, appearance: { ...defaultAppearance, ...p.appearance } };
      },
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);

/** Location query params for the API: lat/lng when known, otherwise city. */
export function locationParams(location: UserLocation | null, radiusKm?: number) {
  if (!location) return {};
  if (location.kind === 'gps') return { lat: location.lat, lng: location.lng, radiusKm };
  return { city: location.city, radiusKm };
}

export function locationLabel(location: UserLocation | null): string {
  if (!location) return 'Set your location';
  return location.kind === 'gps' ? location.label : location.city;
}
