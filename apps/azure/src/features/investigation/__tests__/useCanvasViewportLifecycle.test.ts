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
import type { ProcessHubId } from '@variscout/core/processHub';
import { useCanvasViewportLifecycle } from '../useCanvasViewportLifecycle';

const h = (id: string) => id as ProcessHubId;

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
    expect(mockRehydrate).toHaveBeenCalledWith('hub-A', expect.any(Function));
  });

  it('ignores stale rehydrate results after switching hubs', async () => {
    const delayedRehydrates = new Map<string, () => void>();
    mockRehydrate.mockImplementation(
      ((hubId: string, shouldApply?: () => boolean) =>
        new Promise<void>(resolve => {
          delayedRehydrates.set(hubId, () => {
            if (shouldApply?.() ?? true) {
              useCanvasViewportStore.setState(s => ({
                viewMode: 'wall',
                railOpen: false,
                viewports: {
                  ...s.viewports,
                  [hubId]: {
                    ...s.getViewport(h(hubId)),
                    zoom: 2,
                  },
                },
              }));
            }
            resolve();
          });
        })) as typeof rehydrateCanvasViewport
    );

    const { rerender } = renderHook(
      ({ hubId }: { hubId: string }) => useCanvasViewportLifecycle(hubId),
      {
        initialProps: { hubId: 'hub-A' },
      }
    );

    rerender({ hubId: 'hub-B' });
    mockPersist.mockClear();

    await act(async () => {
      delayedRehydrates.get('hub-A')?.();
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);
    expect(useCanvasViewportStore.getState().getViewport(h('hub-A')).zoom).toBe(1);
    expect(mockPersist).not.toHaveBeenCalled();
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
      useCanvasViewportStore.getState().setZoom(h('hub-A'), 2);
      useCanvasViewportStore.getState().setPan(h('hub-A'), { x: 10, y: 20 });
      useCanvasViewportStore.getState().setGroupByTributary(h('hub-A'), true);
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
      useCanvasViewportStore.getState().setZoom(h('hub-B'), 3);
      useCanvasViewportStore.getState().setPan(h('hub-B'), { x: -10, y: -20 });
      vi.advanceTimersByTime(500);
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('unsubscribes and stops persisting after unmount', () => {
    const { unmount } = renderHook(() => useCanvasViewportLifecycle('hub-A'));
    mockPersist.mockClear();

    act(() => {
      useCanvasViewportStore.getState().setZoom(h('hub-A'), 5);
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

    expect(mockRehydrate).toHaveBeenCalledWith('hub-A', expect.any(Function));

    rerender({ hubId: 'hub-B' });

    expect(mockRehydrate).toHaveBeenCalledWith('hub-B', expect.any(Function));
    expect(mockRehydrate).toHaveBeenCalledTimes(2);
  });
});
