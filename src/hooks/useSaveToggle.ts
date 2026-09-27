import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';

import { api } from '@/api';
import { setFavourite, type SaveTarget } from '@/features/favourites';
import { useAuth } from '@/state/auth';
import { toast } from '@/state/toast';

import { useHaptics } from './useHaptics';

/**
 * Returns a function that saves/unsaves a product. Signed out, it remembers the
 * save and opens sign-in; the save is completed right after the buyer signs in.
 */
export function useSaveToggle() {
  const haptics = useHaptics();
  const qc = useQueryClient();
  return useCallback(
    async (target: SaveTarget, saved: boolean) => {
      const { status, setPendingSave } = useAuth.getState();
      if (status !== 'signedIn') {
        haptics.tap();
        setPendingSave(target);
        router.push('/sign-in');
        return;
      }
      if (saved) haptics.success();
      else haptics.tap();
      const outcome = await setFavourite({ api }, target, saved);
      qc.invalidateQueries({ queryKey: ['favourites'] });
      if (outcome === 'not_listed') toast('This item is no longer listed.', { tone: 'danger' });
      else if (outcome === 'failed') toast('Could not update Saved. Please try again.', { tone: 'danger' });
      else if (outcome === 'signed_out') {
        setPendingSave(target);
        router.push('/sign-in');
      } else if (outcome === 'removed') {
        toast('Removed from Saved', {
          action: {
            label: 'Undo',
            onPress: () => {
              setFavourite({ api }, target, true).then(() => qc.invalidateQueries({ queryKey: ['favourites'] }));
            },
          },
        });
      }
    },
    [haptics, qc],
  );
}
