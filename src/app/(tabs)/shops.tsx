import { useState, type ComponentType } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type { StoreSummary } from '@/api/types';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { LocationPill } from '@/components/LocationPill';
import { SearchField } from '@/components/SearchField';
import { ShopRow, ShopRowSkeleton } from '@/components/ShopCard';
import { Text } from '@/components/Text';
import { useStores } from '@/hooks/queries';
import { MAP_ENABLED } from '@/lib/config';
import { RADIUS_OPTIONS, useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

type MapProps = { shops: StoreSummary[]; center?: { lat: number; lng: number } };
// Loaded only when the map flag is on, so builds without a Maps key never touch react-native-maps.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ShopsMap: ComponentType<MapProps> | null = MAP_ENABLED ? require('@/components/ShopsMap').default : null;

export default function Shops() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const stores = useStores(text.trim());
  const radiusKm = useSettings((s) => s.radiusKm);
  const setRadius = useSettings((s) => s.setRadius);
  const location = useSettings((s) => s.location);
  const [refreshing, setRefreshing] = useState(false);
  const wider = RADIUS_OPTIONS.find((r) => r > radiusKm);
  const shops = stores.data ?? [];

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <LocationPill />
      <Text variant="headline" accessibilityRole="header">
        Shops nearby
      </Text>
      <Text variant="body" tone="muted" accessibilityLiveRegion="polite">
        {stores.isSuccess ? `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} within ${radiusKm} km` : 'Finding shops around you…'}
      </Text>
      <SearchField value={text} onChangeText={setText} onClear={() => setText('')} placeholder="Search shops by name" />
      {ShopsMap ? (
        <View style={styles.toggle} accessibilityRole="tablist">
          <Chip label="List" icon="list" selected={view === 'list'} onPress={() => setView('list')} />
          <Chip label="Map" icon="map-outline" selected={view === 'map'} onPress={() => setView('map')} />
        </View>
      ) : null}
    </View>
  );

  if (ShopsMap && view === 'map') {
    return (
      <View style={styles.fill}>
        {header}
        <View style={[styles.fill, styles.mapWrap, { borderColor: colors.border }]}>
          <ShopsMap shops={shops} center={location?.kind === 'gps' ? { lat: location.lat, lng: location.lng } : undefined} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={shops}
      keyExtractor={(s) => s.storeId}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <ShopRow shop={item} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      ListHeaderComponent={header}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          colors={[colors.accent]}
          onRefresh={async () => {
            setRefreshing(true);
            await stores.refetch();
            setRefreshing(false);
          }}
        />
      }
      ListEmptyComponent={
        stores.isLoading ? (
          <View style={styles.skeletons}>
            <ShopRowSkeleton />
            <ShopRowSkeleton />
            <ShopRowSkeleton />
          </View>
        ) : stores.error ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn’t load shops" message={(stores.error as Error).message} actionLabel="Try again" onAction={() => stores.refetch()} />
        ) : text ? (
          <EmptyState icon="search-outline" title="No shop by that name" message={`No shop matching “${text}” within ${radiusKm} km.`} actionLabel="Clear search" onAction={() => setText('')} />
        ) : (
          <EmptyState
            icon="map-outline"
            title={`No shops within ${radiusKm} km`}
            message="Try a wider radius or another area."
            actionLabel={wider ? `Widen to ${wider} km` : 'Change location'}
            onAction={() => (wider ? setRadius(wider) : router.push('/location'))}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  toggle: { flexDirection: 'row', gap: 8 },
  list: { paddingBottom: 32 },
  sep: { height: 10 },
  row: { paddingHorizontal: 16 },
  skeletons: { gap: 10, paddingHorizontal: 16 },
  mapWrap: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
