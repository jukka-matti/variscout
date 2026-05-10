import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiveProjection } from '../useLiveProjection';

// Stable fetchBatch factory — returns a new Map from a plain object each call.
// Used for tests where fetchBatch reference is stable across rerenders.
function makeFetchBatch<T>(store: Record<string, T>) {
  return (ids: ReadonlyArray<string>): Map<string, T> => {
    const m = new Map<string, T>();
    for (const id of ids) {
      if (id in store) m.set(id, store[id]);
    }
    return m;
  };
}

describe('useLiveProjection', () => {
  it('returns resolved entities in fkList order when all IDs hit', () => {
    const store = { a: { label: 'Alpha' }, b: { label: 'Beta' }, c: { label: 'Gamma' } };
    const fetchBatch = makeFetchBatch(store);
    const fkList = ['a', 'b', 'c'] as const;

    const { result } = renderHook(() => useLiveProjection(fkList, fetchBatch));

    expect(result.current).toEqual([{ label: 'Alpha' }, { label: 'Beta' }, { label: 'Gamma' }]);
  });

  it('silently drops missing FK entries', () => {
    const store = { a: { label: 'Alpha' }, c: { label: 'Gamma' } };
    const fetchBatch = makeFetchBatch(store);
    const fkList = ['a', 'b', 'c'] as const; // 'b' is not in store

    const { result } = renderHook(() => useLiveProjection(fkList, fetchBatch));

    expect(result.current).toEqual([{ label: 'Alpha' }, { label: 'Gamma' }]);
    expect(result.current).toHaveLength(2);
  });

  it('re-runs projection when fkList reference changes', () => {
    const store = { a: { label: 'Alpha' }, b: { label: 'Beta' } };
    const fetchBatch = makeFetchBatch(store);

    let fkList: ReadonlyArray<string> = ['a'];
    const { result, rerender } = renderHook(() => useLiveProjection(fkList, fetchBatch));

    expect(result.current).toEqual([{ label: 'Alpha' }]);

    // Change fkList to a new reference
    fkList = ['a', 'b'];
    rerender();

    expect(result.current).toEqual([{ label: 'Alpha' }, { label: 'Beta' }]);
  });

  it('memoizes — returns the same array reference when neither input changes', () => {
    const store = { x: { val: 1 } };
    const fetchBatch = makeFetchBatch(store);
    const fkList: ReadonlyArray<string> = ['x'];

    const { result, rerender } = renderHook(() => useLiveProjection(fkList, fetchBatch));

    const firstRef = result.current;

    // Rerender with identical fkList and fetchBatch references
    rerender();

    expect(result.current).toBe(firstRef);
  });
});
