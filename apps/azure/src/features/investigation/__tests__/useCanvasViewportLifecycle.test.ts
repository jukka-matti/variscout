import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock() must precede all imports that touch the mocked modules.
vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    persistCanvasViewport: vi.fn().mockResolvedValue(undefined),
    rehydrateCanvasViewport: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  getCanvasViewportInitialState,
  persistCanvasViewport,
  rehydrateCanvasViewport,
  useCanvasViewportStore,
} from '@variscout/stores';
import { useCanvasViewportLifecycle } from '../useCanvasViewportLifecycle';

const mockPersist = vi.mocked(persistCanvasViewport);
const mockRehydrate = vi.mocked(rehydrateCanvasViewport);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCanvasViewportLifecycle (Azure)', () => {
  it('rehydrates on mount when hubId is defined', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    expect(mockRehydrate).toHaveBeenCalledOnce();
    expect(mockRehydrate).toHaveBeenCalledWith('hub-A');
  });

  it('does not rehydrate when hubId is null', () => {
    renderHook(() => useCanvasViewportLifecycle(null));
    expect(mockRehydrate).not.toHaveBeenCalled();
  });

  it('does not rehydrate when hubId is undefined', () => {
    renderHook(() => useCanvasViewportLifecycle(undefined));
    expect(mockRehydrate).not.toHaveBeenCalled();
  });

  it('debounces persistCanvasViewport after flat persisted fields change', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setViewMode('wall');
      useCanvasViewportStore.getState().setRailOpen(false);
    });

    expect(mockPersist).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('hub-A');
  });

  it('debounces persistCanvasViewport after viewport changes for the active hub', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-A', 2);
      useCanvasViewportStore.getState().setPan('hub-A', { x: 10, y: 20 });
      useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('hub-A');
  });

  it('does not persist when a different hub viewport changes', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-B', 3);
      useCanvasViewportStore.getState().setPan('hub-B', { x: -10, y: -20 });
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('unsubscribes and stops persisting after unmount', () => {
    const { unmount } = renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-A', 5);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('rehydrates with new hubId when hubId changes', () => {
    const { rerender } = renderHook(
      ({ hubId }: { hubId: string }) => useCanvasViewportLifecycle(hubId),
      {
        initialProps: { hubId: 'hub-A' },
      }
    );

    expect(mockRehydrate).toHaveBeenCalledWith('hub-A');

    rerender({ hubId: 'hub-B' });

    expect(mockRehydrate).toHaveBeenCalledWith('hub-B');
    expect(mockRehydrate).toHaveBeenCalledTimes(2);
  });
});
