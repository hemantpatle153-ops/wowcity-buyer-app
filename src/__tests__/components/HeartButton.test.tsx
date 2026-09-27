import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { api, session } from '@/api';
import { HeartButton } from '@/components/HeartButton';
import { useAuth } from '@/state/auth';
import { favKey, useSaved } from '@/state/saved';
import { renderWithProviders } from '@/test-utils';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-secure-store', () => {
  let v: string | null = null;
  return {
    AFTER_FIRST_UNLOCK: 0,
    getItemAsync: jest.fn(async () => v),
    setItemAsync: jest.fn(async (_k: string, value: string) => {
      v = value;
    }),
    deleteItemAsync: jest.fn(async () => {
      v = null;
    }),
  };
});

const target = { storeId: 'st_kapdaghar', productId: 'p_kg_crewtee' };

beforeEach(() => {
  jest.mocked(router.push).mockClear();
  useSaved.getState().clear();
  useAuth.setState({ status: 'signedOut', user: null, pendingSave: null });
});

describe('HeartButton', () => {
  it('asks a signed-out buyer to sign in and remembers the save', async () => {
    await renderWithProviders(<HeartButton {...target} name="Crew tee" />);
    await fireEvent.press(screen.getByLabelText('Save Crew tee'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/sign-in'));
    expect(useAuth.getState().pendingSave).toEqual(target);
    expect(useSaved.getState().keys).toEqual({});
  });

  it('saves straight away when signed in, and the label flips', async () => {
    await session.setSession(await api.verifyOtp('buyer@wowcity.in', '123456'));
    await renderWithProviders(<HeartButton {...target} name="Crew tee" />);
    await fireEvent.press(screen.getByLabelText('Save Crew tee'));
    expect(await screen.findByLabelText('Remove Crew tee from saved')).toBeTruthy();
    await waitFor(() => expect(useSaved.getState().keys[favKey(target.storeId, target.productId)]).toBe(true));
    expect(router.push).not.toHaveBeenCalled();
  });
});
