import { contrastRatio, withAlpha } from '@/theme/contrast';
import {
  ACCENTS,
  accentColors,
  baseColors,
  buildColors,
  RESOLVED_MODES,
  resolveMode,
  textSizeScale,
} from '@/theme/tokens';

const solid = (hex: string) => hex.slice(0, 7);

describe('theme tokens', () => {
  it('matches the design-doc surfaces', () => {
    expect(baseColors.light.bg).toBe('#FAF9F7');
    expect(baseColors.light.surface).toBe('#FFFFFF');
    expect(baseColors.dark.bg).toBe('#15171A');
    expect(baseColors.dark.surface).toBe('#1D2024');
    expect(baseColors.amoled.bg).toBe('#000000');
    expect(baseColors.eyeComfort.bg).toBe('#F4ECD8');
    expect(baseColors.eyeComfort.text).toBe('#3B3024');
  });

  it('never uses a pure white page background', () => {
    for (const m of RESOLVED_MODES) expect(baseColors[m].bg).not.toBe('#FFFFFF');
  });

  describe.each(RESOLVED_MODES)('%s mode', (mode) => {
    const b = baseColors[mode];
    const surfaces = [b.bg, b.surface, b.surfaceRaised, b.surfaceSunken];

    it.each(['text', 'textMuted', 'success', 'warning', 'danger', 'info'] as const)(
      '%s passes 4.5:1 on every surface',
      (token) => {
        for (const s of surfaces) expect(contrastRatio(b[token], s)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it.each(ACCENTS)('%s accent passes 4.5:1 as text and as a fill', (accent) => {
      const a = accentColors[mode][accent];
      for (const s of [b.bg, b.surface, b.surfaceRaised]) expect(contrastRatio(a.accent, s)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.accentText, a.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.accent, a.accentSoft)).toBeGreaterThanOrEqual(4.5);
    });

    it('photo chips keep their text readable', () => {
      expect(contrastRatio(b.onPhoto, solid(b.photoChip))).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('resolves System mode from the phone setting', () => {
    expect(resolveMode('system', 'dark')).toBe('dark');
    expect(resolveMode('system', 'light')).toBe('light');
    expect(resolveMode('system', null)).toBe('light');
    expect(resolveMode('amoled', 'light')).toBe('amoled');
  });

  it('builds a full token set for every mode and accent', () => {
    for (const m of RESOLVED_MODES)
      for (const a of ACCENTS) {
        const c = buildColors(m, a);
        for (const v of Object.values(c)) expect(v).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/i);
      }
  });

  it('scales text monotonically', () => {
    expect(textSizeScale.small).toBeLessThan(textSizeScale.default);
    expect(textSizeScale.large).toBeLessThan(textSizeScale.xlarge);
  });

  it('withAlpha appends an alpha byte', () => {
    expect(withAlpha('#000000', 0.5)).toBe('#00000080');
  });
});
