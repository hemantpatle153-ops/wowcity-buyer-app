import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Filters, SortOption, StoreSummary } from '@/api/types';
import {
  DISCOUNT_OPTIONS,
  emptyFilters,
  parsePriceInput,
  PRICE_PRESETS,
  SORT_LABELS,
  toggleValue,
  toSearchQuery,
  type ListFilterKey,
  type SearchFilters,
} from '@/features/searchFilters';
import { useSearchFeed } from '@/hooks/queries';
import { formatDistance } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { swatchFor } from '@/theme/swatches';

import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { KeyboardSafe } from './KeyboardSafe';
import { PressableScale } from './PressableScale';
import { SearchField } from './SearchField';
import { Text } from './Text';
import { TextField } from './TextField';
import { ThemedSwitch } from './ThemedSwitch';

export type FilterGroup = 'sort' | 'category' | 'size' | 'colour' | 'price' | 'discount' | 'brand' | 'shop' | 'availability';

const SORTS: SortOption[] = ['nearest', 'newest', 'price_low', 'price_high', 'discount'];

/**
 * Full-screen filters, Flipkart style: groups on the left with how many are picked, options on the right,
 * and a live item count. Category, size, colour, brand and shop are multi-select.
 */
export function FilterSheet({
  visible,
  onClose,
  value,
  onApply,
  options,
  shops = [],
  query = '',
  canSortByDistance = true,
  initialGroup,
}: {
  visible: boolean;
  onClose: () => void;
  value: SearchFilters;
  onApply: (f: SearchFilters) => void;
  options?: Filters;
  shops?: StoreSummary[];
  /** The search text, for the live result count. */
  query?: string;
  canSortByDistance?: boolean;
  initialGroup?: FilterGroup;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<SearchFilters>(value);
  const [group, setGroup] = useState<FilterGroup>(initialGroup ?? 'category');
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  // Start each opening from the applied filters.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(value);
      setMinText(value.minPrice?.toString() ?? '');
      setMaxText(value.maxPrice?.toString() ?? '');
      setGroup(initialGroup ?? (options?.categories.length ? 'category' : 'sort'));
    }
  }

  const effective: SearchFilters = { ...draft, minPrice: parsePriceInput(minText), maxPrice: parsePriceInput(maxText) };
  const count = useSearchFeed(toSearchQuery(query, effective), { enabled: visible });
  const total = count.data?.pages[0]?.total;

  const set = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = (key: ListFilterKey, v: string) => setDraft((d) => ({ ...d, [key]: toggleValue(d[key], v) }));

  const groups: { key: FilterGroup; label: string; picked: number; show: boolean }[] = [
    { key: 'sort', label: 'Sort by', picked: draft.sort ? 1 : 0, show: true },
    { key: 'category', label: 'Category', picked: draft.categories.length, show: !!options?.categories.length },
    { key: 'size', label: 'Size', picked: draft.sizes.length, show: !!options?.sizes.length },
    { key: 'colour', label: 'Colour', picked: draft.colours.length, show: !!options?.colours.length },
    { key: 'price', label: 'Price', picked: effective.minPrice !== undefined || effective.maxPrice !== undefined ? 1 : 0, show: true },
    { key: 'discount', label: 'Discount', picked: draft.minDiscount ? 1 : 0, show: true },
    { key: 'brand', label: 'Brand', picked: draft.brands.length, show: !!options?.brands.length },
    { key: 'shop', label: 'Shop', picked: draft.shops.length, show: shops.length > 1 },
    { key: 'availability', label: 'Availability', picked: draft.inStockOnly ? 1 : 0, show: true },
  ];

  const apply = () => {
    onApply(effective);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardSafe style={[styles.fill, { backgroundColor: colors.bg, paddingTop: insets.top }]} testID="filter-sheet">
        <View style={[styles.head, { borderBottomColor: colors.border }]}>
          <IconButton icon="close" label="Close filters" variant="plain" onPress={onClose} />
          <Text variant="title" style={styles.fill} accessibilityRole="header">
            Filters
          </Text>
          <PressableScale
            onPress={() => {
              setDraft({ ...emptyFilters, sort: draft.sort });
              setMinText('');
              setMaxText('');
            }}
            accessibilityRole="button"
            style={styles.clear}
          >
            <Text variant="bodyStrong" tone="accent">
              Clear all
            </Text>
          </PressableScale>
        </View>

        <View style={[styles.fill, styles.panes]}>
          <ScrollView style={[styles.rail, { backgroundColor: colors.surfaceSunken }]}>
            {groups
              .filter((g) => g.show)
              .map((g) => {
                const on = g.key === group;
                return (
                  <PressableScale
                    key={g.key}
                    onPress={() => setGroup(g.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${g.label}${g.picked ? `, ${g.picked} selected` : ''}`}
                    scaleTo={0.98}
                    style={[styles.railItem, on ? { backgroundColor: colors.bg } : null]}
                  >
                    {on ? <View style={[styles.railMark, { backgroundColor: colors.accent }]} /> : null}
                    <Text variant="bodyStrong" tone={on ? 'accent' : 'default'} style={styles.fill}>
                      {g.label}
                    </Text>
                    {g.picked ? (
                      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                        <Text variant="caption" tone="onAccent" weight="800">
                          {g.picked}
                        </Text>
                      </View>
                    ) : null}
                  </PressableScale>
                );
              })}
          </ScrollView>

          <ScrollView style={styles.fill} contentContainerStyle={styles.pane} keyboardShouldPersistTaps="handled">
            {group === 'sort' ? (
              SORTS.filter((s) => s !== 'nearest' || canSortByDistance).map((s) => (
                <OptionRow
                  key={s}
                  label={SORT_LABELS[s]}
                  radio
                  checked={(draft.sort ?? (canSortByDistance ? 'nearest' : 'newest')) === s}
                  onPress={() => set({ sort: s })}
                />
              ))
            ) : group === 'category' ? (
              <CheckList values={options?.categories ?? []} picked={draft.categories} onToggle={(v) => toggle('categories', v)} />
            ) : group === 'size' ? (
              <View style={styles.wrap}>
                {(options?.sizes ?? []).map((s) => (
                  <Chip key={s} label={s} selected={draft.sizes.includes(s)} onPress={() => toggle('sizes', s)} accessibilityLabel={`Size ${s}`} />
                ))}
              </View>
            ) : group === 'colour' ? (
              <View style={styles.wrap}>
                {(options?.colours ?? []).map((c) => (
                  <Chip key={c} label={c} swatch={swatchFor(c)} selected={draft.colours.includes(c)} onPress={() => toggle('colours', c)} />
                ))}
              </View>
            ) : group === 'price' ? (
              <View style={styles.gap}>
                {options?.priceRange ? (
                  <Text variant="body" tone="muted">
                    Items nearby: ₹{options.priceRange.min.toLocaleString('en-IN')} – ₹{options.priceRange.max.toLocaleString('en-IN')}
                  </Text>
                ) : null}
                <View style={styles.priceInputs}>
                  <TextField
                    size="md"
                    value={minText}
                    onChangeText={setMinText}
                    placeholder="Min ₹"
                    keyboardType="number-pad"
                    accessibilityLabel="Minimum price in rupees"
                    style={styles.fill}
                  />
                  <Text tone="muted">to</Text>
                  <TextField
                    size="md"
                    value={maxText}
                    onChangeText={setMaxText}
                    placeholder="Max ₹"
                    keyboardType="number-pad"
                    accessibilityLabel="Maximum price in rupees"
                    style={styles.fill}
                  />
                </View>
                {PRICE_PRESETS.map((p) => {
                  const on = parsePriceInput(minText) === p.min && parsePriceInput(maxText) === p.max;
                  return (
                    <OptionRow
                      key={p.label}
                      label={p.label}
                      radio
                      checked={on}
                      onPress={() => {
                        setMinText(on ? '' : (p.min?.toString() ?? ''));
                        setMaxText(on ? '' : (p.max?.toString() ?? ''));
                      }}
                    />
                  );
                })}
              </View>
            ) : group === 'discount' ? (
              DISCOUNT_OPTIONS.map((d) => (
                <OptionRow
                  key={d}
                  label={`${d}% or more`}
                  radio
                  checked={draft.minDiscount === d}
                  onPress={() => set({ minDiscount: draft.minDiscount === d ? undefined : d })}
                />
              ))
            ) : group === 'brand' ? (
              <CheckList values={options?.brands ?? []} picked={draft.brands} onToggle={(v) => toggle('brands', v)} />
            ) : group === 'shop' ? (
              shops.map((s) => (
                <OptionRow
                  key={s.storeId}
                  label={s.name}
                  hint={[formatDistance(s.distanceKm), `${s.inStockProducts} in stock`].filter(Boolean).join(' · ')}
                  checked={draft.shops.includes(s.storeId)}
                  onPress={() => toggle('shops', s.storeId)}
                />
              ))
            ) : (
              <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.fill}>
                  <Text variant="label">In stock only</Text>
                  <Text variant="body" tone="muted">
                    Hide items sold out at the shop
                  </Text>
                </View>
                <ThemedSwitch value={draft.inStockOnly} onValueChange={(v) => set({ inStockOnly: v })} label="In stock only" />
              </View>
            )}
          </ScrollView>
        </View>

        <View style={[styles.foot, { borderTopColor: colors.border, backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.fill}>
            <Text variant="label" numeric accessibilityLiveRegion="polite">
              {total === undefined ? '…' : total === 1 ? '1 item' : `${total} items`}
            </Text>
            <Text variant="caption" tone="muted">
              match your filters
            </Text>
          </View>
          <Button label="Show results" onPress={apply} style={styles.apply} />
        </View>
      </KeyboardSafe>
    </Modal>
  );
}

function OptionRow({ label, hint, checked, radio, onPress }: { label: string; hint?: string; checked: boolean; radio?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      scaleTo={0.99}
      style={[styles.option, { borderBottomColor: colors.border }]}
    >
      <Icon name={radio ? (checked ? 'radio-button-on' : 'radio-button-off') : checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? 'accent' : 'textMuted'} />
      <View style={styles.fill}>
        <Text variant="bodyLarge" weight={checked ? '700' : '400'}>
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

/** Checkbox list with a search box once the list gets long (brands, categories). */
function CheckList({ values, picked, onToggle }: { values: string[]; picked: string[]; onToggle: (v: string) => void }) {
  const [find, setFind] = useState('');
  const shown = useMemo(() => {
    const f = find.trim().toLowerCase();
    const list = f ? values.filter((v) => v.toLowerCase().includes(f)) : values;
    // Picked values first so they stay in view.
    return [...list.filter((v) => picked.includes(v)), ...list.filter((v) => !picked.includes(v))];
  }, [values, picked, find]);
  return (
    <View>
      {values.length > 10 ? <SearchField value={find} onChangeText={setFind} onClear={() => setFind('')} placeholder="Search" /> : null}
      {shown.map((v) => (
        <OptionRow key={v} label={v} checked={picked.includes(v)} onPress={() => onToggle(v)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  clear: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  panes: { flexDirection: 'row' },
  rail: { flexGrow: 0, width: 132 },
  railItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 56, paddingHorizontal: 14 },
  railMark: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  pane: { padding: 16, paddingTop: 8, gap: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, paddingTop: 8 },
  gap: { gap: 6, paddingTop: 8 },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  apply: { minWidth: 170 },
});
