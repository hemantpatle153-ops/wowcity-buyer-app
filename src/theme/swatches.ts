/**
 * Display swatches for colour names that shops use. Purely decorative (the
 * colour name is always shown as text too); unknown names get no swatch.
 */
const SWATCHES: Record<string, string> = {
  black: '#1B1B1B',
  white: '#F7F7F5',
  ivory: '#F3EEDD',
  cream: '#EFE6CF',
  beige: '#D9C7A7',
  camel: '#B68A55',
  brown: '#6E4B32',
  rust: '#A5482A',
  orange: '#E8762C',
  tangerine: '#F08A2E',
  mustard: '#D6A21E',
  yellow: '#F2CF3A',
  olive: '#6B6B32',
  sage: '#9CAF88',
  green: '#2F8F4E',
  teal: '#1F7A7A',
  navy: '#1F2A4D',
  blue: '#3C6FD1',
  'light blue': '#A9C6E8',
  'mid blue': '#5E82B3',
  indigo: '#2D3A6B',
  'dark indigo': '#232C4E',
  'raw indigo': '#1E2748',
  lavender: '#B6A6D8',
  purple: '#6A3D8F',
  'purple & gold': '#6A3D8F',
  wine: '#6B1F33',
  maroon: '#6E1E2B',
  red: '#C8283A',
  scarlet: '#D3202F',
  pink: '#EFA3B8',
  'blush pink': '#EDBFC0',
  grey: '#8E8E8E',
  gray: '#8E8E8E',
};

export function swatchFor(colour: string): string | undefined {
  return SWATCHES[colour.trim().toLowerCase()];
}
