import { fireEvent, screen } from '@testing-library/react-native';

import { FilterSheet } from '@/components/FilterSheet';
import { emptyFilters } from '@/features/searchFilters';
import { renderWithProviders } from '@/test-utils';

const options = {
  categories: ['Dresses', 'Jeans'],
  brands: ["Levi's", 'Raahi'],
  sizes: ['30', '32', 'M'],
  colours: ['Black', 'Indigo'],
};

describe('FilterSheet', () => {
  it('shows the nearby options from /filters and applies the chosen ones', async () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    await renderWithProviders(
      <FilterSheet visible onClose={onClose} value={{ ...emptyFilters, sort: 'newest' }} onApply={onApply} options={options} />,
    );
    await fireEvent.press(screen.getByText('Jeans'));
    await fireEvent.press(screen.getByLabelText('Size 32'));
    await fireEvent.press(screen.getByText('Indigo'));
    await fireEvent.press(screen.getByText('₹1,000 – ₹2,500'));
    await fireEvent(screen.getByLabelText('In stock only'), 'valueChange', true);
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenCalledWith({
      category: 'Jeans',
      size: '32',
      colour: 'Indigo',
      minPrice: 1000,
      maxPrice: 2500,
      inStockOnly: true,
      sort: 'newest',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('tapping a selected chip again clears it, and Clear all keeps the sort', async () => {
    const onApply = jest.fn();
    await renderWithProviders(
      <FilterSheet
        visible
        onClose={jest.fn()}
        value={{ inStockOnly: true, category: 'Dresses', brand: 'Raahi', sort: 'price_low' }}
        onApply={onApply}
        options={options}
      />,
    );
    await fireEvent.press(screen.getByText('Dresses'));
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenLastCalledWith(expect.objectContaining({ category: undefined, brand: 'Raahi' }));
    await fireEvent.press(screen.getByText('Clear all'));
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenLastCalledWith({ inStockOnly: false, sort: 'price_low', minPrice: undefined, maxPrice: undefined });
  });
});
