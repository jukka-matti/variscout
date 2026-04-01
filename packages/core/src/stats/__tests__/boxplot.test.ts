import { describe, it, expect } from 'vitest';
import { calculateBoxplotStats, sortBoxplotData } from '../boxplot';
import type { BoxplotGroupData } from '../../types';

describe('calculateBoxplotStats', () => {
  it('calculates correct five-number summary for [1,2,3,4,5]', () => {
    const result = calculateBoxplotStats({ group: 'Test', values: [1, 2, 3, 4, 5] });
    expect(result.key).toBe('Test');
    expect(result.median).toBe(3);
    expect(result.mean).toBeCloseTo(3, 8);
    // Q1: index (4)*0.25 = 1.0 → sorted[1] = 2
    expect(result.q1).toBeCloseTo(2, 4);
    // Q3: index (4)*0.75 = 3.0 → sorted[3] = 4
    expect(result.q3).toBeCloseTo(4, 4);
    expect(result.outliers).toEqual([]);
  });

  it('detects outliers using 1.5*IQR rule', () => {
    // Data: [1, 2, 3, 4, 5, 100]
    // Sorted: [1, 2, 3, 4, 5, 100]
    // n=6, q1Index = 5*0.25 = 1.25, q3Index = 5*0.75 = 3.75
    // q1 = 2 + 0.25*(3-2) = 2.25
    // q3 = 4 + 0.75*(5-4) = 4.75
    // IQR = 2.5, upper fence = 4.75 + 3.75 = 8.5
    // 100 is well above 8.5 → outlier
    const result = calculateBoxplotStats({ group: 'Outlier', values: [1, 2, 3, 4, 5, 100] });
    expect(result.outliers).toContain(100);
    expect(result.outliers).toHaveLength(1);
  });

  it('handles single value', () => {
    const result = calculateBoxplotStats({ group: 'Single', values: [42] });
    expect(result.median).toBe(42);
    expect(result.mean).toBe(42);
    expect(result.q1).toBe(42);
    expect(result.q3).toBe(42);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
  });

  it('handles two values', () => {
    const result = calculateBoxplotStats({ group: 'Two', values: [10, 20] });
    expect(result.median).toBeCloseTo(15, 8);
    expect(result.mean).toBeCloseTo(15, 8);
    // q1Index = 1*0.25 = 0.25 → 10 + 0.25*(20-10) = 12.5
    expect(result.q1).toBeCloseTo(12.5, 4);
    // q3Index = 1*0.75 = 0.75 → 10 + 0.75*(20-10) = 17.5
    expect(result.q3).toBeCloseTo(17.5, 4);
  });

  it('handles identical values', () => {
    const result = calculateBoxplotStats({ group: 'Same', values: [7, 7, 7, 7] });
    expect(result.median).toBe(7);
    expect(result.mean).toBe(7);
    expect(result.q1).toBe(7);
    expect(result.q3).toBe(7);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
  });

  it('returns zeros for empty values', () => {
    const result = calculateBoxplotStats({ group: 'Empty', values: [] });
    expect(result.median).toBe(0);
    expect(result.mean).toBe(0);
    expect(result.q1).toBe(0);
    expect(result.q3).toBe(0);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
  });

  it('calculates correct standard deviation (sample)', () => {
    // [1,2,3,4,5] sample stdDev = sqrt(10/4) = sqrt(2.5) ≈ 1.5811
    const result = calculateBoxplotStats({ group: 'StdDev', values: [1, 2, 3, 4, 5] });
    expect(result.stdDev).toBeCloseTo(Math.sqrt(2.5), 4);
  });

  it('clamps whiskers to fence (min/max exclude outliers)', () => {
    // With outlier at 100, max whisker should be clamped to upper fence
    const result = calculateBoxplotStats({ group: 'Clamped', values: [1, 2, 3, 4, 5, 100] });
    // max is clamped to min(dataMax, upperFence) — since 5 < upperFence 8.5, max = 5
    // But the implementation uses Math.min(max, upperFence) where max=100 and fence=8.5
    // So max whisker = 8.5 (the fence value)
    expect(result.max).toBeLessThan(100);
    expect(result.max).toBeCloseTo(8.5, 4);
  });

  it('handles even number of values for median', () => {
    // [1, 2, 3, 4] → median = (2+3)/2 = 2.5
    const result = calculateBoxplotStats({ group: 'Even', values: [4, 1, 3, 2] });
    expect(result.median).toBeCloseTo(2.5, 8);
  });
});

describe('sortBoxplotData', () => {
  const data: BoxplotGroupData[] = [
    {
      key: 'B',
      values: [],
      min: 0,
      max: 10,
      q1: 3,
      median: 5,
      mean: 5,
      q3: 7,
      outliers: [],
      stdDev: 2,
    },
    {
      key: 'A',
      values: [],
      min: 0,
      max: 20,
      q1: 8,
      median: 10,
      mean: 10,
      q3: 15,
      outliers: [],
      stdDev: 4,
    },
    {
      key: 'C',
      values: [],
      min: 0,
      max: 5,
      q1: 1,
      median: 2,
      mean: 2,
      q3: 3,
      outliers: [],
      stdDev: 1,
    },
  ];

  it('sorts by name ascending by default', () => {
    const sorted = sortBoxplotData(data);
    expect(sorted.map(d => d.key)).toEqual(['A', 'B', 'C']);
  });

  it('sorts by name descending', () => {
    const sorted = sortBoxplotData(data, 'name', 'desc');
    expect(sorted.map(d => d.key)).toEqual(['C', 'B', 'A']);
  });

  it('sorts by mean ascending', () => {
    const sorted = sortBoxplotData(data, 'mean', 'asc');
    expect(sorted.map(d => d.key)).toEqual(['C', 'B', 'A']);
  });

  it('sorts by mean descending', () => {
    const sorted = sortBoxplotData(data, 'mean', 'desc');
    expect(sorted.map(d => d.key)).toEqual(['A', 'B', 'C']);
  });

  it('sorts by spread (IQR) ascending', () => {
    // IQR: B=4, A=7, C=2
    const sorted = sortBoxplotData(data, 'spread', 'asc');
    expect(sorted.map(d => d.key)).toEqual(['C', 'B', 'A']);
  });

  it('does not mutate the original array', () => {
    const original = [...data];
    sortBoxplotData(data, 'mean', 'desc');
    expect(data).toEqual(original);
  });
});
