import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollSpy } from '../useScrollSpy';

// ---------------------------------------------------------------------------
// Mock IntersectionObserver
// ---------------------------------------------------------------------------

const mockDisconnect = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

// Keep a reference to the mock constructor so we can assert on it
let MockIntersectionObserver: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  MockIntersectionObserver = vi.fn(function (
    this: object,
    _callback: (entries: IntersectionObserverEntry[]) => void
  ) {
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScrollSpy', () => {
  it('returns a refs object with a key for each section id', () => {
    const sectionIds = ['current-condition', 'drivers', 'hypotheses'];
    const { result } = renderHook(() => useScrollSpy({ sectionIds }));

    expect(Object.keys(result.current.refs)).toEqual(expect.arrayContaining(sectionIds));
    expect(Object.keys(result.current.refs)).toHaveLength(sectionIds.length);
  });

  it('initial activeId is the first section id', () => {
    const sectionIds = ['current-condition', 'drivers', 'hypotheses'];
    const { result } = renderHook(() => useScrollSpy({ sectionIds }));
    expect(result.current.activeId).toBe('current-condition');
  });

  it('initial activeId is null when no section ids provided', () => {
    const { result } = renderHook(() => useScrollSpy({ sectionIds: [] }));
    expect(result.current.activeId).toBeNull();
  });

  it('each ref object has a current property (initially null)', () => {
    const sectionIds = ['sec-a', 'sec-b'];
    const { result } = renderHook(() => useScrollSpy({ sectionIds }));
    for (const id of sectionIds) {
      expect(result.current.refs[id]).toBeDefined();
      expect(result.current.refs[id].current).toBeNull();
    }
  });

  it('observer.disconnect is called on unmount', () => {
    const sectionIds = ['current-condition', 'drivers'];
    const { unmount } = renderHook(() => useScrollSpy({ sectionIds }));
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('does not observe elements when no section ids are provided', () => {
    renderHook(() => useScrollSpy({ sectionIds: [] }));
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('creates IntersectionObserver with custom rootMargin', () => {
    const sectionIds = ['s1'];
    const rootMargin = '-10% 0px -60% 0px';
    renderHook(() => useScrollSpy({ sectionIds, rootMargin }));
    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin })
    );
  });
});
