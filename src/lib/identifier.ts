const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the server: email, or mobile (10-digit Indian numbers get +91). */
export function normaliseIdentifier(raw: string): { value: string; channel: 'email' | 'sms' } | null {
  const v = raw.trim();
  if (EMAIL.test(v)) return { value: v.toLowerCase(), channel: 'email' };
  const digits = v.replace(/[\s()-]/g, '');
  if (/^0?[6-9]\d{9}$/.test(digits)) return { value: `+91${digits.slice(-10)}`, channel: 'sms' };
  if (/^\+91[6-9]\d{9}$/.test(digits)) return { value: digits, channel: 'sms' };
  if (/^\+\d{8,15}$/.test(digits)) return { value: digits, channel: 'sms' };
  return null;
}

export function looksLikePhone(raw: string) {
  return /^[+\d][\d\s()-]*$/.test(raw.trim());
}
