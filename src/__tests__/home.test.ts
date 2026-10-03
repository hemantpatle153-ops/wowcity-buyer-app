import type { ProductCard } from '@/api/types';
import { coverPhotos, maxDiscount, orderCategories, plural, railCategories } from '@/features/home';

const card = (p: Partial<ProductCard>): ProductCard => ({ productId: 'p', storeId: 's', inStock: true, image: null, store: { storeId: 's', name: 'S' }, ...p });

describe('home page helpers', () => {
  it('picks featured categories that exist nearby, in featured order', () => {
    expect(railCategories(['Jeans', 'hoodie', 'Saree', 'Socks', 'Kurta'])).toEqual(['Saree', 'Kurta', 'Jeans']);
  });

  it('remembers the first photo per category and per shop', () => {
    const { byCategory, byShop } = coverPhotos([
      card({ productId: 'a', category: 'Saree', image: null }),
      card({ productId: 'b', category: 'Saree', image: 'x.jpg', storeId: 's1' }),
      card({ productId: 'c', category: 'saree', image: 'y.jpg', storeId: 's1' }),
    ]);
    expect(byCategory.get('saree')).toBe('x.jpg');
    expect(byShop.get('s1')).toBe('x.jpg');
  });

  it('orders the category strip: featured with photos first', () => {
    const photos = new Map([['blazer', '1'], ['saree', '2'], ['kurta', '3']]);
    expect(orderCategories(['Blazer', 'Socks', 'Kurta', 'Saree', 'Belt'], photos)).toEqual(['Saree', 'Kurta', 'Blazer', 'Belt', 'Socks']);
  });

  it('finds the best in-stock discount and pluralises names', () => {
    expect(maxDiscount([card({ price: 800, mrp: 1000 }), card({ price: 500, mrp: 1000, inStock: false }), card({ price: 1000, mrp: 1000 })])).toBe(20);
    expect(maxDiscount([card({ price: 990, mrp: 1000 })])).toBeNull();
    expect([plural('Saree'), plural('Jeans'), plural('Sherwani'), plural('Kids Wear')]).toEqual(['Sarees', 'Jeans', 'Sherwanis', 'Kids Wear']);
  });
});
