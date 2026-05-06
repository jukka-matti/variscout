import { describe, it, expect } from 'vitest';
import {
  computeDrillProjection,
  computeCenteringOpportunity,
  computeSpecSuggestion,
  computeCumulativeProjection,
  computeBenchmarkProjection,
} from '../variation/projection';
import { isFindingScoped, getScopedFindings } from '../findings/helpers';
import type { StatsResult } from '../types';
import type { Finding } from '../findings/types';

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

describe('computeBenchmarkProjection', () => {
  const specs = { usl: 12, lsl: 10 };

  it('returns projection using benchmark stats as target', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const benchmark = { mean: 11.0, stdDev: 0.2, count: 10 };
    const complement = { mean: 11.5, stdDev: 0.4, count: 20 };

    const result = computeBenchmarkProjection(subset, benchmark, complement, specs, 'Bed A, AM');

    expect(result).not.toBeNull();
    expect(result!.projectedCpk).toBeGreaterThan(result!.currentCpk);
    expect(result!.label).toBe('benchmark: Bed A, AM');
    expect(result!.findingCount).toBe(1);
  });

  it('returns better projection than complement when benchmark is better', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const benchmark = { mean: 11.0, stdDev: 0.15, count: 10 }; // tighter than complement
    const complement = { mean: 11.5, stdDev: 0.4, count: 20 };

    const benchResult = computeBenchmarkProjection(subset, benchmark, complement, specs);
    const compResult = computeDrillProjection(subset, complement, specs);

    expect(benchResult).not.toBeNull();
    expect(compResult).not.toBeNull();
    expect(benchResult!.projectedCpk).toBeGreaterThan(compResult!.projectedCpk);
  });

  it('returns null when no specs', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const benchmark = { mean: 11.0, stdDev: 0.2, count: 10 };
    const complement = { mean: 11.5, stdDev: 0.4, count: 20 };

    expect(computeBenchmarkProjection(subset, benchmark, complement)).toBeNull();
  });

  it('returns null when benchmark count < 2', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const benchmark = { mean: 11.0, stdDev: 0.2, count: 1 };
    const complement = { mean: 11.5, stdDev: 0.4, count: 20 };

    expect(computeBenchmarkProjection(subset, benchmark, complement, specs)).toBeNull();
  });

  it('uses default label when benchmarkLabel not provided', () => {
    const subset = { mean: 13.2, stdDev: 0.5, count: 10 };
    const benchmark = { mean: 11.0, stdDev: 0.2, count: 10 };
    const complement = { mean: 11.5, stdDev: 0.4, count: 20 };

    const result = computeBenchmarkProjection(subset, benchmark, complement, specs);
    expect(result!.label).toBe('benchmark');
  });
});

describe('isFindingScoped', () => {
  const baseFinding: Finding = {
    id: '1',
    text: 'test',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1714000000000,
  };

  it('auto-scopes investigating and analyzed findings', () => {
    expect(isFindingScoped({ ...baseFinding, status: 'investigating' })).toBe(true);
    expect(isFindingScoped({ ...baseFinding, status: 'analyzed' })).toBe(true);
  });

  it('does not auto-scope observed, improving, or resolved findings', () => {
    expect(isFindingScoped({ ...baseFinding, status: 'observed' })).toBe(false);
    expect(isFindingScoped({ ...baseFinding, status: 'improving' })).toBe(false);
    expect(isFindingScoped({ ...baseFinding, status: 'resolved' })).toBe(false);
  });

  it('respects explicit scoped=true override', () => {
    expect(isFindingScoped({ ...baseFinding, status: 'observed', scoped: true })).toBe(true);
  });

  it('respects explicit scoped=false override', () => {
    expect(isFindingScoped({ ...baseFinding, status: 'analyzed', scoped: false })).toBe(false);
  });
});

describe('getScopedFindings', () => {
  const baseFinding: Finding = {
    id: '1',
    text: 'test',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'analyzed',
    comments: [],
    statusChangedAt: 1714000000000,
  };

  it('excludes benchmark findings', () => {
    const findings = [
      { ...baseFinding, id: '1', role: 'benchmark' as const },
      { ...baseFinding, id: '2' },
    ];
    const scoped = getScopedFindings(findings);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].id).toBe('2');
  });

  it('includes auto-scoped findings', () => {
    const findings = [
      { ...baseFinding, id: '1', status: 'investigating' as const },
      { ...baseFinding, id: '2', status: 'observed' as const },
    ];
    const scoped = getScopedFindings(findings);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].id).toBe('1');
  });
});
