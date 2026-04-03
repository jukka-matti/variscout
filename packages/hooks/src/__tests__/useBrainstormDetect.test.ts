import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrainstormDetect } from '../useBrainstormDetect';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useBrainstormDetect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no active session', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) });

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeSession).toBeNull();
  });

  it('detects an active session', async () => {
    const session = {
      sessionId: 's1',
      causeName: 'Shift',
      participantCount: 2,
      phase: 'brainstorm',
    };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(session) });

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeSession).toEqual(session);
  });

  it('does not poll when disabled', () => {
    renderHook(() => useBrainstormDetect('proj-1', false));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not poll when projectId is null', () => {
    renderHook(() => useBrainstormDetect(null));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('polls again after 30s interval', async () => {
    const session = { sessionId: 's2', causeName: 'Machine', participantCount: 1, phase: 'vote' };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(session) });

    renderHook(() => useBrainstormDetect('proj-2'));

    // Initial poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // After 30s interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dismisses and ignores same session until new one', async () => {
    const session = {
      sessionId: 's1',
      causeName: 'Shift',
      participantCount: 2,
      phase: 'brainstorm',
    };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(session) });

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeSession).toEqual(session);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.activeSession).toBeNull();

    // Next poll — same session should stay dismissed
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(result.current.activeSession).toBeNull();
  });

  it('shows new session after dismissing old one', async () => {
    const session1 = {
      sessionId: 's1',
      causeName: 'Shift',
      participantCount: 2,
      phase: 'brainstorm',
    };
    const session2 = {
      sessionId: 's2',
      causeName: 'Machine',
      participantCount: 1,
      phase: 'brainstorm',
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(session1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(session2) });

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      result.current.dismiss();
    });

    // Next poll returns a different session
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(result.current.activeSession).toEqual(session2);
  });

  it('clears session when API returns null', async () => {
    const session = {
      sessionId: 's1',
      causeName: 'Shift',
      participantCount: 2,
      phase: 'brainstorm',
    };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(session) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) });

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.activeSession).toEqual(session);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(result.current.activeSession).toBeNull();
  });

  it('ignores fetch errors silently', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBrainstormDetect('proj-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeSession).toBeNull();
  });

  it('encodes projectId in query string', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) });

    renderHook(() => useBrainstormDetect('proj/special id'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('proj/special id'))
    );
  });
});
