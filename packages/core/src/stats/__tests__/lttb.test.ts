import { describe, it, expect } from 'vitest';
import { lttb } from '../lttb';

describe('lttb', () => {
  const makePoints = (ys: number[]) => ys.map((y, i) => ({ x: i, y, originalIndex: i }));

  it('returns all points when data length <= threshold', () => {
    const data = makePoints([1, 2, 3, 4, 5]);
    const result = lttb(data, 10);
    expect(result).toHaveLength(5);
  });

  it('returns exactly threshold points when data exceeds threshold', () => {
    const data = makePoints(Array.from({ length: 100 }, (_, i) => Math.sin(i / 10)));
    const result = lttb(data, 20);
    expect(result).toHaveLength(20);
  });

  it('always preserves first and last points', () => {
    const data = makePoints([10, 5, 3, 7, 2, 8, 1, 9, 4, 6]);
    const result = lttb(data, 4);
    expect(result[0]).toEqual(data[0]);
    expect(result[result.length - 1]).toEqual(data[data.length - 1]);
  });

  it('preserves visual peaks and valleys', () => {
    // Create data with a clear spike at index 50
    const data = makePoints(Array.from({ length: 100 }, (_, i) => (i === 50 ? 100 : 10)));
    const result = lttb(data, 10);
    // The spike should be preserved
    const maxY = Math.max(...result.map(p => p.y));
    expect(maxY).toBe(100);
  });

  it('force-includes specified indices', () => {
    const data = makePoints(Array.from({ length: 200 }, () => 10));
    // Point 77 is a violation — force include it even in flat data
    data[77] = { x: 77, y: 999, originalIndex: 77 };
    const forceInclude = new Set([77]);
    const result = lttb(data, 10, forceInclude);
    expect(result.some(p => p.originalIndex === 77)).toBe(true);
  });

  it('returns sorted output when force-including points', () => {
    const data = makePoints(Array.from({ length: 100 }, (_, i) => i));
    const forceInclude = new Set([25, 75]);
    const result = lttb(data, 10, forceInclude);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].x).toBeGreaterThan(result[i - 1].x);
    }
  });

  it('handles threshold of 2 (just first and last)', () => {
    const data = makePoints([1, 5, 3, 8, 2]);
    const result = lttb(data, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(data[0]);
    expect(result[1]).toEqual(data[data.length - 1]);
  });

  it('handles empty data', () => {
    const result = lttb([], 10);
    expect(result).toHaveLength(0);
  });

  it('handles single point', () => {
    const data = makePoints([42]);
    const result = lttb(data, 10);
    expect(result).toHaveLength(1);
  });
});
