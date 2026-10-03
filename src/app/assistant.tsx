import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { ProductCardView } from '@/components/ProductCard';
import { Text } from '@/components/Text';
import { ASSISTANT_NAME, friendlyError, historyFor, SUGGESTIONS, type ChatItem } from '@/features/assistant/chat';
import { useAuth } from '@/state/auth';
import { locationLabel, locationParams, useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

/** Ask Sarah: describe what you want, get clothes in stock at shops within your distance. */
export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, reduceMotion } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const location = useSettings((s) => s.location);
  const radiusKm = useSettings((s) => s.radiusKm);
  const signedIn = useAuth((s) => s.status === 'signedIn');
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatItem[] = [...items, { id: Date.now(), role: 'user', content: question }];
    setItems(next);
    setDraft('');
    setBusy(true);
    try {
      const reply = await api.askAssistant({ messages: historyFor(next), ...locationParams(location, radiusKm) }, signedIn);
      setItems((list) => [...list, { id: Date.now(), role: 'assistant', content: reply.answer, toolsUsed: reply.toolsUsed, products: reply.products }]);
    } catch (error) {
      setItems((list) => [...list, { id: Date.now(), role: 'assistant', content: friendlyError(error), failed: true }]);
    } finally {
      setBusy(false);
    }
  }

  const canSend = !busy && draft.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label="Back" variant="plain" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <View style={{ flex: 1 }}>
          <Text variant="subtitle" accessibilityRole="header">
            Ask {ASSISTANT_NAME}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            In stock within {radiusKm} km of {locationLabel(location)}
          </Text>
        </View>
        {items.length ? <IconButton icon="refresh" label="New chat" variant="plain" onPress={() => setItems([])} /> : null}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: !reduceMotion })}
        >
          {items.length === 0 ? (
            <View style={{ gap: 12, paddingTop: 16 }}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="sparkles" size={30} color="accent" />
                </View>
                <Text variant="title" align="center">
                  {`Hi, I'm ${ASSISTANT_NAME}`}
                </Text>
                <Text variant="bodyLarge" tone="muted" align="center">
                  {"Tell me what you're looking for. I'll find it in stock at shops near you, so you know before you go."}
                </Text>
              </View>
              <Text variant="caption" tone="muted" uppercase style={{ marginTop: 8 }}>
                Try asking
              </Text>
              {SUGGESTIONS.map((s) => (
                <PressableScale
                  key={s}
                  onPress={() => ask(s)}
                  haptic="tap"
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${s}`}
                  scaleTo={0.98}
                  style={[styles.suggestion, { borderRadius: radius.card, borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Text variant="bodyLarge">{s}</Text>
                </PressableScale>
              ))}
            </View>
          ) : (
            items.map((item) => <Bubble key={item.id} item={item} />)
          )}
          {busy ? (
            <View style={styles.typing}>
              <ActivityIndicator color={colors.accent} />
              <Text variant="body" tone="muted">
                {ASSISTANT_NAME} is checking shops near you…
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.surface, paddingBottom: 8 + insets.bottom }]}>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="e.g. black kurta in L under ₹1,000"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={600}
              accessibilityLabel={`Message ${ASSISTANT_NAME}`}
              style={[styles.input, { borderRadius: radius.control + 6, borderColor: colors.borderStrong, backgroundColor: colors.bg, color: colors.text }]}
            />
            <View style={{ opacity: canSend ? 1 : 0.45 }}>
              <IconButton icon="send" label="Send" variant="accent" onPress={canSend ? () => ask(draft) : undefined} />
            </View>
          </View>
          <Text variant="caption" tone="muted" align="center">
            {ASSISTANT_NAME} only knows what shops have listed. Call the shop to confirm before you go.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ item }: { item: ChatItem }) {
  const { colors } = useTheme();
  const mine = item.role === 'user';
  return (
    <View style={{ gap: 8, alignSelf: mine ? 'flex-end' : 'stretch' }}>
      <View
        style={[
          styles.bubble,
          mine
            ? { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 6 }
            : { alignSelf: 'flex-start', backgroundColor: item.failed ? colors.surfaceSunken : colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 6 },
        ]}
      >
        <Text variant="bodyLarge" tone={mine ? 'onAccent' : item.failed ? 'danger' : 'default'} selectable>
          {item.content}
        </Text>
      </View>
      {item.products?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
          {item.products.map((product) => (
            <ProductCardView key={`${product.storeId}/${product.productId}`} item={product} width={156} />
          ))}
        </ScrollView>
      ) : null}
      {item.toolsUsed?.length ? (
        <Text variant="caption" tone="muted">
          {item.toolsUsed.join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingBottom: 6 },
  content: { padding: 16, gap: 14, flexGrow: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  suggestion: { padding: 14, borderWidth: 1 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  composer: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 8, gap: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, fontSize: 16 },
});
