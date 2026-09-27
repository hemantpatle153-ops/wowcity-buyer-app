import { screen } from '@testing-library/react-native';

import type { ProductCard } from '@/api/types';
import { ProductCardView, productA11yLabel } from '@/components/ProductCard';
import { renderWithProviders } from '@/test-utils';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const base: ProductCard = {
  productId: 'p1',
  storeId: 's1',
  name: 'Essential cotton crew tee',
  brand: 'Kapda Basics',
  price: 399,
  maxPrice: 449,
  mrp: 599,
  inStock: true,
  image: 'https://example.com/a.jpg',
  store: { storeId: 's1', name: 'Kapda Ghar', distanceKm: 1.04 },
};

function renderCard(item: ProductCard) {
  return renderWithProviders(<ProductCardView item={item} />);
}

describe('ProductCardView', () => {
  it('shows name, brand, price range, MRP, discount, shop and distance', async () => {
    await renderCard(base);
    expect(screen.getByText('Essential cotton crew tee')).toBeTruthy();
    expect(screen.getByText('Kapda Basics')).toBeTruthy();
    expect(screen.getByText('₹399 – ₹449')).toBeTruthy();
    expect(screen.getByText('₹599')).toBeTruthy();
    expect(screen.getByText('33% off')).toBeTruthy();
    expect(screen.getByText('Kapda Ghar')).toBeTruthy();
    expect(screen.getByText('1.0 km')).toBeTruthy();
    expect(screen.queryByText('Sold out at this shop')).toBeNull();
  });

  it('marks sold-out items and never shows a stock count', async () => {
    await renderCard({ ...base, inStock: false });
    expect(screen.getByText('Sold out at this shop')).toBeTruthy();
    expect(screen.queryByText(/\d+ left|only \d+/i)).toBeNull();
  });

  it('treats missing fields as hidden by the shop', async () => {
    await renderCard({ ...base, brand: undefined, price: undefined, maxPrice: undefined, mrp: undefined });
    expect(screen.queryByText('Kapda Basics')).toBeNull();
    expect(screen.getByText('Price in shop')).toBeTruthy();
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it('has a heart button labelled for screen readers', async () => {
    await renderCard(base);
    expect(screen.getByLabelText('Save Essential cotton crew tee')).toBeTruthy();
  });

  it('builds a complete accessibility label', () => {
    expect(productA11yLabel({ ...base, inStock: false })).toBe(
      'Essential cotton crew tee, Kapda Basics, ₹399 – ₹449, MRP ₹599, at Kapda Ghar, 1.0 km away, Sold out at this shop',
    );
  });
});
