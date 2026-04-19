import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  useWallLayoutStore.setState(
    (
      useWallLayoutStore as typeof useWallLayoutStore & { getInitialState: () => unknown }
    ).getInitialState() as Parameters<typeof useWallLayoutStore.setState>[0]
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWallLayoutLifecycle (PWA)', () => {
  it('is a no-op when projectId is null (PWA session-only)', () => {
    renderHook(() => useWallLayoutLifecycle(null));
    expect(mockRehydrate).not.toHaveBeenCalled();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('calls rehydrateWallLayout when a projectId is provided', () => {
    renderHook(() => useWallLayoutLifecycle('proj-A'));
    expect(mockRehydrate).toHaveBeenCalledOnce();
    expect(mockRehydrate).toHaveBeenCalledWith('proj-A');
  });

  it('debounces persistWallLayout after a zoom change', () => {
    renderHook(() => useWallLayoutLifecycle('proj-A'));
    mockPersist.mockClear();

    act(() => {
      useWallLayoutStore.getState().setZoom(1.5);
    });

    expect(mockPersist).not.toHaveBeenCalled();

    act(() => {
      vi.runAllTimers();
    });

    expect(mockPersist).toHaveBeenCalledOnce();
    expect(mockPersist).toHaveBeenCalledWith('proj-A');
  });

  it('does not persist after unmount', () => {
    const { unmount } = renderHook(() => useWallLayoutLifecycle('proj-A'));
    mockPersist.mockClear();
    unmount();

    act(() => {
      useWallLayoutStore.getState().setZoom(2);
      vi.runAllTimers();
    });

    expect(mockPersist).not.toHaveBeenCalled();
  });
});
