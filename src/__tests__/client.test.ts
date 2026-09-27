import { ApiError, createApiClient, type FetchLike, type HttpResponse } from '@/api/client';
import { createEndpoints } from '@/api/endpoints';

function res(status: number, payload: unknown): HttpResponse {
  return { status, ok: status >= 200 && status < 300, json: async () => payload };
}

describe('api client', () => {
  it('builds the URL with query and unwraps data', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => res(200, { data: { total: 0, page: 1, pageSize: 24, items: [] } }));
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in/api/v1/public/', fetch }));
    const out = await api.search({ lat: 23.2, lng: 77.4, radiusKm: 5, q: 'jeans', inStockOnly: true, page: 2 });
    expect(out.total).toBe(0);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://x.in/api/v1/public/search?inStockOnly=true&lat=23.2&lng=77.4&page=2&q=jeans&radiusKm=5');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('encodes path segments', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => res(200, { data: {} }));
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in', fetch }));
    await api.product('st/1', 'p 2', { lat: 1, lng: 2 });
    expect(fetch.mock.calls[0][0]).toBe('https://x.in/products/st%2F1/p%202?lat=1&lng=2');
  });

  it('sends JSON bodies', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => res(200, { data: { sentTo: 'x', channel: 'sms' } }));
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in', fetch }));
    await api.requestOtp('9876543210');
    const init = fetch.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body!)).toEqual({ identifier: '9876543210' });
  });

  it('throws ApiError with the server message', async () => {
    const fetch: FetchLike = async () => res(422, { error: { code: 'invalid_code', message: 'Wrong code' } });
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in', fetch }));
    await expect(api.verifyOtp('a@b.in', '111111')).rejects.toMatchObject({
      status: 422,
      code: 'invalid_code',
      message: 'Wrong code',
    });
  });

  it('uses a friendly message when the error body is missing', async () => {
    const fetch: FetchLike = async () => res(429, null);
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in', fetch }));
    const err = await api.filters({}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toMatch(/moment/);
  });

  it('maps network failures to status 0', async () => {
    const fetch: FetchLike = async () => {
      throw new TypeError('Network request failed');
    };
    const api = createEndpoints(createApiClient({ baseUrl: 'https://x.in', fetch }));
    const err: ApiError = await api.stores({}).catch((e) => e);
    expect(err.isNetwork).toBe(true);
  });

  it('adds the bearer token on authed calls', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => res(200, { data: { id: 'u1' } }));
    const api = createEndpoints(
      createApiClient({
        baseUrl: 'https://x.in',
        fetch,
        auth: { getAccessToken: () => 'tok', refreshAccessToken: async () => null },
      }),
    );
    await api.me();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('refreshes on 401 and retries once with the new token', async () => {
    let token = 'old';
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async (_url, init) =>
      init.headers.Authorization === 'Bearer new' ? res(200, { data: { id: 'u1' } }) : res(401, null),
    );
    const refresh = jest.fn(async () => {
      token = 'new';
      return token;
    });
    const api = createEndpoints(
      createApiClient({ baseUrl: 'https://x.in', fetch, auth: { getAccessToken: () => token, refreshAccessToken: refresh } }),
    );
    await expect(api.me()).resolves.toEqual({ id: 'u1' });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up with 401 when refresh fails', async () => {
    const fetch: FetchLike = async () => res(401, null);
    const api = createEndpoints(
      createApiClient({
        baseUrl: 'https://x.in',
        fetch,
        auth: { getAccessToken: () => 'old', refreshAccessToken: async () => null },
      }),
    );
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
  });

  it('refreshes first when there is no access token in memory', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => res(200, { data: { id: 'u1' } }));
    const refresh = jest.fn(async () => 'fresh');
    const api = createEndpoints(
      createApiClient({ baseUrl: 'https://x.in', fetch, auth: { getAccessToken: () => null, refreshAccessToken: refresh } }),
    );
    await api.me();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer fresh');
  });
});
