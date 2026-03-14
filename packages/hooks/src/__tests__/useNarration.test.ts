import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNarration } from '../useNarration';
import type { AIContext } from '@variscout/core';

const makeContext = (mean = 10): AIContext => ({
  process: {},
  filters: [],
  stats: { mean, stdDev: 0.5, samples: 100 },
});

describe('useNarration', () => {
  it('starts idle when no context', () => {
    const { result } = renderHook(() => useNarration({ context: null }));
    expect(result.current.status).toBe('idle');
    expect(result.current.narrative).toBeNull();
  });

  it('starts idle when no fetchNarration', () => {
    const { result } = renderHook(() => useNarration({ context: makeContext() }));
    expect(result.current.status).toBe('idle');
  });

  it('fetches narration after debounce', async () => {
    const mockFetch = vi.fn().mockResolvedValue('Process is stable');

    const { result } = renderHook(() =>
      useNarration({
        context: makeContext(),
        fetchNarration: mockFetch,
        debounceMs: 50,
        minIntervalMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.narrative).toBe('Process is stable');
    expect(result.current.isCached).toBe(false);
  });

  it('caches result — returns cached on context revisit', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce('First narration')
      .mockResolvedValueOnce('Second narration');

    const ctxA = makeContext(10);
    const ctxB = makeContext(20);

    const { result, rerender } = renderHook(
      ({ ctx }) =>
        useNarration({
          context: ctx,
          fetchNarration: mockFetch,
          debounceMs: 50,
          minIntervalMs: 0,
        }),
      { initialProps: { ctx: ctxA } }
    );

    // Fetch context A
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.narrative).toBe('First narration');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Switch to context B (different hash)
    rerender({ ctx: ctxB });
    await waitFor(() => expect(result.current.narrative).toBe('Second narration'));
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Switch back to context A — should hit cache, no new fetch
    rerender({ ctx: ctxA });
    await waitFor(() => expect(result.current.isCached).toBe(true));
    expect(result.current.narrative).toBe('First narration');
    expect(mockFetch).toHaveBeenCalledTimes(2); // No additional call
  });

  it('handles fetch error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useNarration({
        context: makeContext(),
        fetchNarration: mockFetch,
        debounceMs: 50,
        minIntervalMs: 0,
      })
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Network error');
  });

  it('refresh clears cache and re-fetches', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce('First').mockResolvedValueOnce('Second');

    const { result } = renderHook(() =>
      useNarration({
        context: makeContext(),
        fetchNarration: mockFetch,
        debounceMs: 50,
        minIntervalMs: 0,
      })
    );

    await waitFor(() => expect(result.current.narrative).toBe('First'));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.narrative).toBe('Second'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('fetches new narration when context changes', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce('First').mockResolvedValueOnce('Different');

    const { result, rerender } = renderHook(
      ({ ctx }) =>
        useNarration({
          context: ctx,
          fetchNarration: mockFetch,
          debounceMs: 50,
          minIntervalMs: 0,
        }),
      { initialProps: { ctx: makeContext(10) } }
    );

    await waitFor(() => expect(result.current.narrative).toBe('First'));

    rerender({ ctx: makeContext(20) });

    await waitFor(() => expect(result.current.narrative).toBe('Different'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
