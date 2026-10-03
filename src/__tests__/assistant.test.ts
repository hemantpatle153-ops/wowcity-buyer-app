import { ApiError, createApiClient } from '@/api/client';
import { createEndpoints } from '@/api/endpoints';
import { BHOPAL } from '@/api/mock/fixtures';
import { createMockFetch } from '@/api/mock/server';
import { friendlyError, historyFor, type ChatItem } from '@/features/assistant/chat';

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

  it('turns errors into plain words', () => {
    expect(friendlyError(new ApiError(0, 'network', 'x'))).toMatch(/offline/);
    expect(friendlyError(new ApiError(422, 'location_required', 'x'))).toMatch(/location/);
    expect(friendlyError(new ApiError(429, 'daily_limit', 'Come back tomorrow.'))).toBe('Come back tomorrow.');
  });

  it('finds in-stock items only inside the chosen distance in demo mode', async () => {
    const reply = await api.askAssistant({ messages: [{ role: 'user', content: 'mujhe saree chahiye' }], lat: BHOPAL.lat, lng: BHOPAL.lng, radiusKm: 10 }, false);
    expect(reply.products.length).toBeGreaterThan(0);
    expect(reply.products.every((p) => p.inStock && (p.store.distanceKm ?? 0) <= 10)).toBe(true);
    await expect(api.askAssistant({ messages: [{ role: 'user', content: 'saree' }] }, false)).rejects.toMatchObject({ code: 'location_required' });
  });
});
