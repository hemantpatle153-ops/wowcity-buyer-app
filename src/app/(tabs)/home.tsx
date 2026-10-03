import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProductCard } from '@/api/types';
import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LocationPill } from '@/components/LocationPill';
import { PressableScale } from '@/components/PressableScale';
import { ProductCardSkeleton, ProductCardView } from '@/components/ProductCard';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/SectionHeader';
import { ShopTile, ShopTileSkeleton } from '@/components/ShopCard';
import { Text } from '@/components/Text';
import { coverPhotos, maxDiscount, orderCategories, plural, railCategories } from '@/features/home';
import { flattenPages, useFilters, useSearchFeed, useStores } from '@/hooks/queries';
import { PHOTO_BLURHASH, PHOTO_TRANSITION } from '@/lib/images';
import { RADIUS_OPTIONS, useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

/** The WowCity logo gradient (luzzan.com). */
const BRAND = ['#ff2e7e', '#ff7a2f', '#ffc23d'] as const;
const INK = '#3A1020';
const RAIL_CARD = 150;

type SearchLink = Record<string, string>;
const openSearch = (params: SearchLink) => router.navigate({ pathname: '/search', params });

export default function Home() {
  const insets = useSafeAreaInsets();
  const radiusKm = useSettings((s) => s.radiusKm);
  const setRadius = useSettings((s) => s.setRadius);

  const filters = useFilters();
  const stores = useStores();
  const newest = useSearchFeed({ sort: 'newest' });
  const nearest = useSearchFeed({ inStockOnly: true, sort: 'nearest' });
  const deals = useSearchFeed({ inStockOnly: true, sort: 'discount' });
  const featured = railCategories(filters.data?.categories ?? []);
  // Always three hooks (rules of hooks); the unused ones stay disabled.
  const rail0 = useSearchFeed({ inStockOnly: true, category: featured[0] }, { enabled: !!featured[0] });
  const rail1 = useSearchFeed({ inStockOnly: true, category: featured[1] }, { enabled: !!featured[1] });
  const rail2 = useSearchFeed({ inStockOnly: true, category: featured[2] }, { enabled: !!featured[2] });
  const rails = [rail0, rail1, rail2];

  const grid = flattenPages(newest.data?.pages);
  const nearItems = flattenPages(nearest.data?.pages).slice(0, 12);
  // An older server rejects sort=discount; then the deals row simply hides.
  const dealItems = deals.isError ? [] : flattenPages(deals.data?.pages).filter((i) => i.mrp && i.price && i.mrp > i.price).slice(0, 12);
  const railItems = rails.map((r) => flattenPages(r.data?.pages).slice(0, 12));

  const loaded = useMemo(() => [...nearItems, ...dealItems, ...railItems.flat(), ...grid], [nearItems, dealItems, railItems, grid]);
  const photos = useMemo(() => coverPhotos(loaded), [loaded]);
  const categories = orderCategories(filters.data?.categories ?? [], photos.byCategory);
  const bestDeal = maxDiscount(dealItems.length ? dealItems : loaded);

  const wider = RADIUS_OPTIONS.find((r) => r > radiusKm);
  const noShops = stores.isSuccess && stores.data.length === 0;
  const refresh = () =>
    Promise.all([filters.refetch(), stores.refetch(), newest.refetch(), nearest.refetch(), deals.refetch(), ...rails.map((r) => r.refetch())]);

  const header = (
    <View style={{ paddingTop: insets.top + 6 }}>
      <TopBar />
      <View style={styles.pad}>
        <LocationPill />
        <SearchLauncher />
      </View>

      {noShops ? null : (
        <>
          <Banners
            photo={(category) => photos.byCategory.get(category.toLowerCase()) ?? null}
            fallback={loaded.find((i) => i.image)?.image ?? null}
            bestDeal={bestDeal}
            hasDeals={dealItems.length > 0}
          />

          {categories.length ? (
            <Section title="Shop by category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.rail}>
                {categories.map((c) => (
                  <CategoryTile key={c} name={c} photo={photos.byCategory.get(c.toLowerCase()) ?? null} />
                ))}
              </ScrollView>
            </Section>
          ) : null}

          <SarahCard />

          {dealItems.length ? (
            <Section
              title={bestDeal ? `Deals up to ${bestDeal}% off` : 'Deals near you'}
              subtitle="Biggest discounts in shops around you"
              action={() => openSearch({ sort: 'discount', inStockOnly: '1' })}
            >
              <Rail items={dealItems} loading={false} />
            </Section>
          ) : null}

          <Section title="Shops near you" action={() => router.navigate('/shops')}>
            <FlatList
              horizontal
              style={styles.noGrow}
              data={stores.data ?? []}
              keyExtractor={(s) => s.storeId}
              renderItem={({ item }) => <ShopTile shop={item} cover={photos.byShop.get(item.storeId) ?? null} />}
              ListEmptyComponent={
                stores.isLoading ? (
                  <View style={styles.row}>
                    <ShopTileSkeleton />
                    <ShopTileSkeleton />
                  </View>
                ) : null
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            />
          </Section>

          <Section title="In stock near you" subtitle="Nearest shops first" action={() => openSearch({ inStockOnly: '1', sort: 'nearest' })}>
            <Rail items={nearItems} loading={nearest.isLoading} />
          </Section>

          {featured.map((category, i) =>
            railItems[i]?.length ? (
              <Section key={category} title={`${plural(category)} near you`} action={() => openSearch({ category, inStockOnly: '1' })}>
                <Rail items={railItems[i]} loading={false} />
              </Section>
            ) : null,
          )}

          <View style={styles.section}>
            <SectionHeader title="Just listed" subtitle="New in shops around you" />
          </View>
        </>
      )}
    </View>
  );

  return (
    <ProductGrid
      testID="home-feed"
      header={header}
      items={noShops ? [] : grid}
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
          <EmptyState icon="shirt-outline" title="Nothing here yet" message="Shops nearby haven’t listed anything yet." />
        )
      }
    />
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      <BrandMark size={36} />
      <Text variant="title" weight="800" style={styles.flex} accessibilityRole="header">
        WowCity
      </Text>
      <IconButton icon="sparkles-outline" label="Ask Sarah" variant="plain" color="accent" onPress={() => router.push('/assistant')} />
      <IconButton icon="heart-outline" label="Saved items" variant="plain" onPress={() => router.navigate('/saved')} />
    </View>
  );
}

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} actionLabel={action ? 'See all' : undefined} onAction={action} />
      {children}
    </View>
  );
}

function Rail({ items, loading }: { items: ProductCard[]; loading: boolean }) {
  if (loading && !items.length)
    return (
      <View style={[styles.row, styles.railPad]}>
        <ProductCardSkeleton width={RAIL_CARD} />
        <ProductCardSkeleton width={RAIL_CARD} />
        <ProductCardSkeleton width={RAIL_CARD} />
      </View>
    );
  if (!items.length)
    return (
      <Text variant="body" tone="muted" style={styles.railPad}>
        Nothing in stock nearby right now.
      </Text>
    );
  return (
    <FlatList
      horizontal
      style={styles.noGrow}
      data={items}
      keyExtractor={(i) => `${i.storeId}/${i.productId}`}
      renderItem={({ item }) => <ProductCardView item={item} width={RAIL_CARD} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    />
  );
}

type Banner = { key: string; eyebrow: string; title: string; body: string; cta: string; icon: IconName; photo: string | null; onPress: () => void };

function Banners({
  photo,
  fallback,
  bestDeal,
  hasDeals,
}: {
  photo: (category: string) => string | null;
  fallback: string | null;
  bestDeal: number | null;
  hasDeals: boolean;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const cardWidth = width - 32;
  const banners: Banner[] = [
    {
      key: 'wedding',
      eyebrow: 'Wedding season',
      title: 'Lehengas, sherwanis & sarees',
      body: 'Try them on today at shops near you',
      cta: 'Shop wedding wear',
      icon: 'sparkles',
      photo: photo('Lehenga') ?? photo('Saree') ?? photo('Sherwani') ?? fallback,
      onPress: () => openSearch({ category: 'Lehenga', inStockOnly: '1' }),
    },
    ...(hasDeals
      ? [
          {
            key: 'deals',
            eyebrow: 'Deals nearby',
            title: bestDeal ? `Up to ${bestDeal}% off` : 'Big discounts nearby',
            body: 'The best prices in your neighbourhood shops',
            cta: 'See deals',
            icon: 'pricetag' as IconName,
            photo: photo('Jacket') ?? photo('Blazer') ?? fallback,
            onPress: () => openSearch({ sort: 'discount', inStockOnly: '1' }),
          },
        ]
      : []),
    {
      key: 'budget',
      eyebrow: 'Budget picks',
      title: 'Everything under ₹999',
      body: 'Tees, tops, kurtis and more',
      cta: 'Shop under ₹999',
      icon: 'wallet',
      photo: photo('T-shirt') ?? photo('Kurti') ?? photo('Top') ?? fallback,
      onPress: () => openSearch({ maxPrice: '999', sort: 'price_low', inStockOnly: '1' }),
    },
    {
      key: 'sarah',
      eyebrow: 'New · Ask Sarah',
      title: 'Just say what you want',
      body: '“Red kurta under ₹1,500” and Sarah finds it nearby',
      cta: 'Ask Sarah',
      icon: 'chatbubbles',
      photo: photo('Kurta') ?? photo('Dress') ?? fallback,
      onPress: () => router.push('/assistant'),
    },
  ];
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)));

  return (
    <View style={styles.bannerWrap}>
      <ScrollView
        horizontal
        style={styles.noGrow}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        contentContainerStyle={styles.rail}
      >
        {banners.map((b) => (
          <PressableScale
            key={b.key}
            onPress={b.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${b.title}. ${b.body}`}
            scaleTo={0.98}
            style={{ width: cardWidth }}
          >
            <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
              <View style={styles.bannerText}>
                <View style={styles.eyebrow}>
                  <Icon name={b.icon} size={12} tint={INK} />
                  <Text variant="caption" weight="800" style={styles.ink} numberOfLines={1}>
                    {b.eyebrow.toUpperCase()}
                  </Text>
                </View>
                <Text variant="subtitle" weight="800" style={[styles.white, styles.bannerTitle]} numberOfLines={2}>
                  {b.title}
                </Text>
                <Text variant="body" style={styles.whiteSoft} numberOfLines={2}>
                  {b.body}
                </Text>
                <View style={styles.cta}>
                  <Text variant="bodyStrong" style={styles.ink}>
                    {b.cta}
                  </Text>
                  <Icon name="arrow-forward" size={14} tint={INK} />
                </View>
              </View>
              {b.photo ? (
                <Image
                  source={{ uri: b.photo }}
                  placeholder={{ blurhash: PHOTO_BLURHASH }}
                  transition={PHOTO_TRANSITION}
                  contentFit="cover"
                  style={styles.bannerPhoto}
                  accessible={false}
                />
              ) : null}
            </LinearGradient>
          </PressableScale>
        ))}
      </ScrollView>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {banners.map((b, i) => (
          <View key={b.key} style={[styles.dot, i === index ? styles.dotOn : null]} />
        ))}
      </View>
    </View>
  );
}

function CategoryTile({ name, photo }: { name: string; photo: string | null }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => openSearch({ category: name })}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${name}`}
      scaleTo={0.94}
      style={styles.catTile}
    >
      <View style={[styles.catPhoto, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            placeholder={{ blurhash: PHOTO_BLURHASH }}
            transition={PHOTO_TRANSITION}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessible={false}
          />
        ) : (
          <Text variant="title" tone="accent" weight="800">
            {name.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <Text variant="caption" weight="600" numberOfLines={1} align="center" style={styles.catLabel}>
        {name}
      </Text>
    </PressableScale>
  );
}

function SarahCard() {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push('/assistant')}
      accessibilityRole="button"
      accessibilityLabel="Ask Sarah, the AI shopping assistant"
      accessibilityHint="Describe what you want and Sarah finds it in shops near you"
      scaleTo={0.98}
      style={[styles.sarah, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sarahIcon}>
        <Icon name="sparkles" size={20} tint="#FFFFFF" />
      </LinearGradient>
      <View style={styles.flex}>
        <Text variant="label">Ask Sarah</Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {'Type or speak, like "black kurta in L under ₹1,500", and she finds it nearby'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color="textMuted" />
    </PressableScale>
  );
}

function SearchLauncher() {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={() => openSearch({ focus: '1' })}
      accessibilityRole="search"
      accessibilityLabel="Search clothes, brands and shops"
      scaleTo={0.98}
      style={[styles.launcher, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
    >
      <Icon name="search" size={20} color="accent" />
      <Text variant="bodyLarge" tone="muted" numberOfLines={1} style={styles.flex}>
        Search sarees, kurtas, jeans…
      </Text>
      <Icon name="options-outline" size={20} color="textMuted" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Horizontal lists inside the feed header must not stretch vertically (that caused the big gaps on Android).
  noGrow: { flexGrow: 0 },
  pad: { paddingHorizontal: 16, gap: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 6, marginBottom: 4 },
  launcher: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  section: { marginTop: 22 },
  rail: { paddingHorizontal: 16, gap: 12, alignItems: 'flex-start' },
  railPad: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 12 },
  bannerWrap: { marginTop: 16 },
  banner: { height: 176, borderRadius: 22, flexDirection: 'row', overflow: 'hidden' },
  bannerText: { flex: 1, padding: 16, gap: 4, justifyContent: 'center' },
  bannerPhoto: { width: 124, height: '100%' },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  ink: { color: INK, letterSpacing: 0.3 },
  white: { color: '#FFFFFF' },
  bannerTitle: { fontSize: 21, lineHeight: 26 },
  whiteSoft: { color: 'rgba(255,255,255,0.94)' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(127,127,127,0.35)' },
  dotOn: { width: 18, backgroundColor: '#ff5a5f' },
  catTile: { width: 76, alignItems: 'center', gap: 6 },
  catPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  catLabel: { width: 76 },
  sarah: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sarahIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
