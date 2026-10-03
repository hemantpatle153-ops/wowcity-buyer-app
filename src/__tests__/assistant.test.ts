import { ApiError, createApiClient } from '@/api/client';
import { createEndpoints } from '@/api/endpoints';
import { BHOPAL } from '@/api/mock/fixtures';
import { createMockFetch } from '@/api/mock/server';
import { friendlyError, historyFor, joinSpeech, parseReply, voiceErrorMessage, type ChatItem } from '@/features/assistant/chat';

const api = createEndpoints(
  createApiClient({ baseUrl: 'https://m/api/v1/public', fetch: createMockFetch({ latencyMs: [0, 0] }) }),
);

describe('Sarah, the shopping assistant', () => {
  it('sends only the last 10 plain turns and drops failed replies', () => {
    const items: ChatItem[] = Array.from({ length: 13 }, (_, i) => ({ id: i, role: i % 2 ? 'assistant' : 'user', content: `m${i}`, products: [] }));
    items[9].failed = true;
    const history = historyFor(items);
    expect(history).toHaveLength(10);
    expect(history.every((t) => Object.keys(t).sort().join() === 'content,role')).toBe(true);
    expect(history.map((t) => t.content)).not.toContain('m9');
    expect(history.at(-1)).toEqual({ role: 'user', content: 'm12' });
  });

  it('shows Markdown from the model as clean bullets and bold text', () => {
    const blocks = parseReply('Here you go:\n\n- **Urban Threads**:\n  - Black Jacket for **₹6,299**\n### Tip\nVisit *today*');
    expect(blocks.map((b) => [b.kind, b.indent, b.spans.map((s) => (s.bold ? `[${s.text}]` : s.text)).join('')])).toEqual([
      ['paragraph', 0, 'Here you go:'],
      ['bullet', 0, '[Urban Threads]:'],
      ['bullet', 1, 'Black Jacket for [₹6,299]'],
      ['paragraph', 0, '[Tip]'],
      ['paragraph', 0, 'Visit today'],
    ]);
  });

  it('turns errors into plain words', () => {
    expect(friendlyError(new ApiError(0, 'network', 'x'))).toMatch(/offline/);
    expect(friendlyError(new ApiError(422, 'location_required', 'x'))).toMatch(/location/);
    expect(friendlyError(new ApiError(429, 'daily_limit', 'Come back tomorrow.'))).toBe('Come back tomorrow.');
  });

  it('adds what was heard after what was already typed', () => {
    expect(joinSpeech('', ' red kurta ')).toBe('red kurta');
    expect(joinSpeech('red kurta ', 'size L')).toBe('red kurta size L');
    expect(voiceErrorMessage('no-speech')).toBeNull();
    expect(voiceErrorMessage('not-allowed')).toMatch(/microphone/);
  });

  it('finds in-stock items only inside the chosen distance in demo mode', async () => {
    const reply = await api.askAssistant({ messages: [{ role: 'user', content: 'mujhe saree chahiye' }], lat: BHOPAL.lat, lng: BHOPAL.lng, radiusKm: 10 }, false);
    expect(reply.products.length).toBeGreaterThan(0);
    expect(reply.products.every((p) => p.inStock && (p.store.distanceKm ?? 0) <= 10)).toBe(true);
    await expect(api.askAssistant({ messages: [{ role: 'user', content: 'saree' }] }, false)).rejects.toMatchObject({ code: 'location_required' });
  });
});
