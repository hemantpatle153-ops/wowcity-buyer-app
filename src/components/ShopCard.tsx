import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { StoreSummary } from '@/api/types';
import { formatDistance, initials } from '@/lib/format';
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

/** Compact card for the home carousel. */
export function ShopTile({ shop }: { shop: StoreSummary }) {
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
      <View style={styles.tileTop}>
        <ShopAvatar name={shop.name} size={44} />
        {d ? (
          <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
            <Icon name="navigate" size={11} color="accent" />
            <Text variant="caption" tone="accent" weight="700" numeric>
              {d}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="bodyStrong" numberOfLines={1}>
        {shop.name}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {shop.inStockProducts} in stock · {shop.city ?? ''}
      </Text>
    </PressableScale>
  );
}

export function ShopTileSkeleton() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
      <Skeleton width={44} height={44} radius={14} />
      <Skeleton width="80%" height={14} />
      <Skeleton width="55%" height={10} />
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
  tile: { width: 168, padding: 14, gap: 6, borderWidth: StyleSheet.hairlineWidth },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  rowBody: { flex: 1, gap: 3 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
