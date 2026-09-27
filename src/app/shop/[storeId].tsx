import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchField } from '@/components/SearchField';
import { ShopAvatar } from '@/components/ShopCard';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import type { StoreSummary } from '@/api/types';
import { MAP_ENABLED } from '@/lib/config';
import { flattenPages, useSearchFeed, useStore } from '@/hooks/queries';
import { formatDistance, formatPhoneForDisplay } from '@/lib/format';
import { callShop, canGetDirections, openDirections } from '@/lib/maps';
import { useTheme } from '@/theme/ThemeProvider';

type MapProps = { shops: StoreSummary[]; compact?: boolean };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ShopsMap: ComponentType<MapProps> | null = MAP_ENABLED ? require('@/components/ShopsMap').default : null;

export default function ShopScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, radius, reduceMotion } = useTheme();
  const shop = useStore(storeId);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(text), 300);
    return () => clearTimeout(t);
  }, [text]);
  const feed = useSearchFeed({ storeId, q: q || undefined, sort: 'newest' }, { scope: 'coords' });
  const items = flattenPages(feed.data?.pages);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/shops'));

  if (shop.error && !shop.data) {
    const gone = shop.error instanceof ApiError && shop.error.isNotFound;
    return (
      <View style={[styles.fill, { paddingTop: insets.top + 8 }]}>
        <View style={styles.bar}>
          <IconButton icon="chevron-back" label="Back" onPress={back} />
        </View>
        <EmptyState
          icon={gone ? 'storefront-outline' : 'refresh-outline'}
          title={gone ? 'This shop isn’t on WowCity any more' : 'Couldn’t load this shop'}
          message={gone ? undefined : (shop.error as Error).message}
          actionLabel={gone ? 'See nearby shops' : 'Try again'}
          onAction={gone ? () => router.replace('/shops') : () => shop.refetch()}
        />
      </View>
    );
  }

  const s = shop.data;
  const distance = formatDistance(s?.distanceKm);

  const header = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label="Back" onPress={back} />
      </View>
      <View style={styles.hero}>
        {s ? (
          <Animated.View entering={reduceMotion ? undefined : FadeIn} style={styles.heroInner}>
            <ShopAvatar name={s.name} size={76} />
            <Text variant="headline" align="center" accessibilityRole="header">
              {s.name}
            </Text>
            <Text variant="bodyLarge" tone="muted" align="center">
              {[s.city, distance ? `${distance} away` : null].filter(Boolean).join(' · ')}
            </Text>
            <View style={[styles.stockPill, { backgroundColor: colors.accentSoft }]}>
              <Icon name="shirt-outline" size={14} color="accent" />
              <Text variant="bodyStrong" tone="accent" numeric>
                {s.inStockProducts} {s.inStockProducts === 1 ? 'item' : 'items'} in stock
              </Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.heroInner}>
            <Skeleton width={76} height={76} radius={24} />
            <Skeleton width={200} height={26} />
            <Skeleton width={140} height={14} />
          </View>
        )}
      </View>

      {s && (s.address || s.phone) ? (
        <View style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
          {s.address ? (
            <View style={styles.infoRow}>
              <Icon name="location-outline" size={20} color="textMuted" />
              <Text variant="body" style={styles.fill}>
                {s.address}
              </Text>
            </View>
          ) : null}
          {ShopsMap && s.latitude !== undefined && s.longitude !== undefined ? (
            <View style={[styles.miniMap, { borderRadius: radius.control, borderColor: colors.border }]}>
              <ShopsMap shops={[s]} compact />
            </View>
          ) : null}
          {s.phone ? (
            <View style={styles.infoRow}>
              <Icon name="call-outline" size={20} color="textMuted" />
              <Text variant="body" numeric style={styles.fill}>
                {formatPhoneForDisplay(s.phone)}
              </Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            {canGetDirections(s) ? (
              <Button label="Directions" icon="navigate" size="md" style={styles.fill} onPress={() => openDirections(s)} />
            ) : null}
            {s.phone ? (
              <Button label="Call" icon="call" variant="soft" size="md" style={styles.fill} onPress={() => callShop(s.phone!)} />
            ) : null}
          </View>
        </View>
      ) : s ? (
        <Text variant="body" tone="muted" align="center" style={styles.private}>
          This shop hasn’t shared its address or phone. Ask around {s.city ?? 'the area'}, or check back later.
        </Text>
      ) : null}

      <View style={styles.searchWrap}>
        <SearchField value={text} onChangeText={setText} onClear={() => setText('')} placeholder={`Search in ${s?.name ?? 'this shop'}`} />
      </View>
    </View>
  );

  return (
    <View style={styles.fill}>
      <ProductGrid
        header={header}
        items={items}
        loading={feed.isLoading}
        error={feed.error}
        hasNextPage={feed.hasNextPage}
        fetchingNextPage={feed.isFetchingNextPage}
        onEndReached={() => feed.fetchNextPage()}
        onRefresh={() => Promise.all([shop.refetch(), feed.refetch()])}
        onRetry={() => feed.refetch()}
        showShop={false}
        bottomInset={insets.bottom + 24}
        empty={
          <EmptyState
            compact
            icon="search-outline"
            title={q ? 'Nothing matches here' : 'No items listed yet'}
            message={q ? `“${q}” isn’t listed at this shop.` : 'This shop hasn’t listed anything on WowCity yet.'}
            actionLabel={q ? 'Clear search' : undefined}
            onAction={q ? () => setText('') : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: { paddingHorizontal: 12, flexDirection: 'row' },
  hero: { paddingHorizontal: 16, paddingVertical: 8 },
  heroInner: { alignItems: 'center', gap: 8 },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 4 },
  info: { marginHorizontal: 16, marginTop: 12, padding: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  miniMap: { height: 150, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  private: { paddingHorizontal: 32, marginTop: 8 },
  searchWrap: { paddingHorizontal: 16, marginTop: 16, marginBottom: 16 },
});
