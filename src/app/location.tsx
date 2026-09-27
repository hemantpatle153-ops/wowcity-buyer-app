import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { LocationPicker } from '@/components/LocationPicker';
import { Text } from '@/components/Text';
import { useSettings } from '@/state/settings';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const hasLocation = useSettings((s) => !!s.location);
  const done = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.bar}>
          <IconButton icon="chevron-back" label="Back" onPress={done} />
        </View>
        <Text variant="headline" accessibilityRole="header">
          Location and radius
        </Text>
        <Text variant="bodyLarge" tone="muted">
          We show shops and clothes around this spot.
        </Text>
        <LocationPicker />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Done" onPress={done} disabled={!hasLocation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 10, paddingBottom: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  bar: { marginLeft: -8, flexDirection: 'row' },
  footer: { paddingHorizontal: 20, paddingTop: 8, maxWidth: 640, width: '100%', alignSelf: 'center' },
});
