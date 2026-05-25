import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  RETURN_NAVIGATION_STORAGE_KEY,
  useReturnNavigation,
  type ReturnNavigationTarget,
} from '../useReturnNavigation';

describe('useReturnNavigation', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/source?line=A#top');
    window.scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 12 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 34 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('captures a single return target with surface, params, scroll position, and ui state', () => {
    const { result } = renderHook(() => useReturnNavigation());

    act(() => {
      result.current.captureReturnTarget({
        sourceSurface: 'investigation-wall',
        params: { hubId: 'hub-1', lens: 'defects' },
        uiState: { selectedFindingId: 'finding-7', compact: true },
      });
    });

    expect(JSON.parse(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY) ?? '')).toEqual({
      sourceSurface: 'investigation-wall',
      params: { hubId: 'hub-1', lens: 'defects' },
      scrollPosition: { x: 12, y: 34 },
      uiState: { selectedFindingId: 'finding-7', compact: true },
    });
  });

  it('overwrites the previous target and consumes the saved target once', () => {
    const { result } = renderHook(() => useReturnNavigation());
    const first: ReturnNavigationTarget = {
      sourceSurface: 'wall',
      params: { hubId: 'old' },
      scrollPosition: { x: 1, y: 2 },
      uiState: { panel: 'left' },
    };
    const second: ReturnNavigationTarget = {
      sourceSurface: 'evidence-map',
      params: { hubId: 'new' },
      scrollPosition: { x: 3, y: 4 },
      uiState: { panel: 'right' },
    };

    act(() => result.current.saveReturnTarget(first));
    act(() => result.current.saveReturnTarget(second));

    expect(result.current.consumeReturnTarget()).toEqual(second);
    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
    expect(result.current.consumeReturnTarget()).toBeNull();
  });

  it('peeks at a saved target without consuming it', () => {
    const { result } = renderHook(() => useReturnNavigation());
    const target: ReturnNavigationTarget = {
      sourceSurface: 'improvement-project',
      params: { projectId: 'ip-1' },
      scrollPosition: { x: 1, y: 2 },
      uiState: { section: 'lineage' },
    };

    act(() => result.current.saveReturnTarget(target));

    expect(result.current.peekReturnTarget()).toEqual(target);
    expect(result.current.consumeReturnTarget()).toEqual(target);
  });

  it('clears a saved target without consuming it', () => {
    const { result } = renderHook(() => useReturnNavigation());
    act(() =>
      result.current.captureReturnTarget({
        sourceSurface: 'wall',
        params: {},
        uiState: {},
      })
    );

    act(() => result.current.clearReturnTarget());

    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
  });

  it('fails closed and clears invalid JSON when consuming', () => {
    const removeSpy = vi.spyOn(window.sessionStorage, 'removeItem');
    window.sessionStorage.setItem(RETURN_NAVIGATION_STORAGE_KEY, '{not-json');
    const { result } = renderHook(() => useReturnNavigation());

    expect(result.current.consumeReturnTarget()).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(RETURN_NAVIGATION_STORAGE_KEY);
    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
  });

  it('does not throw when sessionStorage is unavailable', () => {
    // Use vi.stubGlobal to swap the entire sessionStorage with a throwing
    // proxy. happy-dom doesn't cleanly restore individual instance-spies
    // (vi.restoreAllMocks leaves the patched methods in place), which causes
    // cross-test pollution. unstubAllGlobals via afterEach is reliable.
    const getItem = vi.fn(() => {
      throw new Error('blocked');
    });
    const setItem = vi.fn(() => {
      throw new Error('blocked');
    });
    const removeItem = vi.fn(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal('sessionStorage', {
      getItem,
      setItem,
      removeItem,
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    });
    const { result } = renderHook(() => useReturnNavigation());

    expect(() =>
      result.current.captureReturnTarget({
        sourceSurface: 'wall',
        params: {},
        uiState: {},
      })
    ).not.toThrow();
    expect(() => result.current.clearReturnTarget()).not.toThrow();
    expect(result.current.consumeReturnTarget()).toBeNull();
    expect(getItem).toHaveBeenCalledWith(RETURN_NAVIGATION_STORAGE_KEY);

    vi.unstubAllGlobals();
  });

  it('navigates without consuming so the destination can restore after remount', () => {
    const navigate = vi.fn();
    const restoreUiState = vi.fn();
    const { result } = renderHook(() => useReturnNavigation());
    act(() =>
      result.current.saveReturnTarget({
        sourceSurface: 'wall',
        params: { hubId: 'hub-1' },
        scrollPosition: { x: 5, y: 8 },
        uiState: { selected: 'finding-1' },
      })
    );

    const returned = result.current.returnToSavedTarget({ navigate, restoreUiState });

    expect(returned).toEqual({
      sourceSurface: 'wall',
      params: { hubId: 'hub-1' },
      scrollPosition: { x: 5, y: 8 },
      uiState: { selected: 'finding-1' },
    });
    expect(navigate).toHaveBeenCalledWith('wall', { hubId: 'hub-1' });
    expect(restoreUiState).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(result.current.consumeReturnTarget()).toEqual({
      sourceSurface: 'wall',
      params: { hubId: 'hub-1' },
      scrollPosition: { x: 5, y: 8 },
      uiState: { selected: 'finding-1' },
    });
  });

  it('restores ui state and scroll immediately when no navigation callback is provided', () => {
    const restoreUiState = vi.fn();
    const { result } = renderHook(() => useReturnNavigation());
    act(() =>
      result.current.saveReturnTarget({
        sourceSurface: 'wall',
        params: { hubId: 'hub-1' },
        scrollPosition: { x: 5, y: 8 },
        uiState: { selected: 'finding-1' },
      })
    );

    result.current.returnToSavedTarget({ restoreUiState });

    expect(restoreUiState).toHaveBeenCalledWith({ selected: 'finding-1' });
    expect(window.scrollTo).toHaveBeenCalledWith(5, 8);
  });
});
