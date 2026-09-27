import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import type { Filters } from '@/api/types';
import {
  emptyFilters,
  parsePriceInput,
  PRICE_PRESETS,
  type SearchFilters,
} from '@/features/searchFilters';
import { useTheme } from '@/theme/ThemeProvider';
import { swatchFor } from '@/theme/swatches';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Chip } from './Chip';
import { Text } from './Text';

export function FilterSheet({
  visible,
  onClose,
  value,
  onApply,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  value: SearchFilters;
  onApply: (f: SearchFilters) => void;
  options?: Filters;
}) {
  const { colors, radius, textScale } = useTheme();
  const [draft, setDraft] = useState<SearchFilters>(value);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  // Start each opening from the applied filters.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(value);
      setMinText(value.minPrice?.toString() ?? '');
      setMaxText(value.maxPrice?.toString() ?? '');
    }
  }

  const set = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = <K extends 'category' | 'brand' | 'size' | 'colour'>(key: K, v: string) =>
    set({ [key]: draft[key] === v ? undefined : v } as Partial<SearchFilters>);

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.surfaceSunken,
      borderRadius: radius.control,
      fontSize: Math.round(16 * textScale),
    },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      testID="filter-sheet"
      footer={
        <>
          <Button
            label="Clear all"
            variant="secondary"
            style={styles.flex}
            onPress={() => {
              setDraft({ ...emptyFilters, sort: draft.sort });
              setMinText('');
              setMaxText('');
            }}
          />
          <Button
            label="Show results"
            style={styles.flex2}
            onPress={() => {
              onApply({ ...draft, minPrice: parsePriceInput(minText), maxPrice: parsePriceInput(maxText) });
              onClose();
            }}
          />
        </>
      }
    >
      <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
        <View style={styles.flex}>
          <Text variant="label">In stock only</Text>
          <Text variant="body" tone="muted">
            Hide items sold out at the shop
          </Text>
        </View>
        <Switch
          value={draft.inStockOnly}
          onValueChange={(v) => set({ inStockOnly: v })}
          trackColor={{ true: colors.accent, false: colors.borderStrong }}
          thumbColor={colors.surfaceRaised}
          accessibilityLabel="In stock only"
        />
      </View>

      {options?.categories.length ? (
        <Section title="Category">
          {options.categories.map((c) => (
            <Chip key={c} label={c} selected={draft.category === c} onPress={() => toggle('category', c)} />
          ))}
        </Section>
      ) : null}

      {options?.sizes.length ? (
        <Section title="Size">
          {options.sizes.map((s) => (
            <Chip key={s} label={s} selected={draft.size === s} onPress={() => toggle('size', s)} accessibilityLabel={`Size ${s}`} />
          ))}
        </Section>
      ) : null}

      {options?.colours.length ? (
        <Section title="Colour">
          {options.colours.map((c) => (
            <Chip key={c} label={c} swatch={swatchFor(c)} selected={draft.colour === c} onPress={() => toggle('colour', c)} />
          ))}
        </Section>
      ) : null}

      <Section title="Price">
        {PRICE_PRESETS.map((p) => {
          const selected = parsePriceInput(minText) === p.min && parsePriceInput(maxText) === p.max;
          return (
            <Chip
              key={p.label}
              label={p.label}
              selected={selected}
              onPress={() => {
                setMinText(selected ? '' : (p.min?.toString() ?? ''));
                setMaxText(selected ? '' : (p.max?.toString() ?? ''));
              }}
            />
          );
        })}
        <View style={styles.priceInputs}>
          <TextInput
            value={minText}
            onChangeText={setMinText}
            placeholder="Min ₹"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Minimum price in rupees"
            style={inputStyle}
          />
          <Text tone="muted">to</Text>
          <TextInput
            value={maxText}
            onChangeText={setMaxText}
            placeholder="Max ₹"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Maximum price in rupees"
            style={inputStyle}
          />
        </View>
      </Section>

      {options?.brands.length ? (
        <Section title="Brand">
          {options.brands.map((b) => (
            <Chip key={b} label={b} selected={draft.brand === b} onPress={() => toggle('brand', b)} />
          ))}
        </Section>
      ) : null}
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 8, borderWidth: StyleSheet.hairlineWidth, minHeight: 64 },
  section: { marginTop: 18 },
  sectionTitle: { marginBottom: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 8 },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14 },
});
