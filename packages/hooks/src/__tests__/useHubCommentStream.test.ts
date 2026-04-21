import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mock EventSource ────────────────────────────────────────────────────────
// Class-based mock so `new EventSource(url)` works and we can fire events.

interface MockEventSourceInstance {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
  closed: boolean;
}

const instances: MockEventSourceInstance[] = [];

class MockEventSourceClass {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn(() => {
    this.closed = true;
  });
  closed = false;
  constructor(url: string) {
    this.url = url;
    instances.push(this);
  }
}

vi.stubGlobal('EventSource', MockEventSourceClass);

// ─── Mock investigationStore ──────────────────────────────────────────────────

const stateRef = {
  current: {
    suspectedCauses: [] as Array<{
      id: string;
      comments?: Array<{ id: string; text: string; createdAt: number }>;
    }>,
  },
};
const setStateMock = vi.fn(
  (updater: (state: typeof stateRef.current) => typeof stateRef.current) => {
    stateRef.current = updater(stateRef.current);
  }
);

vi.mock('@variscout/stores', () => ({
  useInvestigationStore: {
    setState: (u: (s: typeof stateRef.current) => typeof stateRef.current) => setStateMock(u),
    getState: () => stateRef.current,
  },
}));

import { useHubCommentStream } from '../useHubCommentStream';

describe('useHubCommentStream', () => {
  beforeEach(() => {
    instances.length = 0;
    setStateMock.mockClear();
    stateRef.current = {
      suspectedCauses: [
        { id: 'hub-1', comments: [] },
        { id: 'hub-2', comments: [] },
      ],
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when projectId is null', () => {
    renderHook(() => useHubCommentStream({ projectId: null, visibleHubIds: ['hub-1', 'hub-2'] }));
    expect(instances).toHaveLength(0);
  });

  it('opens one EventSource per visible hub', () => {
    renderHook(() =>
      useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1', 'hub-2'] })
    );
    expect(instances).toHaveLength(2);
    expect(instances[0].url).toContain('projectId=proj-1');
    expect(instances[0].url).toContain('hubId=hub-1');
    expect(instances[1].url).toContain('hubId=hub-2');
  });

  it('closes streams for hubs that scroll out of view', () => {
    const { rerender } = renderHook(
      ({ visible }: { visible: string[] }) =>
        useHubCommentStream({ projectId: 'proj-1', visibleHubIds: visible }),
      { initialProps: { visible: ['hub-1', 'hub-2'] } }
    );
    expect(instances).toHaveLength(2);

    rerender({ visible: ['hub-1'] });
    expect(instances[1].close).toHaveBeenCalled();
    // Still only 2 total — no new stream opened on rerender.
    expect(instances).toHaveLength(2);
  });

  it('opens streams for hubs that newly enter the viewport', () => {
    const { rerender } = renderHook(
      ({ visible }: { visible: string[] }) =>
        useHubCommentStream({ projectId: 'proj-1', visibleHubIds: visible }),
      { initialProps: { visible: ['hub-1'] } }
    );
    expect(instances).toHaveLength(1);

    rerender({ visible: ['hub-1', 'hub-2'] });
    expect(instances).toHaveLength(2);
    expect(instances[1].url).toContain('hubId=hub-2');
  });

  it('appends comments from init event (dedup-by-id) via setState', () => {
    renderHook(() => useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1'] }));

    act(() => {
      instances[0].onmessage!({
        data: JSON.stringify({
          type: 'init',
          comments: [
            { id: 'c1', text: 'hello', createdAt: 1 },
            { id: 'c2', text: 'world', createdAt: 2 },
          ],
        }),
      } as MessageEvent);
    });

    const hub = stateRef.current.suspectedCauses.find(h => h.id === 'hub-1')!;
    expect(hub.comments).toHaveLength(2);
    expect(hub.comments?.[0]?.text).toBe('hello');
  });

  it('appends incoming live comment events', () => {
    renderHook(() => useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1'] }));

    act(() => {
      instances[0].onmessage!({
        data: JSON.stringify({
          type: 'comment',
          comment: { id: 'c-live', text: 'from peer', createdAt: 99 },
        }),
      } as MessageEvent);
    });

    const hub = stateRef.current.suspectedCauses.find(h => h.id === 'hub-1')!;
    expect(hub.comments?.find(c => c.id === 'c-live')).toBeDefined();
  });

  it('dedups by id when a comment is re-received (self-echo)', () => {
    // Seed the hub with an existing optimistic comment.
    stateRef.current.suspectedCauses[0].comments = [
      { id: 'c-local', text: 'my own', createdAt: 1 },
    ];

    renderHook(() => useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1'] }));

    act(() => {
      instances[0].onmessage!({
        data: JSON.stringify({
          type: 'comment',
          comment: { id: 'c-local', text: 'my own', createdAt: 1 },
        }),
      } as MessageEvent);
    });

    const hub = stateRef.current.suspectedCauses.find(h => h.id === 'hub-1')!;
    expect(hub.comments).toHaveLength(1);
  });

  it('ignores malformed SSE frames', () => {
    renderHook(() => useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1'] }));

    expect(() => {
      act(() => {
        instances[0].onmessage!({ data: 'not-json' } as MessageEvent);
      });
    }).not.toThrow();

    const hub = stateRef.current.suspectedCauses.find(h => h.id === 'hub-1')!;
    expect(hub.comments).toHaveLength(0);
  });

  it('closes all streams on unmount', () => {
    const { unmount } = renderHook(() =>
      useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1', 'hub-2'] })
    );
    expect(instances).toHaveLength(2);

    unmount();
    expect(instances[0].close).toHaveBeenCalled();
    expect(instances[1].close).toHaveBeenCalled();
  });

  it('auto-reconnects after 1s backoff on error', () => {
    vi.useFakeTimers();
    renderHook(() => useHubCommentStream({ projectId: 'proj-1', visibleHubIds: ['hub-1'] }));
    expect(instances).toHaveLength(1);

    act(() => {
      instances[0].onerror!();
    });
    expect(instances[0].close).toHaveBeenCalled();

    // No new stream yet — backoff pending.
    expect(instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Reconnected — a fresh EventSource was created for hub-1.
    expect(instances).toHaveLength(2);
    expect(instances[1].url).toContain('hubId=hub-1');
  });

  it('closes all streams when projectId becomes null', () => {
    const { rerender } = renderHook(
      ({ projectId }: { projectId: string | null }) =>
        useHubCommentStream({ projectId, visibleHubIds: ['hub-1', 'hub-2'] }),
      { initialProps: { projectId: 'proj-1' as string | null } }
    );
    expect(instances).toHaveLength(2);

    rerender({ projectId: null });
    expect(instances[0].close).toHaveBeenCalled();
    expect(instances[1].close).toHaveBeenCalled();
  });
});
