import { StyleSheet, View } from 'react-native';

import type { StoreSummary } from '@/api/types';

import { EmptyState } from './EmptyState';

/** react-native-maps has no web support; the web demo shows a friendly note instead. */
export default function ShopsMap({ shops }: { shops: StoreSummary[]; center?: { lat: number; lng: number } }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <EmptyState icon="map-outline" title="Map is on the phone app" message={`${shops.length} shops nearby are in the list view.`} />
    </View>
  );
}
