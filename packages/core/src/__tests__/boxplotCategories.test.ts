import { describe, it, expect } from 'vitest';
import { selectBoxplotCategories, getMaxBoxplotCategories, MIN_BOX_STEP } from '../stats/boxplot';
import type { BoxplotGroupData } from '../types';

function makeGroup(key: string, median: number, iqr: number, mean?: number): BoxplotGroupData {
  const q1 = median - iqr / 2;
  const q3 = median + iqr / 2;
  return {
    key,
    values: [q1, median, q3],
    min: q1 - iqr,
    max: q3 + iqr,
    q1,
    median,
    mean: mean ?? median,
    q3,
    outliers: [],
    stdDev: iqr / 1.35,
  };
}

describe('getMaxBoxplotCategories', () => {
  it('calculates from width using MIN_BOX_STEP', () => {
    expect(getMaxBoxplotCategories(300)).toBe(Math.floor(300 / MIN_BOX_STEP));
    expect(getMaxBoxplotCategories(1200)).toBe(Math.floor(1200 / MIN_BOX_STEP));
  });

  it('returns minimum 2', () => {
    expect(getMaxBoxplotCategories(50)).toBe(2);
    expect(getMaxBoxplotCategories(0)).toBe(2);
  });
});

describe('selectBoxplotCategories', () => {
  const data: BoxplotGroupData[] = [
    makeGroup('Germany', 50000, 20000),
    makeGroup('Sweden', 40000, 15000),
    makeGroup('Estonia', 25000, 30000), // highest IQR
    makeGroup('Russia', 35000, 25000),
    makeGroup('UK', 18000, 8000),
    makeGroup('France', 10000, 5000),
    makeGroup('Japan', 8000, 12000),
    makeGroup('China', 8000, 18000),
  ];

  it('returns all categories when maxCount >= data length', () => {
    const result = selectBoxplotCategories(data, 10, {});
    expect(result.categories).toHaveLength(8);
  });

  it('selects top N by IQR when no specs (exploratory)', () => {
    const result = selectBoxplotCategories(data, 3, {});
    expect(result.criterion).toBe('spread');
    // Highest IQR: Estonia (30K), Russia (25K), Germany (20K)
    expect(result.categories).toEqual(['Estonia', 'Russia', 'Germany']);
  });

  it('selects highest median when smaller-is-better (USL only)', () => {
    const result = selectBoxplotCategories(data, 3, { usl: 60000 });
    expect(result.criterion).toBe('mean');
    // Highest median: Germany (50K), Sweden (40K), Russia (35K)
    expect(result.categories).toEqual(['Germany', 'Sweden', 'Russia']);
  });

  it('selects lowest median when larger-is-better (LSL only)', () => {
    const result = selectBoxplotCategories(data, 3, { lsl: 5000 });
    expect(result.criterion).toBe('mean');
    // Lowest median: Japan (8K), China (8K), France (10K)
    expect(result.categories[0]).toBe('Japan');
    expect(result.categories).toContain('China');
    expect(result.categories).toContain('France');
  });

  it('selects farthest from target when nominal (USL + LSL)', () => {
    const result = selectBoxplotCategories(data, 3, { usl: 40000, lsl: 20000, target: 30000 });
    expect(result.criterion).toBe('distance');
    // Farthest from 30K: Germany |50K-30K|=20K, Japan |8K-30K|=22K, China |8K-30K|=22K
    expect(result.categories).toContain('Japan');
    expect(result.categories).toContain('Germany');
  });

  it('uses sort criterion when sortBy is not name', () => {
    const result = selectBoxplotCategories(data, 3, {}, 'mean', 'desc');
    expect(result.criterion).toBe('mean');
    // Highest mean: Germany (50K), Sweden (40K), Russia (35K)
    expect(result.categories).toEqual(['Germany', 'Sweden', 'Russia']);
  });

  it('sort by spread descending overrides specs', () => {
    const result = selectBoxplotCategories(data, 3, { usl: 60000 }, 'spread', 'desc');
    expect(result.criterion).toBe('spread');
    // Highest IQR: Estonia (30K), Russia (25K), Germany (20K)
    expect(result.categories).toEqual(['Estonia', 'Russia', 'Germany']);
  });

  it('sort ascending reverses the order', () => {
    const result = selectBoxplotCategories(data, 3, {}, 'mean', 'asc');
    // Lowest mean: Japan (8K), China (8K), France (10K)
    expect(result.categories[0]).toBe('Japan');
  });
});
