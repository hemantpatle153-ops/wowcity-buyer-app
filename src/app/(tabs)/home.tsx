import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { LocationPill } from '@/components/LocationPill';
import { PressableScale } from '@/components/PressableScale';
import { ProductCardSkeleton, ProductCardView } from '@/components/ProductCard';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/SectionHeader';
import { ShopTile, ShopTileSkeleton } from '@/components/ShopCard';
import { Text } from '@/components/Text';
import { flattenPages, useFilters, useSearchFeed, useStores } from '@/hooks/queries';
import { RADIUS_OPTIONS, useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | undefined>();
  const radiusKm = useSettings((s) => s.radiusKm);
  const setRadius = useSettings((s) => s.setRadius);

  const filters = useFilters();
  const stores = useStores();
  const inStock = useSearchFeed({ inStockOnly: true, sort: 'nearest', category });
  const newest = useSearchFeed({ sort: 'newest', category });
  const items = flattenPages(newest.data?.pages);
  const railItems = flattenPages(inStock.data?.pages).slice(0, 12);

  const wider = RADIUS_OPTIONS.find((r) => r > radiusKm);
  const noShops = stores.isSuccess && stores.data.length === 0;

  const refresh = () => Promise.all([filters.refetch(), stores.refetch(), inStock.refetch(), newest.refetch()]);

  const header = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <LocationPill />
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          Discover
        </Text>
        <Text variant="bodyLarge" tone="muted">
          Clothes in stock at shops near you. Save what you love, then walk in.
        </Text>
        <SearchLauncher />
      </View>

      {filters.data && filters.data.categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" selected={!category} onPress={() => setCategory(undefined)} />
          {filters.data.categories.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? undefined : c)} />
          ))}
        </ScrollView>
      ) : null}

      {noShops ? null : (
        <View style={styles.section}>
          <SectionHeader title="Shops near you" actionLabel="See all" onAction={() => router.navigate('/shops')} />
          <FlatList
            horizontal
            data={stores.data ?? []}
            keyExtractor={(s) => s.storeId}
            renderItem={({ item }) => <ShopTile shop={item} />}
            ListEmptyComponent={
              stores.isLoading ? (
                <View style={styles.row}>
                  <ShopTileSkeleton />
                  <ShopTileSkeleton />
                  <ShopTileSkeleton />
                </View>
              ) : null
            }
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {noShops ? null : (
        <View style={styles.section}>
          <SectionHeader
            title="In stock near you"
            subtitle="Nearest first"
            actionLabel="See all"
            onAction={() => router.navigate({ pathname: '/search', params: { inStockOnly: '1', sort: 'nearest', category } })}
          />
          <FlatList
            horizontal
            data={railItems}
            keyExtractor={(i) => `${i.storeId}/${i.productId}`}
            renderItem={({ item }) => <ProductCardView item={item} width={156} />}
            ListEmptyComponent={
              inStock.isLoading ? (
                <View style={styles.row}>
                  <ProductCardSkeleton width={156} />
                  <ProductCardSkeleton width={156} />
                  <ProductCardSkeleton width={156} />
                </View>
              ) : (
                <Text variant="body" tone="muted">
                  Nothing in stock in this category nearby right now.
                </Text>
              )
            }
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {noShops ? null : <SectionHeader title="Newest nearby" subtitle={category ?? 'Just listed by shops around you'} />}
    </View>
  );

  return (
    <ProductGrid
      testID="home-feed"
      header={header}
      items={noShops ? [] : items}
      loading={newest.isLoading}
      error={newest.error}
      hasNextPage={newest.hasNextPage}
      fetchingNextPage={newest.isFetchingNextPage}
      onEndReached={() => newest.fetchNextPage()}
      onRefresh={refresh}
      onRetry={refresh}
      total={newest.data?.pages[0]?.total}
      empty={
        noShops ? (
          <EmptyState
            icon="map-outline"
            title={`No shops within ${radiusKm} km yet`}
            message="WowCity is growing shop by shop. Try a wider radius or another area."
            actionLabel={wider ? `Show shops within ${wider} km` : 'Change location'}
            onAction={() => (wider ? setRadius(wider) : router.push('/location'))}
          />
        ) : (
          <EmptyState
            icon="shirt-outline"
            title="Nothing here yet"
            message={category ? `No ${category.toLowerCase()} listed nearby right now.` : 'Shops nearby haven’t listed anything yet.'}
            actionLabel={category ? 'Show everything' : undefined}
            onAction={category ? () => setCategory(undefined) : undefined}
          />
        )
      }
    />
  );
}

function SearchLauncher() {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      onPress={() => router.navigate({ pathname: '/search', params: { focus: '1' } })}
      accessibilityRole="search"
      accessibilityLabel="Search clothes, brands and shops"
      scaleTo={0.98}
      style={[styles.launcher, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control + 6 }]}
    >
      <Icon name="search" size={20} color="textMuted" />
      <Text variant="bodyLarge" tone="muted" numberOfLines={1}>
        Search kurtas, jeans, brands…
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  title: { marginTop: 6 },
  chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  section: { marginTop: 14, marginBottom: 6 },
  rail: { paddingHorizontal: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  launcher: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, marginTop: 10 },
});
