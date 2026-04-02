import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResizablePanel } from '../useResizablePanel';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useResizablePanel', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default width when no stored value', () => {
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(result.current.width).toBe(350);
  });

  it('restores width from localStorage', () => {
    localStorageMock.setItem('test-key', '420');
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(result.current.width).toBe(420);
  });

  it('clamps stored value to min', () => {
    localStorageMock.setItem('test-key', '50');
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(result.current.width).toBe(200);
  });

  it('clamps stored value to max', () => {
    localStorageMock.setItem('test-key', '800');
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(result.current.width).toBe(600);
  });

  it('starts not dragging', () => {
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(result.current.isDragging).toBe(false);
  });

  it('handleMouseDown sets isDragging to true', () => {
    const { result } = renderHook(() => useResizablePanel('test-key', 200, 600, 350));

    act(() => {
      result.current.handleMouseDown({
        preventDefault: vi.fn(),
        currentTarget: {
          parentElement: {
            getBoundingClientRect: () => ({ left: 0, right: window.innerWidth }),
          },
        },
      } as unknown as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('persists width to localStorage on change', () => {
    renderHook(() => useResizablePanel('test-key', 200, 600, 350));
    expect(localStorageMock.getItem('test-key')).toBe('350');
  });
});
