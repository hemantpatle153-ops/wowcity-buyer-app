import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SortOption } from '@/api/types';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FilterSheet, type FilterGroup } from '@/components/FilterSheet';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchField } from '@/components/SearchField';
import { SortSheet } from '@/components/SortSheet';
import { Text } from '@/components/Text';
import {
  activeFilterCount,
  emptyFilters,
  filtersFromLink,
  priceLabel,
  SORT_LABELS,
  toSearchQuery,
  type SearchFilters,
  type SearchLinkParams,
} from '@/features/searchFilters';
import { flattenPages, useFilters, useSearchFeed, useStores } from '@/hooks/queries';
import { useRecentSearches } from '@/state/recentSearches';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { swatchFor } from '@/theme/swatches';

export default function Search() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SearchLinkParams & { focus?: string }>();
  const hasCoords = useSettings((s) => s.location?.kind === 'gps');
  const defaultSort: SortOption = hasCoords ? 'nearest' : 'newest';

  const [text, setText] = useState(params.q ?? '');
  const [query, setQuery] = useState(params.q ?? '');
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | undefined>();
  const openFilters = (group?: FilterGroup) => {
    setFilterGroup(group);
    setFiltersOpen(true);
  };
  const [sortOpen, setSortOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const recent = useRecentSearches();
  const options = useFilters();
  const shops = useStores();

  // Links from Home (banners, category tiles, "See all") set the filters when they change.
  const linkKey = JSON.stringify([params.q, params.category, params.brand, params.size, params.colour, params.inStockOnly, params.sort, params.minPrice, params.maxPrice, params.minDiscount]);
  const [appliedLink, setAppliedLink] = useState<string | null>(null);
  if (linkKey !== appliedLink) {
    setAppliedLink(linkKey);
    const linked = filtersFromLink(params);
    if (activeFilterCount(linked) > 0 || linked.sort || params.q) {
      setFilters(linked);
      if (params.q) {
        setText(params.q);
        setQuery(params.q);
      }
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (params.focus === '1') setTimeout(() => inputRef.current?.focus(), 250);
    }, [params.focus]),
  );

  // Search as you type, gently debounced.
  useEffect(() => {
    const t = setTimeout(() => setQuery(text), 350);
    return () => clearTimeout(t);
  }, [text]);

  const sort = filters.sort ?? defaultSort;
  const active = activeFilterCount(filters);
  const browsing = query.trim().length > 0 || active > 0 || !!filters.sort;
  const searchQuery = useMemo(() => toSearchQuery(query, { ...filters, sort }), [query, filters, sort]);
  const feed = useSearchFeed(searchQuery, { enabled: browsing });
  const items = flattenPages(feed.data?.pages);
  const total = feed.data?.pages[0]?.total;

  const submit = (q = text) => {
    setText(q);
    setQuery(q);
    recent.add(q);
  };

  const activeChips: { key: string; label: string; swatch?: string; clear: () => void }[] = [];
  const without = (key: 'categories' | 'brands' | 'sizes' | 'colours' | 'shops', v: string) => () =>
    setFilters((f) => ({ ...f, [key]: f[key].filter((x) => x !== v) }));
  filters.categories.forEach((c) => activeChips.push({ key: `cat-${c}`, label: c, clear: without('categories', c) }));
  filters.sizes.forEach((v) => activeChips.push({ key: `size-${v}`, label: `Size ${v}`, clear: without('sizes', v) }));
  filters.colours.forEach((c) => activeChips.push({ key: `col-${c}`, label: c, swatch: swatchFor(c), clear: without('colours', c) }));
  const price = priceLabel(filters.minPrice, filters.maxPrice);
  if (price) activeChips.push({ key: 'price', label: price, clear: () => setFilters((f) => ({ ...f, minPrice: undefined, maxPrice: undefined })) });
  if (filters.minDiscount) activeChips.push({ key: 'disc', label: `${filters.minDiscount}%+ off`, clear: () => setFilters((f) => ({ ...f, minDiscount: undefined })) });
  filters.brands.forEach((b) => activeChips.push({ key: `brand-${b}`, label: b, clear: without('brands', b) }));
  filters.shops.forEach((id) =>
    activeChips.push({ key: `shop-${id}`, label: shops.data?.find((x) => x.storeId === id)?.name ?? 'Shop', clear: without('shops', id) }),
  );

  const header = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Text variant="headline" accessibilityRole="header">
          Search
        </Text>
        <SearchField
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => submit()}
          onClear={() => {
            setText('');
            setQuery('');
          }}
          placeholder="Kurtas, jeans, brands, shops…"
          testID="search-input"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.chipBar}>
        <Chip
          label={active ? `Filters · ${active}` : 'Filters'}
          icon="options-outline"
          selected={active > 0}
          onPress={() => openFilters()}
          accessibilityHint="Opens all filters"
        />
        <Chip label={SORT_LABELS[sort]} icon="swap-vertical" trailingIcon="chevron-down" onPress={() => setSortOpen(true)} accessibilityLabel={`Sort: ${SORT_LABELS[sort]}`} />
        {(
          [
            ['size', 'Size', filters.sizes.length],
            ['colour', 'Colour', filters.colours.length],
            ['price', 'Price', price ? 1 : 0],
            ['discount', 'Discount', filters.minDiscount ? 1 : 0],
            ['brand', 'Brand', filters.brands.length],
            ['category', 'Category', filters.categories.length],
          ] as [FilterGroup, string, number][]
        ).map(([group, label, n]) => (
          <Chip key={group} label={n ? `${label} · ${n}` : label} trailingIcon="chevron-down" selected={n > 0} onPress={() => openFilters(group)} />
        ))}
        <Chip
          label="In stock"
          icon={filters.inStockOnly ? 'checkmark-circle' : 'ellipse-outline'}
          selected={filters.inStockOnly}
          onPress={() => setFilters((f) => ({ ...f, inStockOnly: !f.inStockOnly }))}
        />
      </ScrollView>
      {activeChips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.chipBar}>
          {activeChips.map((c) => (
            <Chip key={c.key} label={c.label} swatch={c.swatch} selected trailingIcon="close" onPress={c.clear} accessibilityLabel={`Remove filter ${c.label}`} />
          ))}
        </ScrollView>
      ) : null}
      {browsing && total !== undefined ? (
        <Text variant="body" tone="muted" style={styles.count} accessibilityLiveRegion="polite">
          {total === 1 ? '1 item' : `${total} items`}
          {query.trim() ? ` for “${query.trim()}”` : ''}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.fill}>
      {browsing ? (
        <ProductGrid
          testID="search-results"
          header={header}
          items={items}
          loading={feed.isLoading || (feed.isFetching && feed.isPlaceholderData && items.length === 0)}
          error={feed.error}
          hasNextPage={feed.hasNextPage}
          fetchingNextPage={feed.isFetchingNextPage}
          onEndReached={() => feed.fetchNextPage()}
          onRefresh={() => feed.refetch()}
          onRetry={() => feed.refetch()}
          total={total}
          empty={
            <EmptyState
              icon="search-outline"
              title="No matches nearby"
              message="Try fewer filters, a different word, or a wider radius."
              actionLabel={active ? 'Clear filters' : undefined}
              onAction={active ? () => setFilters({ ...emptyFilters, sort: filters.sort }) : undefined}
            />
          }
        />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          {header}
          <Suggestions
            recent={recent.items}
            onPick={submit}
            onRemove={recent.remove}
            onClear={recent.clear}
            categories={options.data?.categories ?? []}
            brands={options.data?.brands ?? []}
            onCategory={(c) => setFilters((f) => ({ ...f, categories: [c] }))}
            onBrand={(b) => setFilters((f) => ({ ...f, brands: [b] }))}
          />
        </ScrollView>
      )}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onApply={setFilters}
        options={options.data}
        shops={shops.data ?? []}
        query={query}
        canSortByDistance={hasCoords}
        initialGroup={filterGroup}
      />
      <SortSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onChange={(s) => setFilters((f) => ({ ...f, sort: s }))}
        canSortByDistance={hasCoords}
      />
    </View>
  );
}

function Suggestions({
  recent,
  onPick,
  onRemove,
  onClear,
  categories,
  brands,
  onCategory,
  onBrand,
}: {
  recent: string[];
  onPick: (q: string) => void;
  onRemove: (q: string) => void;
  onClear: () => void;
  categories: string[];
  brands: string[];
  onCategory: (c: string) => void;
  onBrand: (b: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.suggest}>
      {recent.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text variant="subtitle" accessibilityRole="header">
              Recent searches
            </Text>
            <PressableScale onPress={onClear} accessibilityLabel="Clear recent searches" style={styles.textBtn}>
              <Text variant="bodyStrong" tone="accent">
                Clear
              </Text>
            </PressableScale>
          </View>
          {recent.map((q) => (
            <View key={q} style={[styles.recentRow, { borderBottomColor: colors.border }]}>
              <PressableScale onPress={() => onPick(q)} accessibilityLabel={`Search ${q}`} scaleTo={0.99} style={styles.recentMain}>
                <Icon name="time-outline" size={18} color="textMuted" />
                <Text variant="bodyLarge" numberOfLines={1} style={styles.fill}>
                  {q}
                </Text>
              </PressableScale>
              <IconButton icon="close" label={`Remove ${q} from recent searches`} onPress={() => onRemove(q)} variant="plain" color="textMuted" />
            </View>
          ))}
        </View>
      ) : null}

      {categories.length > 0 ? (
        <View style={styles.block}>
          <Text variant="subtitle" accessibilityRole="header">
            Browse by category
          </Text>
          <View style={styles.wrap}>
            {categories.map((c) => (
              <Chip key={c} label={c} onPress={() => onCategory(c)} />
            ))}
          </View>
        </View>
      ) : null}

      {brands.length > 0 ? (
        <View style={styles.block}>
          <Text variant="subtitle" accessibilityRole="header">
            Brands nearby
          </Text>
          <View style={styles.wrap}>
            {brands.slice(0, 16).map((b) => (
              <Chip key={b} label={b} onPress={() => onBrand(b)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { paddingHorizontal: 16, gap: 12, marginBottom: 6 },
  noGrow: { flexGrow: 0 },
  chipBar: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  count: { paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },
  suggest: { paddingHorizontal: 16, gap: 24, marginTop: 16 },
  block: { gap: 8 },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  recentRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  recentMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
});
