import { describe, it, expect } from 'vitest';
import { computeHistogramBins } from '../histogramBins';

describe('computeHistogramBins', () => {
  it('returns an empty array for no input', () => {
    expect(computeHistogramBins([])).toEqual([]);
  });

  it('returns a single bin for length-1 input', () => {
    const bins = computeHistogramBins([5]);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(1);
    expect(bins[0]?.x0).toBe(5);
    expect(bins[0]?.x1).toBe(5);
  });

  it('uses Sturges rule by default — bins ≈ ceil(log2(n) + 1)', () => {
    const values = Array.from({ length: 16 }, (_, i) => i);
    const bins = computeHistogramBins(values);
    // log2(16) + 1 = 5 → ceil = 5
    expect(bins).toHaveLength(5);
  });

  it('totals to N — every value lands in exactly one bin', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const bins = computeHistogramBins(values);
    const total = bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(values.length);
  });

  it('bins are contiguous and non-overlapping (x1 of bin i = x0 of bin i+1)', () => {
    const bins = computeHistogramBins([1, 2, 3, 4, 5, 6, 7, 8]);
    for (let i = 0; i < bins.length - 1; i++) {
      expect(bins[i]?.x1).toBeCloseTo(bins[i + 1]?.x0 ?? NaN, 6);
    }
  });

  it('handles all-equal input by returning a single zero-width bin', () => {
    const bins = computeHistogramBins([7, 7, 7, 7]);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(4);
    expect(bins[0]?.x0).toBe(7);
    expect(bins[0]?.x1).toBe(7);
  });

  it('Scott rule produces a different bin count than Sturges on a representative sample', () => {
    const values = Array.from({ length: 100 }, (_, i) => Math.sin(i / 5) * 10 + i / 10);
    const sturges = computeHistogramBins(values, 'sturges');
    const scott = computeHistogramBins(values, 'scott');
    expect(sturges.length).toBeGreaterThan(0);
    expect(scott.length).toBeGreaterThan(0);
    expect(sturges.length).not.toBe(scott.length);
  });

  it('returns finite numbers only — no NaN / Infinity (ADR-069 B2)', () => {
    const values = [1, 2, 3, 4];
    const bins = computeHistogramBins(values);
    for (const bin of bins) {
      expect(Number.isFinite(bin.x0)).toBe(true);
      expect(Number.isFinite(bin.x1)).toBe(true);
      expect(Number.isFinite(bin.count)).toBe(true);
    }
  });
});
