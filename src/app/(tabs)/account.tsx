import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, isMock, session } from '@/api';
import { ApiError } from '@/api/client';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { ShopAvatar } from '@/components/ShopCard';
import { Text } from '@/components/Text';
import { PRIVACY_POLICY_URL } from '@/lib/config';
import { formatPhoneForDisplay } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useSaved } from '@/state/saved';
import { locationLabel, useSettings } from '@/state/settings';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { accentLabels, modeLabels, textSizeLabels } from '@/theme/tokens';

export default function Account() {
  const insets = useSafeAreaInsets();
  const { colors, radius, textScale } = useTheme();
  const qc = useQueryClient();
  const { status, user } = useAuth();
  const location = useSettings((s) => s.location);
  const radiusKm = useSettings((s) => s.radiusKm);
  const appearance = useSettings((s) => s.appearance);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const signedIn = status === 'signedIn' && !!user;
  const who = user?.name || user?.email || (user?.phone ? formatPhoneForDisplay(user.phone) : 'WowCity buyer');

  const forgetLocalAccount = async () => {
    await session.clear();
    useSaved.getState().clear();
    qc.removeQueries({ queryKey: ['favourites'] });
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // Signing out locally is what matters.
    }
    await forgetLocalAccount();
    toast('Signed out');
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      const u = await api.updateMe({ name: trimmed });
      useAuth.getState().setUser(u);
      setEditing(false);
      toast('Name updated', { tone: 'success' });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not update your name.', { tone: 'danger' });
    } finally {
      setSavingName(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await forgetLocalAccount();
      setConfirmDelete(false);
      toast('Your account and saved items have been deleted', { tone: 'success' });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not delete your account. Please try again.', { tone: 'danger' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <Text variant="headline" accessibilityRole="header">
          Account
        </Text>

        <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card }]}>
          {signedIn ? (
            <>
              <View style={styles.profileHead}>
                <ShopAvatar name={user?.name || who} size={56} />
                <View style={styles.fill}>
                  <Text variant="subtitle" numberOfLines={1}>
                    {user?.name || 'Add your name'}
                  </Text>
                  <Text variant="body" tone="muted" numberOfLines={1}>
                    {user?.email ?? (user?.phone ? formatPhoneForDisplay(user.phone) : '')}
                  </Text>
                </View>
              </View>
              {editing ? (
                <View style={styles.editRow}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    maxLength={60}
                    returnKeyType="done"
                    onSubmitEditing={saveName}
                    accessibilityLabel="Your name"
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSunken, borderRadius: radius.control, fontSize: Math.round(16 * textScale) }]}
                  />
                  <Button label="Save" size="md" onPress={saveName} loading={savingName} disabled={!name.trim()} />
                </View>
              ) : (
                <Button
                  label={user?.name ? 'Edit name' : 'Add your name'}
                  variant="secondary"
                  size="md"
                  icon="create-outline"
                  onPress={() => {
                    setName(user?.name ?? '');
                    setEditing(true);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.profileHead}>
                <View style={[styles.guest, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="person" size={26} color="accent" />
                </View>
                <View style={styles.fill}>
                  <Text variant="subtitle">You’re browsing as a guest</Text>
                  <Text variant="body" tone="muted">
                    Sign in to save favourites on any phone.
                  </Text>
                </View>
              </View>
              <Button label="Sign in with email or mobile" icon="log-in-outline" onPress={() => router.push('/sign-in')} />
            </>
          )}
        </View>

        <ListGroup title="Browsing">
          <ListRow
            icon="location-outline"
            label="Location and radius"
            value={`${locationLabel(location)} · ${radiusKm} km`}
            onPress={() => router.push('/location')}
          />
          <ListRow
            icon="color-palette-outline"
            label="Appearance"
            value={`${modeLabels[appearance.mode]} · ${accentLabels[appearance.accent]} · ${textSizeLabels[appearance.textSize]} text`}
            onPress={() => router.push('/appearance')}
          />
          <ListRow icon="notifications-outline" label="Notifications" value="Coming soon" disabled last />
        </ListGroup>

        <ListGroup title="About">
          <ListRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            external
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => {})}
          />
          <ListRow
            icon="information-circle-outline"
            label="Your location stays on your phone"
            value="It’s only used to sort and filter what you see."
            last
          />
        </ListGroup>

        {signedIn ? (
          <ListGroup title="Account">
            <ListRow icon="log-out-outline" label="Sign out" onPress={signOut} />
            <ListRow
              icon="trash-outline"
              label="Delete account"
              value="Removes your login and saved items"
              danger
              last
              onPress={() => setConfirmDelete(true)}
              hint="Asks you to confirm first"
            />
          </ListGroup>
        ) : null}

        <Text variant="caption" tone="muted" align="center" style={styles.version}>
          WowCity {Constants.expoConfig?.version ?? ''}
          {isMock ? ' · Demo data' : ''}
        </Text>
      </ScrollView>

      <BottomSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        footer={
          <>
            <Button label="Keep account" variant="secondary" style={styles.fill} onPress={() => setConfirmDelete(false)} />
            <Button label="Delete" variant="danger" icon="trash-outline" style={styles.fill} loading={deleting} onPress={deleteAccount} testID="confirm-delete" />
          </>
        }
      >
        <View style={styles.sheetBody}>
          <Text variant="bodyLarge">This permanently deletes:</Text>
          {['Your WowCity buyer login', 'All your saved items', 'Your name on WowCity'].map((t) => (
            <View key={t} style={styles.bullet}>
              <Icon name="close-circle" size={18} color="danger" />
              <Text variant="bodyLarge">{t}</Text>
            </View>
          ))}
          <Text variant="body" tone="muted">
            You can keep browsing without an account, and sign up again any time. This can’t be undone.
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  profile: { padding: 16, gap: 14, borderWidth: StyleSheet.hairlineWidth },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  guest: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  editRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14 },
  version: { marginTop: 4 },
  sheetBody: { gap: 10, paddingTop: 8 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
