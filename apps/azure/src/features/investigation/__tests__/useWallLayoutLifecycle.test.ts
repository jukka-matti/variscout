import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock() must precede all imports that touch the mocked modules.
vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    persistWallLayout: vi.fn().mockResolvedValue(undefined),
    rehydrateWallLayout: vi.fn().mockResolvedValue(undefined),
  };
});

import { useWallLayoutStore, persistWallLayout, rehydrateWallLayout } from '@variscout/stores';
import { useWallLayoutLifecycle } from '../useWallLayoutLifecycle';

const mockPersist = vi.mocked(persistWallLayout);
const mockRehydrate = vi.mocked(rehydrateWallLayout);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Reset store to initial state so each test starts clean.
  useWallLayoutStore.setState(
    (
      useWallLayoutStore as typeof useWallLayoutStore & { getInitialState: () => unknown }
    ).getInitialState() as Parameters<typeof useWallLayoutStore.setState>[0]
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWallLayoutLifecycle', () => {
  it('calls rehydrateWallLayout on mount when projectId is defined', () => {
    renderHook(() => useWallLayoutLifecycle('proj-A'));
    expect(mockRehydrate).toHaveBeenCalledOnce();
    expect(mockRehydrate).toHaveBeenCalledWith('proj-A');
  });

  it('does not call rehydrateWallLayout when projectId is null', () => {
    renderHook(() => useWallLayoutLifecycle(null));
    expect(mockRehydrate).not.toHaveBeenCalled();
  });

  it('does not call rehydrateWallLayout when projectId is undefined', () => {
    renderHook(() => useWallLayoutLifecycle(undefined));
    expect(mockRehydrate).not.toHaveBeenCalled();
  });

  it('debounces persistWallLayout after a viewMode change', () => {
    renderHook(() => useWallLayoutLifecycle('proj-A'));
    mockPersist.mockClear();

    act(() => {
      useWallLayoutStore.getState().setViewMode('wall');
    });

    // Not called yet — within the debounce window.
    expect(mockPersist).not.toHaveBeenCalled();

    act(() => {
      vi.runAllTimers();
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('proj-A');
  });

  it('coalesces rapid changes into a single persist call', () => {
    renderHook(() => useWallLayoutLifecycle('proj-A'));
    mockPersist.mockClear();

    act(() => {
      useWallLayoutStore.getState().setZoom(2);
      useWallLayoutStore.getState().setZoom(3);
      useWallLayoutStore.getState().setZoom(4);
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(mockPersist).toHaveBeenCalledOnce();
  });

  it('unsubscribes and stops persisting after unmount', () => {
    const { unmount } = renderHook(() => useWallLayoutLifecycle('proj-A'));
    mockPersist.mockClear();
    unmount();

    act(() => {
      useWallLayoutStore.getState().setZoom(5);
      vi.runAllTimers();
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('rehydrates with new projectId when projectId changes', () => {
    const { rerender } = renderHook(({ pid }: { pid: string }) => useWallLayoutLifecycle(pid), {
      initialProps: { pid: 'proj-A' },
    });

    expect(mockRehydrate).toHaveBeenCalledWith('proj-A');

    rerender({ pid: 'proj-B' });

    expect(mockRehydrate).toHaveBeenCalledWith('proj-B');
    expect(mockRehydrate).toHaveBeenCalledTimes(2);
  });
});
