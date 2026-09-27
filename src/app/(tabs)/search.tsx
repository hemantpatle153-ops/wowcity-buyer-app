import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SortOption } from '@/api/types';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FilterSheet } from '@/components/FilterSheet';
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
  priceLabel,
  SORT_LABELS,
  toSearchQuery,
  type SearchFilters,
} from '@/features/searchFilters';
import { flattenPages, useFilters, useSearchFeed } from '@/hooks/queries';
import { useRecentSearches } from '@/state/recentSearches';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { swatchFor } from '@/theme/swatches';

const SORTS: SortOption[] = ['nearest', 'newest', 'price_low', 'price_high'];

export default function Search() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; category?: string; inStockOnly?: string; sort?: string; focus?: string }>();
  const hasCoords = useSettings((s) => s.location?.kind === 'gps');
  const defaultSort: SortOption = hasCoords ? 'nearest' : 'newest';

  const [text, setText] = useState(params.q ?? '');
  const [query, setQuery] = useState(params.q ?? '');
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const recent = useRecentSearches();
  const options = useFilters();

  // Links from Home ("See all", categories, tags) set the filters when they change.
  const linkKey = [params.category, params.inStockOnly, params.sort, params.q].join('|');
  const [appliedLink, setAppliedLink] = useState('|||');
  if (linkKey !== appliedLink) {
    setAppliedLink(linkKey);
    if (params.category || params.inStockOnly || params.sort || params.q) {
      setFilters({
        ...emptyFilters,
        category: params.category || undefined,
        inStockOnly: params.inStockOnly === '1',
        sort: SORTS.includes(params.sort as SortOption) ? (params.sort as SortOption) : undefined,
      });
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
  if (filters.category) activeChips.push({ key: 'cat', label: filters.category, clear: () => setFilters((f) => ({ ...f, category: undefined })) });
  if (filters.size) activeChips.push({ key: 'size', label: `Size ${filters.size}`, clear: () => setFilters((f) => ({ ...f, size: undefined })) });
  if (filters.colour)
    activeChips.push({ key: 'col', label: filters.colour, swatch: swatchFor(filters.colour), clear: () => setFilters((f) => ({ ...f, colour: undefined })) });
  const price = priceLabel(filters.minPrice, filters.maxPrice);
  if (price) activeChips.push({ key: 'price', label: price, clear: () => setFilters((f) => ({ ...f, minPrice: undefined, maxPrice: undefined })) });
  if (filters.brand) activeChips.push({ key: 'brand', label: filters.brand, clear: () => setFilters((f) => ({ ...f, brand: undefined })) });

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipBar}>
        <Chip
          label={active ? `Filters · ${active}` : 'Filters'}
          icon="options-outline"
          selected={active > 0}
          onPress={() => setFiltersOpen(true)}
          accessibilityHint="Opens filters"
        />
        <Chip label={SORT_LABELS[sort]} icon="swap-vertical" trailingIcon="chevron-down" onPress={() => setSortOpen(true)} accessibilityLabel={`Sort: ${SORT_LABELS[sort]}`} />
        <Chip
          label="In stock"
          icon={filters.inStockOnly ? 'checkmark-circle' : 'ellipse-outline'}
          selected={filters.inStockOnly}
          onPress={() => setFilters((f) => ({ ...f, inStockOnly: !f.inStockOnly }))}
        />
        {activeChips.map((c) => (
          <Chip key={c.key} label={c.label} swatch={c.swatch} selected trailingIcon="close" onPress={c.clear} accessibilityLabel={`Remove filter ${c.label}`} />
        ))}
      </ScrollView>
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
            onCategory={(c) => setFilters((f) => ({ ...f, category: c }))}
            onBrand={(b) => setFilters((f) => ({ ...f, brand: b }))}
          />
        </ScrollView>
      )}
      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onApply={setFilters} options={options.data} />
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
