import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import {
  accentColors,
  accentLabels,
  ACCENTS,
  baseColors,
  modeLabels,
  resolveMode,
  textSizeLabels,
  textSizeScale,
  type AppearanceMode,
  type TextSize,
} from '@/theme/tokens';

const MODES: AppearanceMode[] = ['system', 'light', 'dark', 'amoled', 'eyeComfort'];
const MODE_HINTS: Record<AppearanceMode, string> = {
  system: 'Follows your phone',
  light: 'Bright and clear',
  dark: 'Soft dark for evenings',
  amoled: 'Pure black, saves battery',
  eyeComfort: 'Warm, low blue light',
};
const SIZES: TextSize[] = ['small', 'default', 'large', 'xlarge'];

export default function Appearance() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, radius } = theme;
  const haptics = useHaptics();
  const scheme = useColorScheme();
  const appearance = useSettings((s) => s.appearance);
  const set = useSettings((s) => s.setAppearance);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))} />
      </View>
      <Text variant="headline" accessibilityRole="header">
        Appearance
      </Text>
      <Text variant="bodyLarge" tone="muted">
        Changes apply straight away and stay on this phone.
      </Text>

      <Section title="Mode">
        <View style={styles.modes} accessibilityRole="radiogroup">
          {MODES.map((m) => {
            const resolved = resolveMode(m, scheme);
            const b = baseColors[resolved];
            const a = accentColors[resolved][appearance.accent];
            const selected = appearance.mode === m;
            return (
              <PressableScale
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${modeLabels[m]}. ${MODE_HINTS[m]}`}
                haptic="select"
                onPress={() => set({ mode: m })}
                style={[
                  styles.mode,
                  { borderRadius: radius.card, borderColor: selected ? colors.accent : colors.border, borderWidth: selected ? 2 : 1, backgroundColor: colors.surface },
                ]}
              >
                <View style={[styles.preview, { backgroundColor: b.bg, borderRadius: radius.control, borderColor: b.border }]}>
                  <View style={[styles.previewCard, { backgroundColor: b.surface, borderColor: b.border }]}>
                    <View style={[styles.previewPhoto, { backgroundColor: b.surfaceSunken }]} />
                    <View style={[styles.previewLine, { backgroundColor: b.text, width: '80%' }]} />
                    <View style={[styles.previewLine, { backgroundColor: b.textMuted, width: '55%' }]} />
                  </View>
                  <View style={[styles.previewDot, { backgroundColor: a.accent }]} />
                  {m === 'system' ? (
                    <View style={[styles.split, { backgroundColor: baseColors.dark.bg }]} />
                  ) : null}
                </View>
                <View style={styles.modeText}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {modeLabels[m]}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {MODE_HINTS[m]}
                  </Text>
                </View>
                {selected ? (
                  <View style={[styles.check, { backgroundColor: colors.accent }]}>
                    <Icon name="checkmark" size={14} color="accentText" />
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      </Section>

      <Section title="Accent colour">
        <View style={styles.accents} accessibilityRole="radiogroup">
          {ACCENTS.map((name) => {
            const selected = appearance.accent === name;
            const c = accentColors[theme.mode][name];
            return (
              <PressableScale
                key={name}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={accentLabels[name]}
                haptic="select"
                onPress={() => set({ accent: name })}
                style={styles.accent}
              >
                <View style={[styles.swatchRing, { borderColor: selected ? c.accent : 'transparent' }]}>
                  <View style={[styles.swatch, { backgroundColor: c.accent }]}>
                    {selected ? <Icon name="checkmark" size={20} color="accentText" /> : null}
                  </View>
                </View>
                <Text variant="caption" tone={selected ? 'default' : 'muted'} weight={selected ? '700' : '500'} align="center" numberOfLines={2}>
                  {accentLabels[name]}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </Section>

      <Section title="Text size">
        <View style={[styles.segment, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control + 4 }]} accessibilityRole="radiogroup">
          {SIZES.map((s) => {
            const selected = appearance.textSize === s;
            return (
              <PressableScale
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${textSizeLabels[s]} text`}
                haptic="select"
                onPress={() => set({ textSize: s })}
                style={[styles.segmentItem, { borderRadius: radius.control, backgroundColor: selected ? colors.surfaceRaised : 'transparent' }]}
              >
                <Text weight="700" style={{ fontSize: Math.round(15 * textSizeScale[s]) }} tone={selected ? 'default' : 'muted'}>
                  Aa
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <View style={[styles.sample, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
          <Text variant="caption" tone="muted" uppercase>
            Kapda Basics
          </Text>
          <Text variant="label">Essential cotton crew tee</Text>
          <Text variant="body" tone="muted">
            {textSizeLabels[appearance.textSize]} text. Your phone’s own text size applies on top.
          </Text>
        </View>
      </Section>

      <Section title="Motion and feel">
        <View style={[styles.toggles, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
          <ToggleRow
            label="Reduce motion"
            hint={appearance.reduceMotion === 'on' ? 'Always on' : 'Follows your phone’s setting'}
            value={appearance.reduceMotion === 'on'}
            onChange={(v) => set({ reduceMotion: v ? 'on' : 'system' })}
          />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <ToggleRow
            label="Haptics"
            hint="Gentle taps when you save, select and confirm"
            value={appearance.haptics}
            onChange={(v) => {
              set({ haptics: v });
              if (v) haptics.tap();
            }}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" tone="muted" uppercase weight="700" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.fill}>
        <Text variant="bodyLarge" weight="600">
          {label}
        </Text>
        <Text variant="body" tone="muted">
          {hint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.accent, false: colors.borderStrong }}
        thumbColor={colors.surfaceRaised}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
  bar: { marginLeft: -4, flexDirection: 'row' },
  section: { gap: 10, marginTop: 14 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mode: { width: '48%', flexGrow: 1, padding: 10, gap: 10, minHeight: 48 },
  preview: { height: 86, borderWidth: 1, padding: 10, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end' },
  previewCard: { width: 58, padding: 5, gap: 4, borderRadius: 8, borderWidth: 1 },
  previewPhoto: { height: 26, borderRadius: 5 },
  previewLine: { height: 4, borderRadius: 2 },
  previewDot: { width: 18, height: 18, borderRadius: 9, marginLeft: 'auto' },
  split: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', opacity: 0.9 },
  modeText: { gap: 1 },
  check: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  accents: { flexDirection: 'row', justifyContent: 'space-between' },
  accent: { alignItems: 'center', gap: 6, width: '19%', minHeight: 48 },
  swatchRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  sample: { padding: 14, gap: 4, borderWidth: StyleSheet.hairlineWidth },
  toggles: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
  sep: { height: StyleSheet.hairlineWidth },
});
