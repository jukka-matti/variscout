/**
 * Tests for usePopoutChannel hook — hydration, lifecycle, heartbeat, typing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePopoutChannel, writeHydrationData } from '../usePopoutChannel';
import type { PopoutMessage } from '../usePopoutChannel';
import { HYDRATION_KEYS } from '../popoutMessages';
import type { FindingsSyncMessage } from '../popoutMessages';

// ============================================================================
// BroadcastChannel mock (must be a class, not vi.fn, for `new` to work)
// ============================================================================

interface MockChannel {
  postMessage: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  _listeners: Map<string, ((event: MessageEvent) => void)[]>;
  _simulateMessage: (data: unknown) => void;
}

let mockChannels: MockChannel[] = [];

class MockBroadcastChannel implements MockChannel {
  postMessage = vi.fn();
  addEventListener = vi.fn((type: string, handler: (event: MessageEvent) => void) => {
    const arr = this._listeners.get(type) ?? [];
    arr.push(handler);
    this._listeners.set(type, arr);
  });
  removeEventListener = vi.fn();
  close = vi.fn();
  _listeners = new Map<string, ((event: MessageEvent) => void)[]>();

  constructor(_name: string) {
    mockChannels.push(this);
  }

  _simulateMessage(data: unknown): void {
    const handlers = this._listeners.get('message') ?? [];
    handlers.forEach(h => h(new MessageEvent('message', { data })));
  }
}

beforeEach(() => {
  mockChannels = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).BroadcastChannel;
  mockChannels = [];
  localStorage.clear();
});

/** Get the last created mock channel */
function lastChannel(): MockChannel {
  return mockChannels[mockChannels.length - 1];
}

// ============================================================================
// writeHydrationData (static helper)
// ============================================================================

describe('writeHydrationData', () => {
  it('writes JSON to localStorage', () => {
    const data = { findings: [{ id: '1', text: 'test' }] };
    writeHydrationData('test-key', data);
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(data));
  });

  it('silently ignores localStorage errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });
    // Should not throw
    writeHydrationData('test-key', { a: 1 });
    vi.restoreAllMocks();
  });
});

// ============================================================================
// Hydration
// ============================================================================

describe('hydration', () => {
  it('returns null hydrationData when no hydrationKey provided', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'test' }));
    expect(result.current.hydrationData).toBeNull();
  });

  it('reads hydration data from localStorage on mount', () => {
    const data = { findings: [], drillPath: [] };
    localStorage.setItem('hydration-key', JSON.stringify(data));

    const { result } = renderHook(() =>
      usePopoutChannel({ windowId: 'test', hydrationKey: 'hydration-key' })
    );
    expect(result.current.hydrationData).toEqual(data);
  });

  it('returns null for missing localStorage key', () => {
    const { result } = renderHook(() =>
      usePopoutChannel({ windowId: 'test', hydrationKey: 'nonexistent' })
    );
    expect(result.current.hydrationData).toBeNull();
  });

  it('returns null for invalid JSON in localStorage', () => {
    localStorage.setItem('bad-json', '{invalid json');
    const { result } = renderHook(() =>
      usePopoutChannel({ windowId: 'test', hydrationKey: 'bad-json' })
    );
    expect(result.current.hydrationData).toBeNull();
  });
});

// ============================================================================
// Lifecycle messages
// ============================================================================

describe('lifecycle messages', () => {
  it('sends window-opened on mount', () => {
    renderHook(() => usePopoutChannel({ windowId: 'findings' }));
    const ch = lastChannel();
    expect(ch).toBeDefined();
    expect(ch.postMessage).toHaveBeenCalledWith({
      type: 'window-opened',
      source: 'findings',
    });
  });

  it('sends window-closing on unmount', () => {
    const { unmount } = renderHook(() => usePopoutChannel({ windowId: 'findings' }));
    const ch = lastChannel();
    unmount();
    expect(ch.postMessage).toHaveBeenCalledWith({
      type: 'window-closing',
      source: 'findings',
    });
  });

  it('does not send lifecycle messages when disabled', () => {
    renderHook(() => usePopoutChannel({ windowId: 'test', enabled: false }));
    expect(mockChannels.length).toBe(0);
  });
});

// ============================================================================
// Heartbeat
// ============================================================================

describe('heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends heartbeat at specified interval', () => {
    renderHook(() => usePopoutChannel({ windowId: 'test', heartbeatInterval: 1000 }));
    const ch = lastChannel();
    ch.postMessage.mockClear();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const heartbeats = ch.postMessage.mock.calls.filter(
      (call: unknown[]) => (call[0] as PopoutMessage).type === 'heartbeat'
    );
    expect(heartbeats.length).toBe(3);
    expect(heartbeats[0][0]).toEqual({ type: 'heartbeat', source: 'test' });
  });

  it('does not send heartbeat when no interval provided', () => {
    renderHook(() => usePopoutChannel({ windowId: 'test' }));
    const ch = lastChannel();
    ch.postMessage.mockClear();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(ch.postMessage).not.toHaveBeenCalled();
  });

  it('stops heartbeat on unmount', () => {
    const { unmount } = renderHook(() =>
      usePopoutChannel({ windowId: 'test', heartbeatInterval: 1000 })
    );
    const ch = lastChannel();

    unmount();
    ch.postMessage.mockClear();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const heartbeats = ch.postMessage.mock.calls.filter(
      (call: unknown[]) => (call[0] as PopoutMessage).type === 'heartbeat'
    );
    expect(heartbeats.length).toBe(0);
  });
});

// ============================================================================
// Message send/receive
// ============================================================================

describe('message send/receive', () => {
  it('adds source to outgoing messages', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'main' }));
    const ch = lastChannel();

    act(() => {
      result.current.sendMessage({ type: 'test-msg', payload: { x: 1 } });
    });

    expect(ch.postMessage).toHaveBeenCalledWith({
      type: 'test-msg',
      payload: { x: 1 },
      source: 'main',
    });
  });

  it('receives messages from other windows', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'popout' }));
    const ch = lastChannel();

    act(() => {
      ch._simulateMessage({
        type: 'findings-sync',
        source: 'main',
        payload: { findings: [] },
      });
    });

    expect(result.current.lastMessage).toEqual({
      type: 'findings-sync',
      source: 'main',
      payload: { findings: [] },
    });
  });

  it('ignores messages from self', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'main' }));
    const ch = lastChannel();

    act(() => {
      ch._simulateMessage({
        type: 'test',
        source: 'main',
      });
    });

    expect(result.current.lastMessage).toBeNull();
  });

  it('ignores targeted messages for other windows', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'findings' }));
    const ch = lastChannel();

    act(() => {
      ch._simulateMessage({
        type: 'test',
        source: 'main',
        target: 'evidence-map',
      });
    });

    expect(result.current.lastMessage).toBeNull();
  });
});

// ============================================================================
// Generic typing (compile-time checks)
// ============================================================================

describe('generic typing', () => {
  it('accepts typed messages via generic parameter', () => {
    const { result } = renderHook(() =>
      usePopoutChannel<FindingsSyncMessage>({ windowId: 'main' })
    );
    const ch = lastChannel();

    act(() => {
      result.current.sendMessage({
        type: 'findings-sync',
        payload: {
          findings: [],
          drillPath: [],
        },
      });
    });

    expect(ch.postMessage).toHaveBeenCalled();
  });
});

// ============================================================================
// isConnected
// ============================================================================

describe('isConnected', () => {
  it('returns true when enabled and BroadcastChannel available', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'test' }));
    expect(result.current.isConnected).toBe(true);
  });

  it('returns false when disabled', () => {
    const { result } = renderHook(() => usePopoutChannel({ windowId: 'test', enabled: false }));
    expect(result.current.isConnected).toBe(false);
  });
});

// ============================================================================
// HYDRATION_KEYS constant
// ============================================================================

describe('HYDRATION_KEYS', () => {
  it('exports canonical hydration keys', () => {
    expect(HYDRATION_KEYS.findings).toBe('variscout_findings_hydration');
    expect(HYDRATION_KEYS.improvement).toBe('variscout_improvement_hydration');
    expect(HYDRATION_KEYS.evidenceMap).toBe('variscout_evidence_map_hydration');
  });
});
