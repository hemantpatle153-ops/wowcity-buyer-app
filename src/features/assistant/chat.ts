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
