import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { StoreSummary } from '@/api/types';
import { formatDistance, initials } from '@/lib/format';
import { PHOTO_BLURHASH, PHOTO_TRANSITION } from '@/lib/images';
import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

export function openShop(storeId: string) {
  router.push({ pathname: '/shop/[storeId]', params: { storeId } });
}

export function shopA11yLabel(s: StoreSummary) {
  const d = formatDistance(s.distanceKm);
  return [s.name, s.address ?? s.city, d ? `${d} away` : null, `${s.inStockProducts} items in stock`].filter(Boolean).join(', ');
}

export function ShopAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent,
      }}
    >
      <Text variant={size > 60 ? 'headline' : 'subtitle'} tone="onAccent" weight="800">
        {initials(name)}
      </Text>
    </View>
  );
}

/** Card for the home carousel: a product photo from the shop as cover, then name, distance and stock. */
export function ShopTile({ shop, cover }: { shop: StoreSummary; cover?: string | null }) {
  const { colors, radius } = useTheme();
  const d = formatDistance(shop.distanceKm);
  return (
    <PressableScale
      onPress={() => openShop(shop.storeId)}
      haptic="tap"
      accessibilityLabel={shopA11yLabel(shop)}
      accessibilityHint="Opens the shop"
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}
    >
      <View style={[styles.cover, { backgroundColor: colors.accentSoft }]}>
        {cover ? (
          <Image source={{ uri: cover }} placeholder={{ blurhash: PHOTO_BLURHASH }} transition={PHOTO_TRANSITION} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
        ) : null}
        {d ? (
          <View style={[styles.coverPill, { backgroundColor: colors.photoChip }]}>
            <Icon name="navigate" size={11} color="onPhoto" />
            <Text variant="caption" tone="onPhoto" weight="700" numeric>
              {d}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.tileBody}>
        <View style={[styles.avatarRing, { borderColor: colors.surface }]}>
          <ShopAvatar name={shop.name} size={40} />
        </View>
        <Text variant="bodyStrong" numberOfLines={1}>
          {shop.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {shop.inStockProducts} items in stock{shop.city ? ` · ${shop.city}` : ''}
        </Text>
      </View>
    </PressableScale>
  );
}

export function ShopTileSkeleton() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
      <Skeleton width="100%" height={96} radius={0} />
      <View style={[styles.tileBody, { gap: 8, paddingTop: 12 }]}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="55%" height={10} />
      </View>
    </View>
  );
}

/** Full-width row for the Nearby shops list. */
export function ShopRow({ shop }: { shop: StoreSummary }) {
  const { colors, radius } = useTheme();
  const d = formatDistance(shop.distanceKm);
  return (
    <PressableScale
      onPress={() => openShop(shop.storeId)}
      haptic="tap"
      scaleTo={0.98}
      accessibilityLabel={shopA11yLabel(shop)}
      accessibilityHint="Opens the shop"
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}
    >
      <ShopAvatar name={shop.name} />
      <View style={styles.rowBody}>
        <Text variant="label" numberOfLines={1}>
          {shop.name}
        </Text>
        <Text variant="body" tone="muted" numberOfLines={2}>
          {shop.address ?? [shop.city, shop.state].filter(Boolean).join(', ')}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
            <Icon name="shirt-outline" size={12} color="accent" />
            <Text variant="caption" tone="accent" weight="700" numeric>
              {shop.inStockProducts} in stock
            </Text>
          </View>
          {d ? (
            <View style={styles.inline}>
              <Icon name="navigate-outline" size={13} color="textMuted" />
              <Text variant="caption" tone="muted" weight="600" numeric>
                {d}
              </Text>
            </View>
          ) : null}
          {shop.phone ? <Icon name="call-outline" size={13} color="textMuted" /> : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="textMuted" />
    </PressableScale>
  );
}

export function ShopRowSkeleton() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
      <Skeleton width={52} height={52} radius={16} />
      <View style={[styles.rowBody, { gap: 8 }]}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="85%" height={12} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 200, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cover: { height: 96, width: '100%' },
  coverPill: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tileBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 2 },
  avatarRing: { marginTop: -22, marginBottom: 4, alignSelf: 'flex-start', borderWidth: 3, borderRadius: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  rowBody: { flex: 1, gap: 3 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
