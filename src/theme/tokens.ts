/**
 * The one place raw colours live. Components read semantic tokens through
 * `useTheme()` and never use hex values directly (see docs/design.md).
 */
export type AppearanceMode = 'system' | 'light' | 'dark' | 'amoled' | 'eyeComfort';
export type ResolvedMode = Exclude<AppearanceMode, 'system'>;
export type AccentName = 'wow' | 'blue' | 'emerald' | 'violet' | 'saffron' | 'rose';
export type TextSize = 'small' | 'default' | 'large' | 'xlarge';

export const RESOLVED_MODES: ResolvedMode[] = ['light', 'dark', 'amoled', 'eyeComfort'];
export const ACCENTS: AccentName[] = ['wow', 'blue', 'emerald', 'violet', 'saffron', 'rose'];

export type BaseColors = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  /** Skeletons, image placeholders, input fills. */
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Always-dark text/icon colour for use on top of photos with a light chip. */
  onPhoto: string;
  /** Light chip placed over photos. */
  photoChip: string;
  /** Filled heart on page surfaces, and on a photo chip. */
  heart: string;
  heartOnPhoto: string;
  scrim: string;
  shadow: string;
};

export type AccentColors = {
  accent: string;
  /** Text/icons drawn on an `accent` fill. */
  accentText: string;
  /** Tinted background for selected chips; `accent` text sits on it. */
  accentSoft: string;
};

export type ColorTokens = BaseColors & AccentColors;

export const baseColors: Record<ResolvedMode, BaseColors> = {
  light: {
    bg: '#FAF9F7',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#EFEDE9',
    border: '#E6E3DE',
    borderStrong: '#CFCAC2',
    text: '#1C1A17',
    textMuted: '#5F5A52',
    success: '#1B7A3E',
    warning: '#8A5A00',
    danger: '#B3261E',
    info: '#1F5FA8',
    onPhoto: '#1C1A17',
    photoChip: '#FFFFFFE6',
    heart: '#D0304F',
    heartOnPhoto: '#D0304F',
    scrim: '#0000008C',
    shadow: '#1C1A17',
  },
  dark: {
    bg: '#15171A',
    surface: '#1D2024',
    surfaceRaised: '#25292E',
    surfaceSunken: '#23272B',
    border: '#2C3036',
    borderStrong: '#3C424A',
    text: '#ECEDEE',
    textMuted: '#A4A9B0',
    success: '#5CD08A',
    warning: '#F2B84B',
    danger: '#FF8A80',
    info: '#7DB4FF',
    onPhoto: '#1C1A17',
    photoChip: '#FFFFFFE0',
    heart: '#FF6F8E',
    heartOnPhoto: '#C8284A',
    scrim: '#000000A6',
    shadow: '#000000',
  },
  amoled: {
    bg: '#000000',
    surface: '#0D0D0F',
    surfaceRaised: '#161619',
    surfaceSunken: '#141417',
    border: '#1F1F23',
    borderStrong: '#34343A',
    text: '#E6E6E6',
    textMuted: '#9C9CA3',
    success: '#5CD08A',
    warning: '#F2B84B',
    danger: '#FF8A80',
    info: '#7DB4FF',
    onPhoto: '#1C1A17',
    photoChip: '#F2F2F2E0',
    heart: '#FF6F8E',
    heartOnPhoto: '#C8284A',
    scrim: '#000000BF',
    shadow: '#000000',
  },
  eyeComfort: {
    bg: '#F4ECD8',
    surface: '#FBF5E6',
    surfaceRaised: '#FBF5E6',
    surfaceSunken: '#EADFC6',
    border: '#E2D5B8',
    borderStrong: '#CBBB98',
    text: '#3B3024',
    textMuted: '#65573F',
    success: '#3E6B2C',
    warning: '#7D5410',
    danger: '#9E3526',
    info: '#3F5A86',
    onPhoto: '#3B3024',
    photoChip: '#FBF5E6E6',
    heart: '#A8384C',
    heartOnPhoto: '#A8384C',
    scrim: '#2A20158C',
    shadow: '#3B3024',
  },
};

/** Accent shades tuned per mode; each passes 4.5:1 as text on bg/surface. */
export const accentColors: Record<ResolvedMode, Record<AccentName, AccentColors>> = {
  light: {
    wow: { accent: '#C8204F', accentText: '#FFFFFF', accentSoft: '#FDE8EF' },
    blue: { accent: '#1F5FD1', accentText: '#FFFFFF', accentSoft: '#E6EEFB' },
    emerald: { accent: '#0B7250', accentText: '#FFFFFF', accentSoft: '#E1F2EB' },
    violet: { accent: '#6A3BD1', accentText: '#FFFFFF', accentSoft: '#EEE8FB' },
    saffron: { accent: '#9C4A00', accentText: '#FFFFFF', accentSoft: '#FBEBDC' },
    rose: { accent: '#BB2350', accentText: '#FFFFFF', accentSoft: '#FBE6EC' },
  },
  dark: {
    wow: { accent: '#FF7AA2', accentText: '#2A0A16', accentSoft: '#3A1E2A' },
    blue: { accent: '#82AEFF', accentText: '#0B1A33', accentSoft: '#1E2C45' },
    emerald: { accent: '#4FD19C', accentText: '#062519', accentSoft: '#173529' },
    violet: { accent: '#BBA1FF', accentText: '#1D1240', accentSoft: '#2C2545' },
    saffron: { accent: '#FFB45E', accentText: '#2E1A00', accentSoft: '#3A2C1B' },
    rose: { accent: '#FF93AB', accentText: '#3A0A18', accentSoft: '#40242C' },
  },
  amoled: {
    wow: { accent: '#FF7AA2', accentText: '#2A0A16', accentSoft: '#2A1019' },
    blue: { accent: '#82AEFF', accentText: '#0B1A33', accentSoft: '#101C33' },
    emerald: { accent: '#4FD19C', accentText: '#062519', accentSoft: '#0B241A' },
    violet: { accent: '#BBA1FF', accentText: '#1D1240', accentSoft: '#1C1633' },
    saffron: { accent: '#FFB45E', accentText: '#2E1A00', accentSoft: '#2B1D0C' },
    rose: { accent: '#FF93AB', accentText: '#3A0A18', accentSoft: '#2E1219' },
  },
  eyeComfort: {
    wow: { accent: '#A12C4C', accentText: '#FBF5E6', accentSoft: '#F2D9CF' },
    blue: { accent: '#34568F', accentText: '#FBF5E6', accentSoft: '#E5E0CF' },
    emerald: { accent: '#2D6448', accentText: '#FBF5E6', accentSoft: '#DFE3C8' },
    violet: { accent: '#644289', accentText: '#FBF5E6', accentSoft: '#E8DCCB' },
    saffron: { accent: '#8A4A0E', accentText: '#FBF5E6', accentSoft: '#F0DDBB' },
    rose: { accent: '#983448', accentText: '#FBF5E6', accentSoft: '#F0D9C6' },
  },
};

export const accentLabels: Record<AccentName, string> = {
  wow: 'WowCity',
  blue: 'Blue',
  emerald: 'Emerald',
  violet: 'Violet',
  saffron: 'Saffron',
  rose: 'Rose',
};

export const modeLabels: Record<AppearanceMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  amoled: 'AMOLED Black',
  eyeComfort: 'Eye Comfort',
};

export const textSizeScale: Record<TextSize, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
  xlarge: 1.3,
};

export const textSizeLabels: Record<TextSize, string> = {
  small: 'Small',
  default: 'Default',
  large: 'Large',
  xlarge: 'Extra large',
};

/** 4-pt spacing scale. */
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;
export const radius = { control: 10, card: 16, sheet: 24, pill: 999 } as const;
export const minTouch = 48;

export const typeScale = {
  caption: { size: 12, line: 16, weight: '500' },
  body: { size: 14, line: 20, weight: '400' },
  bodyStrong: { size: 14, line: 20, weight: '600' },
  label: { size: 16, line: 22, weight: '600' },
  bodyLarge: { size: 16, line: 24, weight: '400' },
  subtitle: { size: 18, line: 24, weight: '600' },
  title: { size: 22, line: 28, weight: '700' },
  headline: { size: 28, line: 34, weight: '700' },
  display: { size: 34, line: 40, weight: '800' },
} as const;
export type TypeVariant = keyof typeof typeScale;

export function resolveMode(mode: AppearanceMode, systemScheme: string | null | undefined): ResolvedMode {
  if (mode !== 'system') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function buildColors(mode: ResolvedMode, accent: AccentName): ColorTokens {
  return { ...baseColors[mode], ...accentColors[mode][accent] };
}

export function isDarkMode(mode: ResolvedMode): boolean {
  return mode === 'dark' || mode === 'amoled';
}
