import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/theme/ThemeProvider';

/** Renders with the app's theme and a fresh query client (no retries). */
export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
}
