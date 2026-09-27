const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatPrice(rupees: number): string {
  return `₹${inr.format(rupees)}`;
}

/** "₹399" or "₹399 – ₹449" when sizes differ in price. */
export function formatPriceRange(price?: number, maxPrice?: number): string | null {
  if (price === undefined) return null;
  if (maxPrice !== undefined && maxPrice > price) return `${formatPrice(price)} – ${formatPrice(maxPrice)}`;
  return formatPrice(price);
}

export function discountPercent(price?: number, mrp?: number): number | null {
  if (price === undefined || mrp === undefined || mrp <= price) return null;
  const pct = Math.round(((mrp - price) / mrp) * 100);
  return pct >= 1 ? pct : null;
}

export function formatDistance(km?: number): string | null {
  if (km === undefined || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Short freshness label for recently listed items, or null when older than a week. */
export function freshness(publishedAt?: string, now = Date.now()): string | null {
  if (!publishedAt) return null;
  const t = Date.parse(publishedAt);
  if (!Number.isFinite(t)) return null;
  const days = (now - t) / 86_400_000;
  if (days < 1) return 'New today';
  if (days < 2) return 'New';
  return null;
}

/** Human value for a custom detail row (booleans become Yes/No, arrays are joined). */
export function formatDetailValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const parts = value.map(formatDetailValue).filter((v): v is string => !!v);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? '?').toUpperCase() + (words[1]?.[0] ?? '').toUpperCase();
}

export function formatPhoneForDisplay(phone: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
