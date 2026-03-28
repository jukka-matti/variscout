import { describe, it, expect } from 'vitest';
import {
  computeDrillProjection,
  computeCenteringOpportunity,
  computeSpecSuggestion,
  computeCumulativeProjection,
} from '../variation/projection';
import type { StatsResult } from '../types';

describe('computeDrillProjection', () => {
  const specs = { usl: 12, lsl: 10 };

  it('returns projection when complement is better than subset', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const complement = { mean: 11.0, stdDev: 0.3, count: 20 };

    const result = computeDrillProjection(subset, complement, specs);

    expect(result).not.toBeNull();
    expect(result!.projectedCpk).toBeGreaterThan(result!.currentCpk!);
    expect(result!.label).toBe('if fixed');
    expect(result!.findingCount).toBe(1);
  });

  it('returns null when no specs', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const complement = { mean: 11.0, stdDev: 0.3, count: 20 };

    expect(computeDrillProjection(subset, complement)).toBeNull();
    expect(computeDrillProjection(subset, complement, {})).toBeNull();
  });

  it('returns null when complement count < 2', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const complement = { mean: 11.0, stdDev: 0.3, count: 1 };

    expect(computeDrillProjection(subset, complement, specs)).toBeNull();
  });

  it('returns valid Cpk values', () => {
    const subset = { mean: 13.0, stdDev: 0.4, count: 10 };
    const complement = { mean: 11.0, stdDev: 0.25, count: 20 };

    const result = computeDrillProjection(subset, complement, specs);

    expect(result).not.toBeNull();
    expect(typeof result!.currentCpk).toBe('number');
    expect(typeof result!.projectedCpk).toBe('number');
    expect(isFinite(result!.currentCpk)).toBe(true);
    expect(isFinite(result!.projectedCpk)).toBe(true);
  });
});

describe('computeCenteringOpportunity', () => {
  const makeStats = (cp: number | undefined, cpk: number | undefined): StatsResult => ({
    mean: 11.0,
    median: 11.0,
    stdDev: 0.5,
    sigmaWithin: 0.45,
    mrBar: 0.5,
    ucl: 12.35,
    lcl: 9.65,
    cp,
    cpk,
    outOfSpecPercentage: 10,
  });

  it('returns opportunity when gap > 0.1', () => {
    const result = computeCenteringOpportunity(makeStats(1.5, 0.8));

    expect(result).not.toBeNull();
    expect(result!.cp).toBe(1.5);
    expect(result!.currentCpk).toBe(0.8);
    expect(result!.gap).toBeCloseTo(0.7);
  });

  it('returns null when gap <= 0.1', () => {
    expect(computeCenteringOpportunity(makeStats(1.5, 1.42))).toBeNull();
    expect(computeCenteringOpportunity(makeStats(1.5, 1.45))).toBeNull();
  });

  it('returns null when cp or cpk undefined', () => {
    expect(computeCenteringOpportunity(makeStats(undefined, 0.8))).toBeNull();
    expect(computeCenteringOpportunity(makeStats(1.5, undefined))).toBeNull();
    expect(computeCenteringOpportunity(makeStats(undefined, undefined))).toBeNull();
  });
});

describe('computeSpecSuggestion', () => {
  it('returns natural tolerance as suggested specs', () => {
    const complement = { mean: 11.0, stdDev: 0.3, count: 20 };
    const result = computeSpecSuggestion(complement);

    expect(result).not.toBeNull();
    expect(result!.suggestedLsl).toBeCloseTo(11.0 - 0.9);
    expect(result!.suggestedUsl).toBeCloseTo(11.0 + 0.9);
    expect(result!.label).toContain('Achievable');
    expect(result!.label).toContain('10.1');
    expect(result!.label).toContain('11.9');
  });

  it('returns null when count < 2', () => {
    expect(computeSpecSuggestion({ mean: 11.0, stdDev: 0.3, count: 1 })).toBeNull();
    expect(computeSpecSuggestion({ mean: 11.0, stdDev: 0.3, count: 0 })).toBeNull();
  });

  it('returns null when stdDev is 0', () => {
    expect(computeSpecSuggestion({ mean: 11.0, stdDev: 0, count: 20 })).toBeNull();
  });
});

describe('computeCumulativeProjection', () => {
  const specs = { usl: 12, lsl: 10 };

  // Build test data: 3 groups with different means
  const rawData = [
    // Group A: centered (good)
    ...Array.from({ length: 10 }, (_, i) => ({
      Group: 'A',
      Value: 11.0 + (i - 5) * 0.1,
    })),
    // Group B: shifted high (bad)
    ...Array.from({ length: 10 }, (_, i) => ({
      Group: 'B',
      Value: 12.8 + (i - 5) * 0.1,
    })),
    // Group C: shifted low (moderate)
    ...Array.from({ length: 10 }, (_, i) => ({
      Group: 'C',
      Value: 10.5 + (i - 5) * 0.1,
    })),
  ];

  it('returns projection for single finding', () => {
    const result = computeCumulativeProjection(
      [{ activeFilters: { Group: ['B'] } }],
      rawData,
      'Value',
      specs
    );

    expect(result).not.toBeNull();
    expect(result!.projectedCpk).toBeGreaterThan(result!.currentCpk);
    expect(result!.findingCount).toBe(1);
    expect(result!.label).toBe('if fixed');
  });

  it('returns better projection for two findings than one', () => {
    const single = computeCumulativeProjection(
      [{ activeFilters: { Group: ['B'] } }],
      rawData,
      'Value',
      specs
    );

    const double = computeCumulativeProjection(
      [{ activeFilters: { Group: ['B'] } }, { activeFilters: { Group: ['C'] } }],
      rawData,
      'Value',
      specs
    );

    expect(single).not.toBeNull();
    expect(double).not.toBeNull();
    // Fixing two groups should give equal or better projection than fixing one
    // (Group A is the best, so removing B and C leaves only A)
    expect(double!.projectedCpk).toBeGreaterThanOrEqual(single!.projectedCpk);
    expect(double!.findingCount).toBe(2);
    expect(double!.label).toContain('2');
  });

  it('returns null when no specs', () => {
    expect(
      computeCumulativeProjection([{ activeFilters: { Group: ['B'] } }], rawData, 'Value')
    ).toBeNull();
  });

  it('returns null when empty findings', () => {
    expect(computeCumulativeProjection([], rawData, 'Value', specs)).toBeNull();
  });

  it('returns null when rawData too small', () => {
    expect(
      computeCumulativeProjection(
        [{ activeFilters: { Group: ['B'] } }],
        [{ Group: 'A', Value: 11 }],
        'Value',
        specs
      )
    ).toBeNull();
  });
});
