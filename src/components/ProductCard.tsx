import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ProductCard as Card } from '@/api/types';
import { rememberCard } from '@/lib/cardCache';
import { discountPercent, formatDistance, formatPrice, formatPriceRange, freshness } from '@/lib/format';
import { PHOTO_BLURHASH, PHOTO_TRANSITION } from '@/lib/images';
import { useTheme } from '@/theme/ThemeProvider';

import { HeartButton } from './HeartButton';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

export function productA11yLabel(item: Card): string {
  const parts = [item.name ?? 'Item', item.brand];
  const price = formatPriceRange(item.price, item.maxPrice);
  if (price) parts.push(price);
  if (item.mrp && item.price && item.mrp > item.price) parts.push(`MRP ${formatPrice(item.mrp)}`);
  parts.push(`at ${item.store.name}`);
  const d = formatDistance(item.store.distanceKm);
  if (d) parts.push(`${d} away`);
  if (!item.inStock) parts.push('Sold out at this shop');
  return parts.filter(Boolean).join(', ');
}

export function openProduct(item: Card) {
  rememberCard(item);
  router.push({ pathname: '/product/[storeId]/[productId]', params: { storeId: item.storeId, productId: item.productId } });
}

export const ProductCardView = memo(function ProductCardView({
  item,
  width,
  showShop = true,
  style,
}: {
  item: Card;
  width?: number;
  showShop?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  const price = formatPriceRange(item.price, item.maxPrice);
  const off = discountPercent(item.price, item.mrp);
  const fresh = item.inStock ? freshness(item.publishedAt) : null;
  const distance = formatDistance(item.store.distanceKm);

  return (
    <View style={[{ width }, styles.wrap, style]}>
      <PressableScale
        onPress={() => openProduct(item)}
        haptic="tap"
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={productA11yLabel(item)}
        accessibilityHint="Opens the item"
      >
        <Animated.View
          style={[styles.photo, { borderRadius: radius.card, backgroundColor: colors.surfaceSunken }]}
        >
          <Image
            source={item.image ? { uri: item.image } : undefined}
            placeholder={{ blurhash: PHOTO_BLURHASH }}
            contentFit="cover"
            transition={PHOTO_TRANSITION}
            recyclingKey={item.productId}
            cachePolicy="memory-disk"
            style={[StyleSheet.absoluteFill, !item.inStock && styles.dim]}
            accessible={false}
          />
          {!item.image ? (
            <View style={styles.noPhoto}>
              <Icon name="shirt-outline" size={40} color="textMuted" />
            </View>
          ) : null}
          {off && off >= 10 ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text variant="caption" tone="onAccent" weight="800" numeric>
                {off}% OFF
              </Text>
            </View>
          ) : fresh ? (
            <View style={[styles.badge, { backgroundColor: colors.photoChip }]}>
              <Text variant="caption" tone="onPhoto" weight="700">
                {fresh}
              </Text>
            </View>
          ) : null}
          {distance ? (
            <View style={[styles.distance, { backgroundColor: colors.photoChip }]}>
              <Icon name="navigate" size={11} color="onPhoto" />
              <Text variant="caption" tone="onPhoto" weight="700" numeric>
                {distance}
              </Text>
            </View>
          ) : null}
          {!item.inStock ? (
            <View style={[styles.soldOut, { backgroundColor: colors.photoChip }]}>
              <Icon name="close-circle" size={14} color="onPhoto" />
              <Text variant="caption" tone="onPhoto" weight="700" numberOfLines={1}>
                Sold out at this shop
              </Text>
            </View>
          ) : null}
        </Animated.View>
        <View style={styles.meta}>
          {item.brand ? (
            <Text variant="caption" tone="muted" uppercase numberOfLines={1}>
              {item.brand}
            </Text>
          ) : null}
          <Text variant="bodyStrong" numberOfLines={2}>
            {item.name ?? item.category ?? 'Item'}
          </Text>
          <View style={styles.priceRow}>
            {price ? (
              <Text variant="label" numeric>
                {price}
              </Text>
            ) : (
              <Text variant="body" tone="muted">
                Price in shop
              </Text>
            )}
            {item.mrp && item.price !== undefined && item.mrp > item.price ? (
              <Text variant="caption" tone="muted" numeric style={styles.strike}>
                {formatPrice(item.mrp)}
              </Text>
            ) : null}
            {off ? (
              <Text variant="caption" tone="success" weight="700" numeric>
                {off}% off
              </Text>
            ) : null}
          </View>
          {showShop ? (
            <View style={styles.shopRow}>
              <Icon name="storefront-outline" size={13} color="textMuted" />
              <Text variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
                {item.store.name}
              </Text>
            </View>
          ) : null}
        </View>
      </PressableScale>
      <View style={styles.heart}>
        <HeartButton storeId={item.storeId} productId={item.productId} name={item.name} />
      </View>
    </View>
  );
});

export function ProductCardSkeleton({ width }: { width?: number }) {
  const { radius } = useTheme();
  return (
    <View style={[{ width }, styles.wrap]} accessibilityLabel="Loading" accessible>
      <Skeleton height="auto" radius={radius.card} style={styles.photo} />
      <View style={styles.meta}>
        <Skeleton width="40%" height={10} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  photo: { aspectRatio: 4 / 5, overflow: 'hidden', width: '100%' },
  dim: { opacity: 0.55 },
  noPhoto: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  distance: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  soldOut: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '44%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heart: { position: 'absolute', top: 6, right: 6 },
  meta: { paddingTop: 8, paddingHorizontal: 2, gap: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 },
  strike: { textDecorationLine: 'line-through' },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  flex: { flex: 1 },
});
