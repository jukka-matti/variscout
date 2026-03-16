import { describe, it, expect } from 'vitest';
import { calculateStagedComparison } from '../stats/staged';
import type { StatsResult, StagedStatsResult } from '../types';

/** Helper to build a minimal StatsResult */
function makeStats(overrides: Partial<StatsResult> = {}): StatsResult {
  return {
    mean: 50,
    median: 50,
    stdDev: 5,
    sigmaWithin: 4.5,
    mrBar: 5.3,
    ucl: 63.5,
    lcl: 36.5,
    outOfSpecPercentage: 0,
    ...overrides,
  };
}

describe('calculateStagedComparison', () => {
  it('returns null for single stage', () => {
    const staged: StagedStatsResult = {
      stages: new Map([['Before', makeStats()]]),
      stageOrder: ['Before'],
      overallStats: makeStats(),
    };
    expect(calculateStagedComparison(staged)).toBeNull();
  });

  it('computes 2-stage comparison (before/after)', () => {
    const before = makeStats({ mean: 50, stdDev: 5, cpk: 0.89, outOfSpecPercentage: 12 });
    const after = makeStats({ mean: 48, stdDev: 3.5, cpk: 1.32, outOfSpecPercentage: 2 });

    const staged: StagedStatsResult = {
      stages: new Map([
        ['Before', before],
        ['After', after],
      ]),
      stageOrder: ['Before', 'After'],
      overallStats: makeStats(),
    };

    const result = calculateStagedComparison(staged);
    expect(result).not.toBeNull();
    expect(result!.stages).toHaveLength(2);
    expect(result!.stages[0].name).toBe('Before');
    expect(result!.stages[1].name).toBe('After');

    // Deltas
    expect(result!.deltas.meanShift).toBeCloseTo(-2);
    expect(result!.deltas.variationRatio).toBeCloseTo(0.7); // 3.5/5
    expect(result!.deltas.cpkDelta).toBeCloseTo(0.43);
    expect(result!.deltas.passRateDelta).toBeCloseTo(10); // (100-2) - (100-12)
    expect(result!.deltas.outOfSpecReduction).toBeCloseTo(10); // 12 - 2

    // Color coding — cpk improved
    expect(result!.colorCoding.cpkDelta).toBe('green');
    // Variation reduced
    expect(result!.colorCoding.variationRatio).toBe('green');
    // Pass rate improved
    expect(result!.colorCoding.passRateDelta).toBe('green');
  });

  it('computes 3+ stage comparison (first→last delta)', () => {
    const s1 = makeStats({ mean: 50, stdDev: 6, cpk: 0.7 });
    const s2 = makeStats({ mean: 49, stdDev: 5, cpk: 0.9 });
    const s3 = makeStats({ mean: 48, stdDev: 3, cpk: 1.4 });

    const staged: StagedStatsResult = {
      stages: new Map([
        ['Phase 1', s1],
        ['Phase 2', s2],
        ['Phase 3', s3],
      ]),
      stageOrder: ['Phase 1', 'Phase 2', 'Phase 3'],
      overallStats: makeStats(),
    };

    const result = calculateStagedComparison(staged)!;
    expect(result.stages).toHaveLength(3);
    // Delta is first→last
    expect(result.deltas.meanShift).toBeCloseTo(-2);
    expect(result.deltas.variationRatio).toBeCloseTo(0.5); // 3/6
    expect(result.deltas.cpkDelta).toBeCloseTo(0.7);
  });

  it('handles missing specs (cpk/passRate null)', () => {
    const before = makeStats({ mean: 50, stdDev: 5 }); // no cpk
    const after = makeStats({ mean: 48, stdDev: 3 }); // no cpk

    const staged: StagedStatsResult = {
      stages: new Map([
        ['Before', before],
        ['After', after],
      ]),
      stageOrder: ['Before', 'After'],
      overallStats: makeStats(),
    };

    const result = calculateStagedComparison(staged)!;
    expect(result.deltas.cpkDelta).toBeNull();
    expect(result.colorCoding.cpkDelta).toBe('amber');
  });

  it('returns amber coding for no meaningful change', () => {
    const s1 = makeStats({ mean: 50, stdDev: 5, cpk: 1.0, outOfSpecPercentage: 3 });
    const s2 = makeStats({ mean: 50.01, stdDev: 5.01, cpk: 1.001, outOfSpecPercentage: 2.99 });

    const staged: StagedStatsResult = {
      stages: new Map([
        ['Before', s1],
        ['After', s2],
      ]),
      stageOrder: ['Before', 'After'],
      overallStats: makeStats(),
    };

    const result = calculateStagedComparison(staged)!;
    expect(result.colorCoding.cpkDelta).toBe('amber');
    expect(result.colorCoding.variationRatio).toBe('amber');
  });

  it('returns null when stageOrder has entries but stages map is empty', () => {
    const staged: StagedStatsResult = {
      stages: new Map(),
      stageOrder: ['A', 'B'],
      overallStats: makeStats(),
    };
    expect(calculateStagedComparison(staged)).toBeNull();
  });

  it('detects regression (red coding)', () => {
    const before = makeStats({ mean: 50, stdDev: 3, cpk: 1.4, outOfSpecPercentage: 1 });
    const after = makeStats({ mean: 55, stdDev: 6, cpk: 0.8, outOfSpecPercentage: 15 });

    const staged: StagedStatsResult = {
      stages: new Map([
        ['Before', before],
        ['After', after],
      ]),
      stageOrder: ['Before', 'After'],
      overallStats: makeStats(),
    };

    const result = calculateStagedComparison(staged)!;
    expect(result.deltas.cpkDelta).toBeCloseTo(-0.6);
    expect(result.colorCoding.cpkDelta).toBe('red');
    expect(result.colorCoding.variationRatio).toBe('red');
    expect(result.colorCoding.passRateDelta).toBe('red');
  });
});
