import { describe, it, expect } from 'vitest';
import { buildStagedComparisonInsight } from '../ai/chartInsights';
import type { StagedComparison } from '../stats/staged';
import type { StatsResult } from '../types';

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

function makeComparison(
  deltas: StagedComparison['deltas'],
  colorCoding?: StagedComparison['colorCoding']
): StagedComparison {
  return {
    stages: [
      { name: 'Before', stats: makeStats(), index: 0 },
      { name: 'After', stats: makeStats(), index: 1 },
    ],
    deltas,
    colorCoding: colorCoding ?? {
      meanShift: 'amber',
      variationRatio: 'amber',
      cpkDelta: 'amber',
      passRateDelta: 'amber',
      outOfSpecReduction: 'amber',
    },
  };
}

describe('buildStagedComparisonInsight', () => {
  it('returns improvement insight when Cpk improves significantly', () => {
    const comparison = makeComparison({
      meanShift: -2,
      variationRatio: 0.7,
      cpkDelta: 0.43,
      passRateDelta: 10,
      outOfSpecReduction: 10,
    });

    const result = buildStagedComparisonInsight(comparison);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Improvement');
    expect(result!.text).toContain('Cpk +0.43');
    expect(result!.priority).toBe(3); // Cpk > 0.2
    expect(result!.chipType).toBe('info');
  });

  it('returns regression insight when Cpk degrades', () => {
    const comparison = makeComparison({
      meanShift: 5,
      variationRatio: 1.5,
      cpkDelta: -0.6,
      passRateDelta: -14,
      outOfSpecReduction: -14,
    });

    const result = buildStagedComparisonInsight(comparison);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Regression');
    expect(result!.chipType).toBe('warning');
    expect(result!.priority).toBe(1);
  });

  it('returns null when no meaningful changes', () => {
    const comparison = makeComparison({
      meanShift: 0.01,
      variationRatio: 1.001,
      cpkDelta: null,
      passRateDelta: null,
      outOfSpecReduction: 0,
    });

    const result = buildStagedComparisonInsight(comparison);
    expect(result).toBeNull();
  });

  it('includes variation percentage when > 5%', () => {
    const comparison = makeComparison({
      meanShift: 0,
      variationRatio: 0.68,
      cpkDelta: null,
      passRateDelta: null,
      outOfSpecReduction: 0,
    });

    const result = buildStagedComparisonInsight(comparison);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('variation -32%');
  });

  it('includes out-of-spec reduction', () => {
    const comparison = makeComparison({
      meanShift: 0,
      variationRatio: 1,
      cpkDelta: null,
      passRateDelta: null,
      outOfSpecReduction: 8.5,
    });

    const result = buildStagedComparisonInsight(comparison);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('8.5% fewer out-of-spec');
  });
});
