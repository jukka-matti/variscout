import { describe, it, expect } from 'vitest';
import { calculateKDE } from '../kde';

describe('calculateKDE', () => {
  it('returns array of {value, count} points for a simple dataset', () => {
    const result = calculateKDE([1, 2, 3, 4, 5]);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('count');
  });

  it('returns default 100 evaluation points', () => {
    const result = calculateKDE([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).toHaveLength(100);
  });

  it('respects custom numPoints parameter', () => {
    const result = calculateKDE([1, 2, 3, 4, 5], 50);
    expect(result).toHaveLength(50);
  });

  it('density integrates to approximately 1', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = calculateKDE(data, 200);
    // Numerical integration: sum(density * step)
    const step = result[1].value - result[0].value;
    const integral = result.reduce((sum, p) => sum + p.count * step, 0);
    expect(integral).toBeCloseTo(1, 1);
  });

  it('all density values are non-negative', () => {
    const result = calculateKDE([1, 2, 3, 4, 5]);
    for (const point of result) {
      expect(point.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('peak density is near the data center for symmetric data', () => {
    const data = [8, 9, 10, 11, 12];
    const result = calculateKDE(data, 100);
    // Find the point with maximum density
    const peak = result.reduce((best, p) => (p.count > best.count ? p : best), result[0]);
    // Peak should be near the mean (10)
    expect(peak.value).toBeCloseTo(10, 0);
  });

  it('returns empty array for single value', () => {
    // KDE requires at least 2 values
    const result = calculateKDE([42]);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const result = calculateKDE([]);
    expect(result).toEqual([]);
  });

  it('handles identical values', () => {
    // All same values: stdDev=0, IQR=0, falls back to spread=1
    const result = calculateKDE([5, 5, 5, 5, 5]);
    expect(result.length).toBeGreaterThan(0);
    // Should still produce valid densities
    for (const point of result) {
      expect(point.count).toBeGreaterThanOrEqual(0);
      expect(isFinite(point.count)).toBe(true);
    }
  });

  it('extends evaluation range beyond data min/max (3*bandwidth)', () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateKDE(data);
    // First point should be below data min
    expect(result[0].value).toBeLessThan(10);
    // Last point should be above data max
    expect(result[result.length - 1].value).toBeGreaterThan(50);
  });

  it('produces higher density near data clusters', () => {
    // Bimodal data: cluster around 0 and 100
    const data = [0, 0.5, 1, 1.5, 2, 98, 98.5, 99, 99.5, 100];
    const result = calculateKDE(data, 200);
    // Find density near 1 (cluster 1) and near 50 (gap)
    const nearCluster = result.find(p => Math.abs(p.value - 1) < 2);
    const nearGap = result.find(p => Math.abs(p.value - 50) < 2);
    expect(nearCluster).toBeDefined();
    expect(nearGap).toBeDefined();
    expect(nearCluster!.count).toBeGreaterThan(nearGap!.count);
  });
});
