import { ApiError } from '@/api/client';
import type { AssistantTurn, ProductCard } from '@/api/types';

/** The assistant's name, shown in the app. */
export const ASSISTANT_NAME = 'Sarah';

export type ChatItem = AssistantTurn & { id: number; toolsUsed?: string[]; products?: ProductCard[]; failed?: boolean };

export const SUGGESTIONS = ['Red kurta under ₹1,500', 'Wedding lehenga near me', 'Blue jeans size 32', 'Silk saree for a gift'];

/** Plain-text history sent with each question: the last 10 user/assistant turns, failed replies left out. */
export function historyFor(items: ChatItem[]): AssistantTurn[] {
  return items
    .filter((item) => !item.failed)
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
}

export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetwork) return `You're offline. ${ASSISTANT_NAME} needs the internet to search shops.`;
    if (error.code === 'location_required') return 'Set your location first, so I know which shops are near you.';
    if (error.code === 'assistant_unavailable') return `${ASSISTANT_NAME} isn't available right now. Search still works.`;
    return error.message;
  }
  return 'Something went wrong. Try again.';
}

export type VoiceLang = 'en-IN' | 'hi-IN';

/** What was typed before the mic was tapped, followed by what was heard. */
export function joinSpeech(before: string, heard: string) {
  const said = heard.trim();
  if (!said) return before;
  return before.trim() ? `${before.trimEnd()} ${said}` : said;
}

/** Speech errors in plain words; null for the ones that need no message (cancelled, silence). */
export function voiceErrorMessage(code: string): string | null {
  if (code === 'aborted' || code === 'no-speech' || code === 'speech-timeout') return null;
  if (code === 'not-allowed') return 'Allow the microphone for WowCity to talk to Sarah.';
  if (code === 'network') return 'Voice typing needs the internet on this phone.';
  if (code === 'service-not-allowed' || code === 'language-not-supported') return "Voice typing isn't available on this phone. You can type instead.";
  return "Couldn't hear that. Tap the mic and try again.";
}

export type ReplySpan = { text: string; bold: boolean };
export type ReplyBlock = { kind: 'paragraph' | 'bullet'; indent: number; spans: ReplySpan[] };

/** Splits **bold** runs; any stray asterisks left over are dropped. */
function spansOf(line: string): ReplySpan[] {
  const out: ReplySpan[] = [];
  line.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (!part) return;
    const bold = /^\*\*[^*]+\*\*$/.test(part);
    const text = (bold ? part.slice(2, -2) : part).replace(/\*+/g, '').replace(/__/g, '');
    if (text) out.push({ text, bold });
  });
  return out;
}

/**
 * Turns the assistant's reply into paragraphs and bullet rows, so Markdown the model may still send
 * (**bold**, "- item", "### Heading") shows as clean formatting instead of symbols.
 */
export function parseReply(text: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const bullet = raw.match(/^(\s*)(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      blocks.push({ kind: 'bullet', indent: bullet[1].length >= 2 ? 1 : 0, spans: spansOf(bullet[2]) });
      continue;
    }
    const heading = raw.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: 'paragraph', indent: 0, spans: [{ text: heading[1].replace(/\*+/g, ''), bold: true }] });
      continue;
    }
    blocks.push({ kind: 'paragraph', indent: 0, spans: spansOf(raw.trim()) });
  }
  return blocks;
}

export const EMPTY_REPLY = "Sorry, I couldn't answer that. Try asking in a different way.";

/** Reply blocks that actually have words in them; a reply with none shows a short apology instead of empty bullets. */
export function visibleBlocks(text: string): ReplyBlock[] {
  const blocks = parseReply(text).filter((b) => b.spans.some((s) => /[\p{L}\p{N}]/u.test(s.text)));
  return blocks.length ? blocks : [{ kind: 'paragraph', indent: 0, spans: [{ text: EMPTY_REPLY, bold: false }] }];
}
