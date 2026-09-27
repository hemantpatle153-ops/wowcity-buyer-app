import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { forwardRef, useCallback, useState, type ReactElement } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import type { ProductCard } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';

import { EmptyState } from './EmptyState';
import { ProductCardSkeleton, ProductCardView } from './ProductCard';
import { Text } from './Text';

type Row = { kind: 'item'; item: ProductCard } | { kind: 'skeleton'; key: string };

export type ProductGridProps = {
  items: ProductCard[];
  loading: boolean;
  error?: unknown;
  hasNextPage?: boolean;
  fetchingNextPage?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => Promise<unknown>;
  onRetry?: () => void;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  showShop?: boolean;
  bottomInset?: number;
  total?: number;
  testID?: string;
};

const SKELETONS: Row[] = Array.from({ length: 6 }, (_, i) => ({ kind: 'skeleton', key: `sk${i}` }));

/** Two-column, infinitely scrolling product grid with skeletons, pull to refresh, and empty/error states. */
export const ProductGrid = forwardRef<FlashListRef<Row>, ProductGridProps>(function ProductGrid(
  {
    items,
    loading,
    error,
    hasNextPage,
    fetchingNextPage,
    onEndReached,
    onRefresh,
    onRetry,
    header,
    empty,
    showShop = true,
    bottomInset = 24,
    total,
    testID,
  },
  ref,
) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const data: Row[] = loading && items.length === 0 ? SKELETONS : items.map((item) => ({ kind: 'item', item }));

  const refresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => (
      <View style={[styles.cell, index % 2 === 0 ? styles.left : styles.right]}>
        {item.kind === 'item' ? <ProductCardView item={item.item} showShop={showShop} /> : <ProductCardSkeleton />}
      </View>
    ),
    [showShop],
  );

  const errorView =
    error && items.length === 0 && !loading ? (
      error instanceof ApiError && error.isNetwork ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="You’re offline"
          message="Connect to the internet to see clothes near you. We’ll pick up where you left off."
          actionLabel="Try again"
          onAction={onRetry}
        />
      ) : (
        <EmptyState
          icon="refresh-outline"
          title="Couldn’t load this"
          message={error instanceof Error ? error.message : 'Something went wrong.'}
          actionLabel="Try again"
          onAction={onRetry}
        />
      )
    ) : null;

  return (
    <FlashList
      ref={ref}
      testID={testID}
      data={data}
      numColumns={2}
      keyExtractor={(r) => (r.kind === 'item' ? `${r.item.storeId}/${r.item.productId}` : r.key)}
      getItemType={(r) => r.kind}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={errorView ?? (loading ? null : empty)}
      ListFooterComponent={
        <View style={{ paddingBottom: bottomInset }}>
          {fetchingNextPage ? (
            <View style={styles.footer} accessibilityLabel="Loading more">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : !hasNextPage && items.length > 6 ? (
            <View style={styles.footer}>
              <Text variant="body" tone="muted" align="center">
                {total ? `That’s all ${total} items nearby` : 'You’ve seen everything nearby'}
              </Text>
            </View>
          ) : null}
        </View>
      }
      onEndReached={() => {
        if (hasNextPage && !fetchingNextPage) onEndReached?.();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surfaceRaised} />
        ) : undefined
      }
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  cell: { paddingBottom: 20 },
  left: { paddingLeft: 16, paddingRight: 6 },
  right: { paddingLeft: 6, paddingRight: 16 },
  footer: { paddingVertical: 24, alignItems: 'center' },
});
