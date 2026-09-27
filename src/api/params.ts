export type QueryValue = string | number | boolean | null | undefined;

/**
 * Builds a query string from a flat object. Skips undefined, null, empty
 * strings and non-finite numbers; booleans become "true"/"false". Keys are
 * sorted so equal inputs always produce equal strings (stable cache keys).
 */
export function buildQuery(params: Record<string, QueryValue> | undefined): string {
  if (!params) return '';
  const parts: string[] = [];
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    const str = typeof value === 'string' ? value.trim() : String(value);
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(str)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Parses a query string (with or without leading "?") into a plain object. */
export function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = query.startsWith('?') ? query.slice(1) : query;
  if (!q) return out;
  for (const pair of q.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
  }
  return out;
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
