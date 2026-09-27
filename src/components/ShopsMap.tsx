import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { StoreSummary } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';

import { openShop } from './ShopCard';

/** Map of shops that share their address. Android needs a Google Maps API key (see STATUS.md). */
export default function ShopsMap({ shops, center }: { shops: StoreSummary[]; center?: { lat: number; lng: number } }) {
  const { colors } = useTheme();
  const located = shops.filter((s) => s.latitude !== undefined && s.longitude !== undefined);
  const first = center ?? (located[0] ? { lat: located[0].latitude!, lng: located[0].longitude! } : { lat: 23.2599, lng: 77.4126 });
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ latitude: first.lat, longitude: first.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      showsUserLocation={!!center}
      accessibilityLabel={`Map of ${located.length} nearby shops`}
    >
      {located.map((s) => (
        <Marker
          key={s.storeId}
          coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
          title={s.name}
          description={`${s.inStockProducts} items in stock`}
          pinColor={colors.accent}
          onCalloutPress={() => openShop(s.storeId)}
        />
      ))}
    </MapView>
  );
}
