import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrainstormSession } from '../useBrainstormSession';

// Keep a reference to the last created mock EventSource so tests can fire events
interface MockEventSourceInstance {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
}

let lastMockES: MockEventSourceInstance | null = null;
const eventSourceUrls: string[] = [];

// Class-based mock: assigned directly to window.EventSource
// so `new EventSource(url)` works and we can track invocations
class MockEventSourceClass {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(url: string) {
    eventSourceUrls.push(url);
    lastMockES = this; // eslint-disable-line @typescript-eslint/no-this-alias -- intentional: test capture of mock instance
  }
}

vi.stubGlobal('EventSource', MockEventSourceClass);

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useBrainstormSession', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    lastMockES = null;
    eventSourceUrls.length = 0;
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useBrainstormSession());
    expect(result.current.state.sessionId).toBeNull();
    expect(result.current.state.ideas).toEqual([]);
    expect(result.current.state.isConnected).toBe(false);
  });

  it('creates session and connects SSE', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'test-123' }),
    });

    const { result } = renderHook(() => useBrainstormSession());

    let sessionId: string | null = null;
    await act(async () => {
      sessionId = await result.current.createSession('proj-1', 'q-1', 'Shift (Night)');
    });

    expect(sessionId).toBe('test-123');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/brainstorm/create',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(eventSourceUrls).toContain('/api/brainstorm/stream?sessionId=test-123');
  });

  it('returns null when create fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useBrainstormSession());

    let sessionId: string | null = 'not-null';
    await act(async () => {
      sessionId = await result.current.createSession('proj-1', 'q-1', 'cause');
    });

    expect(sessionId).toBeNull();
  });

  it('adds idea via fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessionId: 's1' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });
    await act(async () => {
      await result.current.addIdea('New idea', 'prevent');
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const lastCall = mockFetch.mock.calls[1];
    expect(lastCall[0]).toBe('/api/brainstorm/idea');
    const body = JSON.parse(lastCall[1].body) as {
      text: string;
      direction: string;
      aiGenerated: boolean;
    };
    expect(body.text).toBe('New idea');
    expect(body.direction).toBe('prevent');
    expect(body.aiGenerated).toBe(false);
  });

  it('edits existing idea via fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessionId: 's1' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });
    await act(async () => {
      await result.current.editIdea('idea-42', 'Updated text', 'eliminate');
    });

    const lastCall = mockFetch.mock.calls[1];
    expect(lastCall[0]).toBe('/api/brainstorm/idea');
    const body = JSON.parse(lastCall[1].body) as { id: string; text: string; direction: string };
    expect(body.id).toBe('idea-42');
    expect(body.text).toBe('Updated text');
    expect(body.direction).toBe('eliminate');
  });

  it('joinSession connects SSE without fetch', () => {
    const { result } = renderHook(() => useBrainstormSession());

    act(() => {
      result.current.joinSession('join-session-99');
    });

    expect(eventSourceUrls).toContain('/api/brainstorm/stream?sessionId=join-session-99');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('disconnects and resets state', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessionId: 's1' }) });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.state.sessionId).toBeNull();
    expect(result.current.state.isConnected).toBe(false);
    expect(result.current.state.ideas).toEqual([]);
  });

  it('handles SSE init event and populates state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'sse-1' }),
    });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });

    const initPayload = {
      type: 'init',
      session: {
        ideas: [
          { id: 'i1', text: 'Idea A', direction: 'prevent', aiGenerated: false, voteCount: 0 },
        ],
        phase: 'brainstorm',
        participants: ['user1', 'user2'],
      },
    };

    act(() => {
      lastMockES!.onmessage!({ data: JSON.stringify(initPayload) } as MessageEvent);
    });

    expect(result.current.state.ideas).toHaveLength(1);
    expect(result.current.state.ideas[0].text).toBe('Idea A');
    expect(result.current.state.participantCount).toBe(2);
    expect(result.current.state.isConnected).toBe(true);
  });

  it('handles SSE idea event (new idea)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'sse-2' }),
    });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });

    // First set up session state via init
    act(() => {
      lastMockES!.onmessage!({
        data: JSON.stringify({
          type: 'init',
          session: { ideas: [], phase: 'brainstorm', participants: [] },
        }),
      } as MessageEvent);
    });

    // Then push a new idea
    const newIdea = {
      id: 'i2',
      text: 'New idea',
      direction: 'detect',
      aiGenerated: true,
      voteCount: 0,
    };
    act(() => {
      lastMockES!.onmessage!({
        data: JSON.stringify({ type: 'idea', idea: newIdea }),
      } as MessageEvent);
    });

    expect(result.current.state.ideas).toHaveLength(1);
    expect(result.current.state.ideas[0].id).toBe('i2');
  });

  it('handles SSE idea event (update existing idea)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'sse-3' }),
    });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });

    const existingIdea = {
      id: 'i1',
      text: 'Original',
      direction: 'prevent',
      aiGenerated: false,
      voteCount: 0,
    };
    act(() => {
      lastMockES!.onmessage!({
        data: JSON.stringify({
          type: 'init',
          session: { ideas: [existingIdea], phase: 'brainstorm', participants: [] },
        }),
      } as MessageEvent);
    });

    const updatedIdea = { ...existingIdea, text: 'Updated', voteCount: 3 };
    act(() => {
      lastMockES!.onmessage!({
        data: JSON.stringify({ type: 'idea', idea: updatedIdea }),
      } as MessageEvent);
    });

    expect(result.current.state.ideas).toHaveLength(1);
    expect(result.current.state.ideas[0].text).toBe('Updated');
    expect(result.current.state.ideas[0].voteCount).toBe(3);
  });

  it('sets isConnected to false on SSE error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'sse-err' }),
    });

    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.createSession('p', 'q', 'cause');
    });

    // Mark as connected via init
    act(() => {
      lastMockES!.onmessage!({
        data: JSON.stringify({
          type: 'init',
          session: { ideas: [], phase: 'brainstorm', participants: ['u'] },
        }),
      } as MessageEvent);
    });
    expect(result.current.state.isConnected).toBe(true);

    act(() => {
      lastMockES!.onerror!();
    });

    expect(result.current.state.isConnected).toBe(false);
  });

  it('does not call fetch for addIdea when no session', async () => {
    const { result } = renderHook(() => useBrainstormSession());

    await act(async () => {
      await result.current.addIdea('orphan', 'simplify');
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
