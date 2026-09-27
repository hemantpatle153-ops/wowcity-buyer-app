// Mirrors docs/buyer-api.md exactly. Optional fields are ones a shop can hide.

export type Store = {
  storeId: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;
  distanceKm?: number;
};

export type ProductCard = {
  productId: string;
  storeId: string;
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  maxPrice?: number;
  mrp?: number;
  sizes?: string[];
  colours?: string[];
  inStock: boolean;
  image: string | null;
  publishedAt?: string;
  store: Store;
};

export type Variant = {
  variantId: string;
  size?: string;
  colour?: string;
  style?: string;
  price?: number;
  mrp?: number;
  inStock: boolean;
};

export type ProductDetail = {
  productId: string;
  storeId: string;
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  inStock: boolean;
  images: string[];
  variants: Variant[];
  tags?: string[];
  details?: { label: string; value: unknown }[];
  store: Store;
};

export type StoreSummary = Store & { listedProducts: number; inStockProducts: number };

export type Page<T> = { total: number; page: number; pageSize: number; items: T[] };

export type Filters = { categories: string[]; brands: string[]; sizes: string[]; colours: string[] };

export type SortOption = 'nearest' | 'newest' | 'price_low' | 'price_high';

export type LocationQuery = { lat?: number; lng?: number; radiusKm?: number; city?: string };

export type SearchQuery = LocationQuery & {
  storeId?: string;
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  page?: number;
};

export type User = { id: string; email?: string; phone?: string; name?: string };

export type OtpRequestResult = { sentTo: string; channel: 'email' | 'sms' };

export type Session = { accessToken: string; refreshToken: string; expiresIn: number; user: User };
