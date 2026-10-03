import { StyleSheet, View } from 'react-native';

import { visibleBlocks } from '@/features/assistant/chat';

import { Text } from './Text';

/** An assistant reply as paragraphs and bullet rows, with bold where the reply asks for it. */
export function ReplyText({ text, tone = 'default' }: { text: string; tone?: 'default' | 'danger' }) {
  const blocks = visibleBlocks(text);
  return (
    <View style={styles.wrap}>
      {blocks.map((block, i) =>
        block.kind === 'bullet' ? (
          <View key={i} style={[styles.bulletRow, { marginLeft: block.indent * 16 }]}>
            <Text variant="bodyLarge" tone={tone === 'danger' ? 'danger' : 'accent'} style={styles.dot}>
              •
            </Text>
            <Text variant="bodyLarge" tone={tone} style={styles.flex} selectable>
              {block.spans.map((s, j) => (
                <Text key={j} variant="bodyLarge" tone={tone} weight={s.bold ? '700' : undefined}>
                  {s.text}
                </Text>
              ))}
            </Text>
          </View>
        ) : (
          <Text key={i} variant="bodyLarge" tone={tone} selectable>
            {block.spans.map((s, j) => (
              <Text key={j} variant="bodyLarge" tone={tone} weight={s.bold ? '700' : undefined}>
                {s.text}
              </Text>
            ))}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 10 },
  flex: { flexShrink: 1 },
});
