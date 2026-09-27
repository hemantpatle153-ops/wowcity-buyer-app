import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import type { ProductCard, ProductDetail, Variant } from '@/api/types';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Gallery } from '@/components/Gallery';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { SaveButton } from '@/components/SaveButton';
import { ShopAvatar } from '@/components/ShopCard';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useCardPreview, useProduct } from '@/hooks/queries';
import {
  discountPercent,
  formatDetailValue,
  formatDistance,
  formatPhoneForDisplay,
  formatPrice,
  formatPriceRange,
} from '@/lib/format';
import { callShop, canGetDirections, openDirections } from '@/lib/maps';
import { sharePhoto, shareMessage, shareText, productLink } from '@/lib/share';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { swatchFor } from '@/theme/swatches';

const MAX_WIDTH = 640;

/** Detail from the API, or a partial built from the tapped card while it loads. */
function fromCard(card: ProductCard): ProductDetail {
  return {
    productId: card.productId,
    storeId: card.storeId,
    name: card.name,
    brand: card.brand,
    category: card.category,
    inStock: card.inStock,
    images: card.image ? [card.image] : [],
    variants: [],
    store: card.store,
  };
}

type Availability = { value: string; inStock: boolean }[];

function availability(variants: Variant[], key: 'size' | 'colour' | 'style'): Availability {
  const map = new Map<string, boolean>();
  for (const v of variants) {
    const value = v[key];
    if (!value) continue;
    map.set(value, (map.get(value) ?? false) || v.inStock);
  }
  return [...map].map(([value, inStock]) => ({ value, inStock }));
}

function priceSummary(variants: Variant[], card?: ProductCard) {
  const inStock = variants.filter((v) => v.inStock);
  const pool = inStock.length ? inStock : variants;
  const prices = pool.map((v) => v.price).filter((p): p is number => p !== undefined);
  const mrps = pool.map((v) => v.mrp).filter((p): p is number => p !== undefined);
  if (!prices.length) return { price: card?.price, maxPrice: card?.maxPrice, mrp: card?.mrp };
  const price = Math.min(...prices);
  const max = Math.max(...prices);
  return { price, maxPrice: max > price ? max : undefined, mrp: mrps.length ? Math.max(...mrps) : undefined };
}

export default function ProductScreen() {
  const { storeId, productId } = useLocalSearchParams<{ storeId: string; productId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, radius, reduceMotion } = useTheme();
  const preview = useCardPreview(storeId, productId);
  const query = useProduct(storeId, productId);
  const product = query.data ?? (preview ? fromCard(preview) : undefined);
  const loadingDetail = !query.data && query.isLoading;

  const sizes = useMemo(() => availability(product?.variants ?? [], 'size'), [product]);
  const colours = useMemo(() => availability(product?.variants ?? [], 'colour'), [product]);
  const stylesAvail = useMemo(() => availability(product?.variants ?? [], 'style'), [product]);
  const { price, maxPrice, mrp } = priceSummary(product?.variants ?? [], preview);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const topBar = (
    <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
      <IconButton icon="chevron-back" label="Back" onPress={back} variant="photo" />
      {product ? (
        <IconButton
          icon={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
          label="Share this item"
          variant="photo"
          onPress={async () => {
            const res = await shareText(shareMessage({ ...product, price, maxPrice }), productLink(product.storeId, product.productId));
            if (res === 'copied') toast('Link copied', { tone: 'success' });
          }}
        />
      ) : null}
    </View>
  );

  if (!product) {
    const notFound = query.error instanceof ApiError && query.error.isNotFound;
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg }]}>
        {query.isLoading ? (
          <View>
            <Skeleton height="auto" radius={0} style={{ aspectRatio: 1 / 1.2, width: '100%' }} />
            <View style={styles.skeletonBody}>
              <Skeleton width="70%" height={26} />
              <Skeleton width="95%" height={14} />
              <Skeleton width="80%" height={14} />
            </View>
          </View>
        ) : (
          <View style={[styles.fill, { paddingTop: insets.top + 64 }]}>
            <EmptyState
              icon={notFound ? 'bag-remove-outline' : 'refresh-outline'}
              title={notFound ? 'No longer listed' : 'Couldn’t load this item'}
              message={notFound ? 'The shop has taken this item off WowCity.' : (query.error as Error | null)?.message}
              actionLabel={notFound ? 'Keep browsing' : 'Try again'}
              onAction={notFound ? () => router.replace('/home') : () => query.refetch()}
            />
          </View>
        )}
        {topBar}
      </View>
    );
  }

  const store = product.store;
  const distance = formatDistance(store.distanceKm);
  const off = discountPercent(price, mrp);
  const priceText = formatPriceRange(price, maxPrice);
  const customRows = (product.details ?? [])
    .map((d) => ({ label: d.label, value: formatDetailValue(d.value) }))
    .filter((d): d is { label: string; value: string } => !!d.value);

  const rows: { label: string; value: string }[] = [];
  if (product.brand) rows.push({ label: 'Brand', value: product.brand });
  if (product.category) rows.push({ label: 'Category', value: product.category });
  if (sizes.length === 1) rows.push({ label: 'Size', value: sizes[0].value });
  if (colours.length === 1) rows.push({ label: 'Colour', value: colours[0].value });
  if (stylesAvail.length === 1) rows.push({ label: 'Style', value: stylesAvail[0].value });
  rows.push(...customRows);

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.center}>
          {/* 1) Photos */}
          <Gallery images={product.images} name={product.name} maxWidth={MAX_WIDTH} />

          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(60).springify().damping(20)}
            style={[styles.sheet, { backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }]}
          >
            {!product.inStock ? (
              <View
                style={[styles.soldOut, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderStrong, borderRadius: radius.control }]}
                accessibilityRole="alert"
              >
                <Icon name="close-circle" size={20} color="danger" />
                <View style={styles.fill}>
                  <Text variant="label" tone="danger">
                    Sold out at this shop
                  </Text>
                  <Text variant="body" tone="muted">
                    Save it to keep an eye on it, or ask the shop when it’s back.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* 2) Description */}
            <Text variant="headline" accessibilityRole="header">
              {product.name ?? product.category ?? 'Item'}
            </Text>
            {product.description ? (
              <Text variant="bodyLarge" tone="muted" style={styles.description}>
                {product.description}
              </Text>
            ) : loadingDetail ? (
              <View style={styles.gap8}>
                <Skeleton width="95%" height={14} />
                <Skeleton width="75%" height={14} />
              </View>
            ) : null}

            {/* 3) Labelled detail rows, price and availability */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
              {priceText ? (
                <View style={styles.priceRow} accessible accessibilityLabel={`Price ${priceText}${mrp && price && mrp > price ? `, MRP ${formatPrice(mrp)}, ${off}% off` : ''}`}>
                  <Text variant="headline" numeric>
                    {priceText}
                  </Text>
                  {mrp && price !== undefined && mrp > price ? (
                    <Text variant="bodyLarge" tone="muted" numeric style={styles.strike}>
                      MRP {formatPrice(mrp)}
                    </Text>
                  ) : null}
                  {off ? (
                    <View style={[styles.offPill, { borderColor: colors.success }]}>
                      <Text variant="caption" tone="success" weight="800" numeric>
                        {off}% OFF
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : !loadingDetail ? (
                <Text variant="bodyLarge" tone="muted">
                  Ask the shop for the price
                </Text>
              ) : null}
              {rows.map((r, i) => (
                <View
                  key={`${r.label}-${i}`}
                  style={[styles.detailRow, { borderTopColor: colors.border }]}
                  accessible
                  accessibilityLabel={`${r.label}: ${r.value}`}
                >
                  <Text variant="body" tone="muted" style={styles.detailLabel}>
                    {r.label}
                  </Text>
                  <Text variant="bodyStrong" style={styles.detailValue}>
                    {r.value}
                  </Text>
                </View>
              ))}
              {loadingDetail ? (
                <View style={[styles.gap8, { paddingTop: 12 }]}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="50%" height={14} />
                </View>
              ) : null}
            </View>

            {sizes.length > 1 ? <AvailabilityRow title="Sizes" items={sizes} /> : null}
            {colours.length > 1 ? <AvailabilityRow title="Colours" items={colours} withSwatch /> : null}
            {stylesAvail.length > 1 ? <AvailabilityRow title="Styles" items={stylesAvail} /> : null}

            {/* 4) Save */}
            <SaveButton storeId={product.storeId} productId={product.productId} name={product.name} />

            {/* Shop card */}
            <View style={[styles.card, styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
              <View style={styles.shopHead}>
                <ShopAvatar name={store.name} />
                <View style={styles.fill}>
                  <Text variant="label" numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text variant="body" tone="muted" numberOfLines={2}>
                    {[store.address ?? store.city, distance ? `${distance} away` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={styles.shopActions}>
                {canGetDirections(store) ? (
                  <Button label="Directions" icon="navigate" size="md" style={styles.fill} onPress={() => openDirections(store)} />
                ) : null}
                {store.phone ? (
                  <Button
                    label="Call"
                    icon="call"
                    variant="soft"
                    size="md"
                    style={styles.fill}
                    accessibilityLabel={`Call ${store.name}, ${formatPhoneForDisplay(store.phone)}`}
                    onPress={() => callShop(store.phone!)}
                  />
                ) : null}
              </View>
              <Button
                label="See the shop"
                variant="secondary"
                size="md"
                icon="storefront-outline"
                onPress={() => router.push({ pathname: '/shop/[storeId]', params: { storeId: store.storeId } })}
              />
            </View>

            <View style={styles.shareRow}>
              <Button
                label="Share"
                variant="ghost"
                size="md"
                icon="share-social-outline"
                onPress={async () => {
                  const res = await shareText(shareMessage({ ...product, price, maxPrice }), productLink(product.storeId, product.productId));
                  if (res === 'copied') toast('Link copied', { tone: 'success' });
                }}
              />
              {Platform.OS !== 'web' && product.images[0] ? (
                <Button
                  label="Share photo"
                  variant="ghost"
                  size="md"
                  icon="image-outline"
                  onPress={() =>
                    sharePhoto(product.images[0], product.name ?? 'wowcity').catch(() =>
                      toast('Couldn’t share the photo.', { tone: 'danger' }),
                    )
                  }
                />
              ) : null}
            </View>

            {product.tags?.length ? (
              <View style={styles.tags}>
                {product.tags.map((t) => (
                  <Chip
                    key={t}
                    label={`#${t}`}
                    onPress={() => router.navigate({ pathname: '/search', params: { q: t } })}
                    accessibilityLabel={`Search ${t}`}
                  />
                ))}
              </View>
            ) : null}
          </Animated.View>
        </View>
      </ScrollView>
      {topBar}
    </View>
  );
}

function AvailabilityRow({ title, items, withSwatch }: { title: string; items: Availability; withSwatch?: boolean }) {
  const soldOut = items.filter((i) => !i.inStock).length;
  return (
    <View style={styles.avail}>
      <View style={styles.availHead}>
        <Text variant="label" accessibilityRole="header">
          {title}
        </Text>
        {soldOut ? (
          <Text variant="caption" tone="muted">
            Crossed out = sold out here
          </Text>
        ) : null}
      </View>
      <View style={styles.tags}>
        {items.map((i) => (
          <Chip
            key={i.value}
            label={i.value}
            swatch={withSwatch ? swatchFor(i.value) : undefined}
            strike={!i.inStock}
            icon={i.inStock ? undefined : 'close'}
            accessibilityLabel={`${i.value}, ${i.inStock ? 'in stock' : 'sold out at this shop'}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  topBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { marginTop: -20, paddingHorizontal: 16, paddingTop: 20, gap: 14 },
  soldOut: { flexDirection: 'row', gap: 10, padding: 12, borderWidth: 1, alignItems: 'flex-start' },
  description: { marginTop: -4 },
  card: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 4, paddingBottom: 8 },
  strike: { textDecorationLine: 'line-through' },
  offPill: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  detailRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  detailLabel: { width: '38%' },
  detailValue: { flex: 1 },
  avail: { gap: 4 },
  availHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  shopCard: { gap: 12, paddingVertical: 16 },
  shopHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  shopActions: { flexDirection: 'row', gap: 10 },
  shareRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  gap8: { gap: 8 },
  skeletonBody: { padding: 16, gap: 12 },
});
