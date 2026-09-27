import { buildQuery, joinUrl, type QueryValue } from './params';

export type HttpResponse = { status: number; ok: boolean; json(): Promise<unknown> };
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<HttpResponse>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export type AuthHooks = {
  getAccessToken: () => string | null;
  /** Refreshes the session; resolves to a new access token or null if the buyer must sign in again. */
  refreshAccessToken: () => Promise<string | null>;
};

export type RequestOptions = {
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Sends the bearer token and retries once after a refresh on 401. */
  auth?: boolean;
};

export type ApiClient = {
  request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, opts?: RequestOptions): Promise<T>;
};

const FRIENDLY: Record<number, string> = {
  401: 'Please sign in again.',
  404: 'This is no longer listed.',
  429: 'You are going a little fast. Please try again in a moment.',
};

export function createApiClient(opts: { baseUrl: string; fetch: FetchLike; auth?: AuthHooks }): ApiClient {
  async function send(method: string, path: string, ro: RequestOptions, token: string | null) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (ro.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = joinUrl(opts.baseUrl, path) + buildQuery(ro.query);
    try {
      return await opts.fetch(url, {
        method,
        headers,
        body: ro.body === undefined ? undefined : JSON.stringify(ro.body),
      });
    } catch {
      throw new ApiError(0, 'network', 'You appear to be offline. Check your connection and try again.');
    }
  }

  async function parse<T>(res: HttpResponse): Promise<T> {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (res.ok) {
      if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: T }).data;
      }
      throw new ApiError(res.status, 'bad_response', 'Something went wrong. Please try again.');
    }
    const err =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error: { code?: string; message?: string } }).error
        : undefined;
    throw new ApiError(
      res.status,
      err?.code ?? `http_${res.status}`,
      err?.message ?? FRIENDLY[res.status] ?? 'Something went wrong. Please try again.',
    );
  }

  return {
    async request<T>(method: string, path: string, ro: RequestOptions = {}) {
      const token = ro.auth ? (opts.auth?.getAccessToken() ?? null) : null;
      if (ro.auth && !token && opts.auth) {
        // No access token in memory (e.g. app just opened): try the refresh token first.
        const fresh = await opts.auth.refreshAccessToken();
        if (!fresh) throw new ApiError(401, 'unauthorized', FRIENDLY[401]);
        return parse<T>(await send(method, path, ro, fresh));
      }
      const res = await send(method, path, ro, token);
      if (res.status === 401 && ro.auth && opts.auth) {
        const fresh = await opts.auth.refreshAccessToken();
        if (!fresh) throw new ApiError(401, 'unauthorized', FRIENDLY[401]);
        return parse<T>(await send(method, path, ro, fresh));
      }
      return parse<T>(res);
    },
  } as ApiClient;
}
