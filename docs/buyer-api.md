# WowCity buyer API (`/api/v1/public`)

The buyer app shows clothing that nearby shops have listed, then the buyer walks in to buy. It never sees cost, supplier, exact stock counts, customers or anything from the shop's books. Each shop decides which fields buyers see: name, brand, category, size, colour, style, MRP and price. A field the shop turned off is simply missing from the JSON.

## Conventions

- Base URL: `https://<server>/api/v1/public`.
- Success returns `{ "data": … }`. Failure returns `{ "error": { "code", "message" } }`; `message` is safe to show.
- Browsing needs no sign-in. Favourites and the profile need `Authorization: Bearer <accessToken>` from the buyer sign-in below.
- Status codes: 400/422 bad input, 401 sign in again, 404 not found or no longer listed, 429 slow down.
- Location is `lat` and `lng` (decimal degrees). Without them, pass `city`, or results are not filtered by distance.
- Images are full HTTPS URLs; they can be cached.

## Types

```ts
type Store = {
  storeId: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;      // only if the shop shares its address
  phone?: string;        // only if the shop shares its phone
  latitude?: number;     // only if the shop shares its address
  longitude?: number;
  mapsUrl?: string;      // Google Maps link, when the address is shared
  distanceKm?: number;   // when lat/lng were sent
};

type ProductCard = {
  productId: string;
  storeId: string;
  name?: string;
  brand?: string;
  category?: string;
  price?: number;        // lowest price among sizes in stock (rupees)
  maxPrice?: number;     // present when sizes have different prices
  mrp?: number;
  sizes?: string[];      // sizes currently in stock
  colours?: string[];    // colours currently in stock
  inStock: boolean;      // false = listed but sold out at this shop
  image: string | null;  // main photo URL
  publishedAt?: string;
  store: Store;
};

type ProductDetail = {
  productId: string;
  storeId: string;
  name?: string; brand?: string; category?: string; description?: string;
  inStock: boolean;
  images: string[];
  variants: Array<{ variantId: string; size?: string; colour?: string; style?: string; price?: number; mrp?: number; inStock: boolean }>;
  tags?: string[];
  details?: Array<{ label: string; value: unknown }>;   // extra fields the shop chose to show (fabric, fit…)
  store: Store;
};

type StoreSummary = Store & { listedProducts: number; inStockProducts: number };
```

## Browse (no sign-in)

| Method | Path | Query / body | Returns |
|---|---|---|---|
| GET | `/search` | `lat, lng, radiusKm (default 10, max 100), city, storeId, q, category, brand, size, colour, minPrice, maxPrice, inStockOnly (true/false), sort (nearest \| newest \| price_low \| price_high), page (1-based)` | `{ total, page, pageSize: 24, items: ProductCard[] }` |
| GET | `/products/{storeId}/{productId}` | `lat, lng` | `ProductDetail` (404 when no longer listed) |
| GET | `/stores` | `lat, lng, radiusKm, city, q` | `StoreSummary[]`, nearest first |
| GET | `/stores/{storeId}` | `lat, lng` | `StoreSummary`; list its products with `/search?storeId=` |
| GET | `/filters` | `lat, lng, radiusKm, city` | `{ categories, brands, sizes, colours }` available nearby, for filter chips |

Browsing is limited to 120 requests a minute per network.

## Buyer sign-in (email or mobile, 6-digit code)

A buyer account is created automatically the first time a code is verified.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/otp/request` | `{ identifier }` (email, or mobile; 10-digit Indian numbers get +91) | `{ sentTo, channel: "email" \| "sms" }` |
| POST | `/auth/otp/verify` | `{ identifier, code }` | `{ accessToken, refreshToken, expiresIn, user }` |
| POST | `/auth/refresh` | `{ refreshToken }` | new `{ accessToken, refreshToken, expiresIn, user }`; the old refresh token stops working |
| POST | `/auth/logout` | bearer | `{ signedOut: true }` |

`user` is `{ id, email?, phone?, name? }`. The access token lasts about an hour; refresh when a call returns 401, and sign in again if refresh fails. Keep the refresh token in secure storage.

## Signed-in buyer (bearer)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/me` | — | `user` |
| PATCH | `/me` | `{ name }` | `user` |
| GET | `/favourites` | query `lat, lng, page` | `{ total, page, pageSize, items: ProductCard[] }` (only products still listed) |
| PUT | `/favourites` | `{ storeId, productId, saved: boolean }` | `{ saved }` (404 `not_listed` if the product was unlisted; max 500) |
| DELETE | `/account` | — | `{ deleted: true }`: removes favourites and the buyer login (store requirement) |
