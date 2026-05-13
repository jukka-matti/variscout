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

describe('useCanvasViewportLifecycle (PWA)', () => {
  it('is a no-op when hubId is null', () => {
    renderHook(() => useCanvasViewportLifecycle(null));
    expect(mockRehydrate).not.toHaveBeenCalled();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('is a no-op when hubId is undefined', () => {
    renderHook(() => useCanvasViewportLifecycle(undefined));
    expect(mockRehydrate).not.toHaveBeenCalled();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('rehydrates when a hubId is provided', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    expect(mockRehydrate).toHaveBeenCalledOnce();
    expect(mockRehydrate).toHaveBeenCalledWith('hub-A');
  });

  it('debounces persistCanvasViewport after viewport changes for the active hub', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-A', 1.5);
      useCanvasViewportStore.getState().setPan('hub-A', { x: 12, y: -8 });
      useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);
    });

    expect(mockPersist).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('hub-A');
  });

  it('debounces persistCanvasViewport after a flat viewMode change', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setViewMode('wall');
      vi.advanceTimersByTime(499);
    });

    expect(mockPersist).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('hub-A');
  });

  it('does not persist when a different hub viewport changes', () => {
    renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-B', 2);
      useCanvasViewportStore.getState().setPan('hub-B', { x: 20, y: 30 });
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('does not persist after unmount', () => {
    const { unmount } = renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom('hub-A', 2);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });
});
