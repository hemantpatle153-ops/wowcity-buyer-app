import * as Location from 'expo-location';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { RADIUS_OPTIONS, useSettings, type RadiusKm } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { Text } from './Text';
import { TextField } from './TextField';

const CITIES = ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'];

function labelFrom(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return 'Current location';
  const area = place.district || place.subregion || place.name;
  const city = place.city;
  if (area && city && area !== city) return `${area}, ${city}`;
  return city || area || 'Current location';
}

/**
 * Location + radius chooser. Location permission is only ever requested from
 * here, when the buyer taps "Use my current location"; a city works instead.
 */
export function LocationPicker() {
  const { colors, radius } = useTheme();
  const location = useSettings((s) => s.location);
  const radiusKm = useSettings((s) => s.radiusKm);
  const setLocation = useSettings((s) => s.setLocation);
  const setRadius = useSettings((s) => s.setRadius);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [city, setCity] = useState(location?.kind === 'city' ? location.city : '');

  const useCurrent = async () => {
    setLocating(true);
    setProblem(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setDenied(true);
        return;
      }
      setDenied(false);
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      let label = 'Current location';
      if (Platform.OS !== 'web') {
        try {
          const [place] = await Location.reverseGeocodeAsync(pos.coords);
          label = labelFrom(place);
        } catch {
          // The label is cosmetic; coordinates are what matter.
        }
      }
      setLocation({ kind: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude, label });
    } catch {
      setProblem('We couldn’t get your location. Check that location is on, or type your city below.');
    } finally {
      setLocating(false);
    }
  };

  const chooseCity = (c: string) => {
    const v = c.trim().replace(/\s+/g, ' ');
    if (!v) return;
    setCity(v);
    setLocation({ kind: 'city', city: v });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.block}>
        <Button
          label={location?.kind === 'gps' ? `Using ${location.label}` : 'Use my current location'}
          icon={location?.kind === 'gps' ? 'checkmark-circle' : 'locate'}
          variant={location?.kind === 'gps' ? 'soft' : 'primary'}
          onPress={useCurrent}
          loading={locating}
          accessibilityHint="Asks for location permission to show shops and clothes near you"
          testID="use-location"
        />
        <Text variant="caption" tone="muted" align="center">
          Your location is only used to sort and filter what you see. It isn’t stored on our servers.
        </Text>
        {denied ? (
          <View style={[styles.note, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]} accessibilityRole="alert">
            <Icon name="information-circle" size={20} color="info" />
            <View style={styles.flex}>
              <Text variant="body">Location is off for WowCity. You can type your city instead, or turn it on in Settings.</Text>
              {Platform.OS !== 'web' ? (
                <Button label="Open Settings" variant="ghost" size="md" onPress={() => Linking.openSettings()} style={styles.left} />
              ) : null}
            </View>
          </View>
        ) : null}
        {problem ? (
          <Text variant="body" tone="danger" accessibilityRole="alert">
            {problem}
          </Text>
        ) : null}
      </View>

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text variant="caption" tone="muted" uppercase weight="700">
          or choose a city
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.block}>
        <TextField
            leading={<Icon name="business-outline" size={20} color="textMuted" />}
            value={city}
            onChangeText={setCity}
            onSubmitEditing={() => chooseCity(city)}
            onBlur={() => city.trim() && location?.kind !== 'gps' && chooseCity(city)}
            placeholder="Type your city"
            autoCapitalize="words"
            returnKeyType="done"
            accessibilityLabel="City"
            testID="city-input"
          />
        <View style={styles.chips}>
          {CITIES.map((c) => (
            <Chip key={c} label={c} selected={location?.kind === 'city' && location.city === c} onPress={() => chooseCity(c)} />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <Text variant="label" accessibilityRole="header">
          How far will you go?
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {RADIUS_OPTIONS.map((r) => (
            <Chip
              key={r}
              label={`${r} km`}
              selected={radiusKm === r}
              onPress={() => setRadius(r as RadiusKm)}
              accessibilityLabel={`Within ${r} kilometres`}
            />
          ))}
        </View>
        {location?.kind === 'city' ? (
          <Text variant="caption" tone="muted">
            With a city, shops are sorted by newest instead of distance. Use your location for “nearest first”.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24 },
  block: { gap: 10 },
  flex: { flex: 1 },
  left: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  note: { flexDirection: 'row', gap: 10, padding: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
});
