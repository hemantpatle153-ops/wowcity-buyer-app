import type { ApiClient } from './client';
import type {
  AssistantAnswer,
  AssistantAskBody,
  Filters,
  LocationQuery,
  OtpRequestResult,
  Page,
  ProductCard,
  ProductDetail,
  SearchQuery,
  Session,
  StoreSummary,
  User,
} from './types';

export function createEndpoints(client: ApiClient) {
  const enc = encodeURIComponent;
  return {
    search: (q: SearchQuery) => client.request<Page<ProductCard>>('GET', '/search', { query: q }),
    product: (storeId: string, productId: string, loc: Pick<LocationQuery, 'lat' | 'lng'> = {}) =>
      client.request<ProductDetail>('GET', `/products/${enc(storeId)}/${enc(productId)}`, {
        query: { lat: loc.lat, lng: loc.lng },
      }),
    stores: (q: LocationQuery & { q?: string }) => client.request<StoreSummary[]>('GET', '/stores', { query: q }),
    store: (storeId: string, loc: Pick<LocationQuery, 'lat' | 'lng'> = {}) =>
      client.request<StoreSummary>('GET', `/stores/${enc(storeId)}`, { query: { lat: loc.lat, lng: loc.lng } }),
    filters: (q: LocationQuery) => client.request<Filters>('GET', '/filters', { query: q }),

    requestOtp: (identifier: string) =>
      client.request<OtpRequestResult>('POST', '/auth/otp/request', { body: { identifier } }),
    verifyOtp: (identifier: string, code: string) =>
      client.request<Session>('POST', '/auth/otp/verify', { body: { identifier, code } }),
    refresh: (refreshToken: string) => client.request<Session>('POST', '/auth/refresh', { body: { refreshToken } }),
    logout: () => client.request<{ signedOut: true }>('POST', '/auth/logout', { auth: true }),

    me: () => client.request<User>('GET', '/me', { auth: true }),
    updateMe: (patch: { name: string }) => client.request<User>('PATCH', '/me', { auth: true, body: patch }),
    favourites: (q: Pick<LocationQuery, 'lat' | 'lng'> & { page?: number }) =>
      client.request<Page<ProductCard>>('GET', '/favourites', { auth: true, query: q }),
    setFavourite: (storeId: string, productId: string, saved: boolean) =>
      client.request<{ saved: boolean }>('PUT', '/favourites', { auth: true, body: { storeId, productId, saved } }),
    /** Signed-in shoppers send their token so the daily allowance follows the account. */
    askAssistant: (body: AssistantAskBody, signedIn: boolean) =>
      client.request<AssistantAnswer>('POST', '/assistant', { body, auth: signedIn }),
    deleteAccount: () => client.request<{ deleted: true }>('DELETE', '/account', { auth: true }),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
