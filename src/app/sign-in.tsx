import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, isMock, session } from '@/api';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { completePendingSave } from '@/features/favourites';
import { useHaptics } from '@/hooks/useHaptics';
import { looksLikePhone, normaliseIdentifier } from '@/lib/identifier';
import { useAuth } from '@/state/auth';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme/ThemeProvider';

const RESEND_SECONDS = 30;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { colors, reduceMotion } = useTheme();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const pending = useAuth((s) => s.pendingSave);

  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const close = () => {
    useAuth.getState().setPendingSave(null);
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const requestCode = async () => {
    const id = normaliseIdentifier(identifier);
    if (!id) {
      setError(looksLikePhone(identifier) ? 'Enter a 10-digit mobile number.' : 'Enter a valid email address or mobile number.');
      haptics.warning();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestOtp(identifier.trim());
      setSentTo(res.sentTo);
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 300);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the code. Please try again.');
      haptics.warning();
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const s = await api.verifyOtp(identifier.trim(), value);
      await session.setSession(s);
      const outcome = await completePendingSave({ api }, useAuth.getState().pendingSave);
      useAuth.getState().setPendingSave(null);
      qc.invalidateQueries({ queryKey: ['favourites'] });
      haptics.success();
      toast(outcome === 'saved' ? 'Signed in and saved' : 'You’re signed in', { tone: 'success' });
      if (outcome === 'not_listed') toast('Signed in. That item is no longer listed.', { tone: 'danger' });
      if (router.canGoBack()) router.back();
      else router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not sign you in. Please try again.');
      setCode('');
      haptics.warning();
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.fill, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: (Platform.OS === 'ios' ? 12 : insets.top + 8), paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bar}>
          {step === 'code' ? (
            <IconButton icon="chevron-back" label="Change email or number" onPress={() => { setStep('identifier'); setError(null); }} />
          ) : (
            <View />
          )}
          <IconButton icon="close" label="Close sign in" onPress={close} />
        </View>

        <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
          <Icon name={pending ? 'heart' : 'person'} size={30} color="accent" />
        </View>

        {step === 'identifier' ? (
          <Animated.View key="id" entering={reduceMotion ? undefined : FadeInRight} exiting={reduceMotion ? undefined : FadeOutLeft} style={styles.step}>
            <Text variant="headline" accessibilityRole="header">
              {pending ? 'Sign in to save' : 'Sign in'}
            </Text>
            <Text variant="bodyLarge" tone="muted">
              {pending
                ? 'We’ll save this item as soon as you’re in. No password needed.'
                : 'Use your email or mobile number. We’ll send you a 6-digit code. No password needed.'}
            </Text>
            <TextField
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                if (error) setError(null);
              }}
              placeholder="Email or mobile number"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType={looksLikePhone(identifier) && identifier.length > 0 ? 'phone-pad' : 'email-address'}
              returnKeyType="send"
              onSubmitEditing={requestCode}
              accessibilityLabel="Email or mobile number"
              autoFocus
              error={!!error}
              testID="identifier-input"
            />
            {error ? <ErrorText message={error} /> : null}
            <Button label="Send code" onPress={requestCode} loading={busy} disabled={!identifier.trim()} testID="send-code" />
            <Text variant="caption" tone="muted" align="center">
              By continuing you agree to WowCity’s terms and privacy policy. A new account is created the first time you sign in.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View key="code" entering={reduceMotion ? undefined : FadeInRight} exiting={reduceMotion ? undefined : FadeOutLeft} style={styles.step}>
            <Text variant="headline" accessibilityRole="header">
              Enter the code
            </Text>
            <Text variant="bodyLarge" tone="muted">
              We sent a 6-digit code to <Text variant="bodyLarge" weight="700">{sentTo}</Text>.
            </Text>
            <CodeInput
              ref={codeRef}
              value={code}
              error={!!error}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
                if (v.length === 6) verify(v);
              }}
            />
            {error ? <ErrorText message={error} /> : null}
            {isMock ? (
              <Text variant="caption" tone="muted">
                Demo mode: any 6-digit code works (000000 shows the wrong-code message).
              </Text>
            ) : null}
            <Button label="Verify and sign in" onPress={() => verify()} loading={busy} disabled={code.length !== 6} testID="verify-code" />
            <PressableScale
              onPress={resendIn > 0 ? undefined : requestCode}
              accessibilityRole="button"
              accessibilityState={{ disabled: resendIn > 0 }}
              accessibilityLabel={resendIn > 0 ? `Resend code in ${resendIn} seconds` : 'Resend code'}
              style={styles.resend}
            >
              <Text variant="bodyStrong" tone={resendIn > 0 ? 'muted' : 'accent'} numeric>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </Text>
            </PressableScale>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Icon name="alert-circle" size={18} color="danger" />
      <Text variant="bodyStrong" tone="danger" style={styles.fill}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 8, maxWidth: 520, width: '100%', alignSelf: 'center' },
  bar: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -8 },
  badge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8 },
  step: { gap: 14 },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  resend: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
