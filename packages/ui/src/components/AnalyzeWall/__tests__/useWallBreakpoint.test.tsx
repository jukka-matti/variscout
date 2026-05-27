/**
 * Tests for useWallIsMobile hook (Phase 14.1).
 *
 * Verifies that the hook correctly reflects `window.matchMedia` state on
 * mount and updates when the `change` event fires (viewport resize).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallIsMobile, WALL_MOBILE_BREAKPOINT } from '../hooks/useWallBreakpoint';

// Mutable matchMedia state controlled by each test.
let currentMatches = false;
let listeners: Array<(e: MediaQueryListEvent) => void> = [];

beforeEach(() => {
  currentMatches = false;
  listeners = [];

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      },
      removeEventListener: (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter(h => h !== handler);
      },
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('useWallIsMobile', () => {
  it('returns true when matchMedia initially matches (mobile viewport)', () => {
    currentMatches = true;
    const { result } = renderHook(() => useWallIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when matchMedia does not match (desktop viewport)', () => {
    currentMatches = false;
    const { result } = renderHook(() => useWallIsMobile());
    expect(result.current).toBe(false);
  });

  it('flips to true when the matchMedia change event fires with matches=true', () => {
    currentMatches = false;
    const { result } = renderHook(() => useWallIsMobile());
    expect(result.current).toBe(false);

    // Simulate viewport resize below the breakpoint.
    act(() => {
      listeners.forEach(h => h({ matches: true } as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);
  });

  it('flips back to false when the change event fires with matches=false', () => {
    currentMatches = true;
    const { result } = renderHook(() => useWallIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      listeners.forEach(h => h({ matches: false } as MediaQueryListEvent));
    });
    expect(result.current).toBe(false);
  });

  it('uses the documented 768px breakpoint constant', () => {
    expect(WALL_MOBILE_BREAKPOINT).toBe(768);
    renderHook(() => useWallIsMobile());
    // Last matchMedia call should have queried with the breakpoint value.
    const mm = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    const lastCallQuery = mm.mock.calls[mm.mock.calls.length - 1]?.[0];
    expect(lastCallQuery).toContain('768');
  });
});
