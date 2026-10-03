import { fireEvent, screen } from '@testing-library/react-native';

import { FilterSheet } from '@/components/FilterSheet';
import { emptyFilters } from '@/features/searchFilters';
import { renderWithProviders } from '@/test-utils';

const options = {
  categories: ['Dresses', 'Jeans'],
  brands: ["Levi's", 'Raahi'],
  sizes: ['M', '30', '32'],
  colours: ['Black', 'Indigo'],
  priceRange: { min: 399, max: 4999 },
};

describe('FilterSheet', () => {
  it('lets you pick several values per group and applies them all', async () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    await renderWithProviders(
      <FilterSheet visible onClose={onClose} value={{ ...emptyFilters, sort: 'newest' }} onApply={onApply} options={options} />,
    );
    await fireEvent.press(screen.getByLabelText('Jeans'));
    await fireEvent.press(screen.getByLabelText('Dresses'));
    await fireEvent.press(screen.getByLabelText('Size'));
    await fireEvent.press(screen.getByLabelText('Size 32'));
    await fireEvent.press(screen.getByLabelText('Size 30'));
    await fireEvent.press(screen.getByLabelText('Colour'));
    await fireEvent.press(screen.getByText('Indigo'));
    await fireEvent.press(screen.getByLabelText('Price'));
    expect(screen.getByText('Items nearby: ₹399 – ₹4,999')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('₹1,000 – ₹2,500'));
    await fireEvent.press(screen.getByLabelText('Discount'));
    await fireEvent.press(screen.getByLabelText('30% or more'));
    await fireEvent.press(screen.getByLabelText('Availability'));
    await fireEvent(screen.getByLabelText('In stock only'), 'valueChange', true);
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenCalledWith({
      ...emptyFilters,
      categories: ['Jeans', 'Dresses'],
      sizes: ['32', '30'],
      colours: ['Indigo'],
      minPrice: 1000,
      maxPrice: 2500,
      minDiscount: 30,
      inStockOnly: true,
      sort: 'newest',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows how many are picked per group; tapping again unpicks; Clear all keeps the sort', async () => {
    const onApply = jest.fn();
    await renderWithProviders(
      <FilterSheet
        visible
        onClose={jest.fn()}
        value={{ ...emptyFilters, inStockOnly: true, categories: ['Dresses'], brands: ['Raahi'], sort: 'price_low' }}
        onApply={onApply}
        options={options}
      />,
    );
    expect(screen.getByLabelText('Category, 1 selected')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Dresses'));
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenLastCalledWith(expect.objectContaining({ categories: [], brands: ['Raahi'] }));
    await fireEvent.press(screen.getByText('Clear all'));
    await fireEvent.press(screen.getByText('Show results'));
    expect(onApply).toHaveBeenLastCalledWith({ ...emptyFilters, sort: 'price_low', minPrice: undefined, maxPrice: undefined });
  });
});
