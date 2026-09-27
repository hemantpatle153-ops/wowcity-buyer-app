import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProductGrid } from '@/components/ProductGrid';
import { Text } from '@/components/Text';
import { flattenPages, useFavourites } from '@/hooks/queries';
import { useAuth } from '@/state/auth';

export default function Saved() {
  const insets = useSafeAreaInsets();
  const status = useAuth((s) => s.status);
  const favs = useFavourites();
  const items = flattenPages(favs.data?.pages);
  const total = favs.data?.pages[0]?.total;
  const soldOut = items.filter((i) => !i.inStock).length;

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text variant="headline" accessibilityRole="header">
        Saved
      </Text>
      {status === 'signedIn' && total ? (
        <Text variant="body" tone="muted">
          {total} saved{soldOut ? ` · ${soldOut} sold out at the shop` : ''}
        </Text>
      ) : null}
    </View>
  );

  if (status !== 'signedIn') {
    return (
      <View style={styles.fill}>
        {header}
        <EmptyState
          icon="heart-outline"
          title="Keep the things you love"
          message="Sign in with your email or mobile number to save clothes and find them again on any phone."
          actionLabel="Sign in"
          onAction={() => router.push('/sign-in')}
        />
      </View>
    );
  }

  return (
    <ProductGrid
      testID="saved-grid"
      header={header}
      items={items}
      loading={favs.isLoading}
      error={favs.error}
      hasNextPage={favs.hasNextPage}
      fetchingNextPage={favs.isFetchingNextPage}
      onEndReached={() => favs.fetchNextPage()}
      onRefresh={() => favs.refetch()}
      onRetry={() => favs.refetch()}
      empty={
        <EmptyState
          icon="heart-outline"
          title="Nothing saved yet"
          message="Tap the heart on anything you like. It’ll wait for you here, even if it sells out."
          actionLabel="Discover nearby"
          onAction={() => router.navigate('/home')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: 16, gap: 4, marginBottom: 14 },
});
