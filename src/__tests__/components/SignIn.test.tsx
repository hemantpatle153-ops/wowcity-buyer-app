import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import SignIn from '@/app/sign-in';
import { useAuth } from '@/state/auth';
import { favKey, useSaved } from '@/state/saved';
import { useToast } from '@/state/toast';
import { renderWithProviders } from '@/test-utils';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true } }));
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

beforeEach(() => {
  jest.mocked(router.back).mockClear();
  useSaved.getState().clear();
  useAuth.setState({ status: 'signedOut', user: null, pendingSave: null });
});

describe('Sign in screen', () => {
  it('validates the identifier before sending', async () => {
    await renderWithProviders(<SignIn />);
    await fireEvent.changeText(screen.getByTestId('identifier-input'), '12345');
    await fireEvent.press(screen.getByTestId('send-code'));
    expect(await screen.findByText('Enter a 10-digit mobile number.')).toBeTruthy();
  });

  it('signs in with a mobile code and completes the save that asked for it', async () => {
    const target = { storeId: 'st_zari', productId: 'p_zt_saree' };
    useAuth.getState().setPendingSave(target);
    await renderWithProviders(<SignIn />);
    expect(screen.getByText('Sign in to save')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('identifier-input'), '98765 43210');
    await fireEvent.press(screen.getByTestId('send-code'));
    expect(await screen.findByText('Enter the code', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('+91 •••••3210')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('6-digit code'), '123456');
    await waitFor(() => expect(router.back).toHaveBeenCalled(), { timeout: 5000 });
    expect(useAuth.getState().status).toBe('signedIn');
    expect(useAuth.getState().pendingSave).toBeNull();
    expect(useSaved.getState().keys[favKey(target.storeId, target.productId)]).toBe(true);
    expect(useToast.getState().current?.message).toBe('Signed in and saved');
  });

  it('shows the wrong-code message and clears the boxes', async () => {
    await renderWithProviders(<SignIn />);
    await fireEvent.changeText(screen.getByTestId('identifier-input'), 'buyer@wowcity.in');
    await fireEvent.press(screen.getByTestId('send-code'));
    await screen.findByText('Enter the code', {}, { timeout: 3000 });
    await fireEvent.changeText(screen.getByLabelText('6-digit code'), '000000');
    expect(await screen.findByText('That code is not right. Check it and try again.', {}, { timeout: 3000 })).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });
});
