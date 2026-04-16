import { describe, it, expect } from 'vitest';
import { computeDefectSummaryProps, computeTrendDirection } from '../useDefectSummary';
import type { DefectTransformResult, DefectMapping } from '@variscout/core';

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Build a minimal DefectTransformResult from rate values. */
function makeResult(rates: number[]): DefectTransformResult {
  return {
    outcomeColumn: 'DefectRate',
    factors: [],
    data: rates.map(rate => ({
      DefectRate: rate,
      DefectCount: Math.round(rate * 100),
    })),
  };
}

const defaultMapping: DefectMapping = {
  dataShape: 'pre-aggregated',
  aggregationUnit: 'week',
};

// ─── computeTrendDirection ───────────────────────────────────────────────────

describe('computeTrendDirection', () => {
  it('returns "up" when second half is >10% higher', () => {
    // first half avg = 1, second half avg = 2 → 2 > 1.1 → 'up'
    expect(computeTrendDirection([1, 1, 2, 2])).toBe('up');
  });

  it('returns "down" when second half is >10% lower', () => {
    // first half avg = 2, second half avg = 1 → 1 < 1.8 → 'down'
    expect(computeTrendDirection([2, 2, 1, 1])).toBe('down');
  });

  it('returns "stable" for flat data', () => {
    expect(computeTrendDirection([5, 5, 5, 5])).toBe('stable');
  });

  it('returns "stable" when difference is within 10% band', () => {
    // first half avg = 10, second half avg = 10.5
    // 10.5 < 11 (10*1.1) and 10.5 > 9 (10*0.9) → stable
    expect(computeTrendDirection([10, 10, 10.5, 10.5])).toBe('stable');
  });

  it('returns undefined with fewer than 4 data points', () => {
    expect(computeTrendDirection([1, 2, 3])).toBeUndefined();
    expect(computeTrendDirection([1])).toBeUndefined();
    expect(computeTrendDirection([])).toBeUndefined();
  });

  it('handles odd number of data points (extra goes to second half)', () => {
    // 5 points: first half = [1, 1] avg=1, second half = [3, 3, 3] avg=3 → 'up'
    expect(computeTrendDirection([1, 1, 3, 3, 3])).toBe('up');
  });
});

// ─── computeDefectSummaryProps ───────────────────────────────────────────────

describe('computeDefectSummaryProps', () => {
  it('returns null for null input', () => {
    expect(computeDefectSummaryProps(null, null)).toBeNull();
  });

  it('returns null for empty data', () => {
    const result: DefectTransformResult = {
      outcomeColumn: 'DefectRate',
      factors: [],
      data: [],
    };
    expect(computeDefectSummaryProps(result, defaultMapping)).toBeNull();
  });

  it('includes trendDirection "up" for increasing rates', () => {
    const result = makeResult([1, 1, 1, 1, 5, 5, 5, 5]);
    const props = computeDefectSummaryProps(result, defaultMapping);
    expect(props).not.toBeNull();
    expect(props!.trendDirection).toBe('up');
  });

  it('includes trendDirection "down" for decreasing rates', () => {
    const result = makeResult([5, 5, 5, 5, 1, 1, 1, 1]);
    const props = computeDefectSummaryProps(result, defaultMapping);
    expect(props).not.toBeNull();
    expect(props!.trendDirection).toBe('down');
  });

  it('includes trendDirection "stable" for flat rates', () => {
    const result = makeResult([3, 3, 3, 3, 3, 3]);
    const props = computeDefectSummaryProps(result, defaultMapping);
    expect(props).not.toBeNull();
    expect(props!.trendDirection).toBe('stable');
  });

  it('has undefined trendDirection with fewer than 4 data points', () => {
    const result = makeResult([1, 2, 3]);
    const props = computeDefectSummaryProps(result, defaultMapping);
    expect(props).not.toBeNull();
    expect(props!.trendDirection).toBeUndefined();
  });

  it('still computes other summary fields correctly', () => {
    const result = makeResult([2, 4, 6, 8]);
    const props = computeDefectSummaryProps(result, defaultMapping);
    expect(props).not.toBeNull();
    expect(props!.defectRate).toBe(5); // (2+4+6+8)/4
    expect(props!.totalDefects).toBe(200 + 400 + 600 + 800); // sum of DefectCount
  });
});
