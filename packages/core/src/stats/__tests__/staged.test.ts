import { describe, it, expect } from 'vitest';
import { toVerificationData } from '../staged';
import type { StagedComparison } from '../staged';
import type { StatsResult } from '../../types';

/** Build a minimal StatsResult for testing purposes */
function makeStats(overrides: Partial<StatsResult>): StatsResult {
  return {
    mean: 100,
    median: 100,
    stdDev: 1,
    sigmaWithin: 1,
    mrBar: 1.128,
    ucl: 103,
    lcl: 97,
    outOfSpecPercentage: 0,
    ...overrides,
  };
}

describe('toVerificationData', () => {
  it('converts staged comparison to verification data', () => {
    const comparison: StagedComparison = {
      stages: [
        {
          name: 'Before',
          stats: makeStats({ cpk: 0.62, outOfSpecPercentage: 28, mean: 100, stdDev: 2 }),
          index: 0,
        },
        {
          name: 'After',
          stats: makeStats({ cpk: 1.35, outOfSpecPercentage: 4, mean: 100.5, stdDev: 1.5 }),
          index: 1,
        },
      ],
      deltas: {
        meanShift: 0.5,
        variationRatio: 0.75,
        cpkDelta: 0.73,
        passRateDelta: 24,
        outOfSpecReduction: 24,
      },
      colorCoding: {
        meanShift: 'amber',
        variationRatio: 'green',
        cpkDelta: 'green',
        passRateDelta: 'green',
        outOfSpecReduction: 'green',
      },
    };

    const result = toVerificationData(comparison);
    expect(result).not.toBeNull();
    expect(result!.cpkBefore).toBe(0.62);
    expect(result!.cpkAfter).toBe(1.35);
    expect(result!.passRateBefore).toBe(72);
    expect(result!.passRateAfter).toBe(96);
    expect(result!.meanShift).toBe(0.5);
    expect(result!.sigmaRatio).toBe(0.75);
    expect(typeof result!.dataDate).toBe('string');
    expect(result!.dataDate).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
  });

  it('returns null when less than 2 stages', () => {
    const comparison: StagedComparison = {
      stages: [{ name: 'Only', stats: makeStats({ cpk: 1.0, outOfSpecPercentage: 0 }), index: 0 }],
      deltas: {
        meanShift: 0,
        variationRatio: 1,
        cpkDelta: null,
        passRateDelta: null,
        outOfSpecReduction: 0,
      },
      colorCoding: {
        meanShift: 'amber',
        variationRatio: 'amber',
        cpkDelta: 'amber',
        passRateDelta: 'amber',
        outOfSpecReduction: 'amber',
      },
    };
    expect(toVerificationData(comparison)).toBeNull();
  });

  it('returns null when cpk is undefined (no specs)', () => {
    const comparison: StagedComparison = {
      stages: [
        { name: 'Before', stats: makeStats({ mean: 100, outOfSpecPercentage: 0 }), index: 0 },
        { name: 'After', stats: makeStats({ mean: 101, outOfSpecPercentage: 0 }), index: 1 },
      ],
      deltas: {
        meanShift: 1,
        variationRatio: 1,
        cpkDelta: null,
        passRateDelta: null,
        outOfSpecReduction: 0,
      },
      colorCoding: {
        meanShift: 'amber',
        variationRatio: 'amber',
        cpkDelta: 'amber',
        passRateDelta: 'amber',
        outOfSpecReduction: 'amber',
      },
    };
    expect(toVerificationData(comparison)).toBeNull();
  });

  it('uses first and last stage when more than 2 stages exist', () => {
    const comparison: StagedComparison = {
      stages: [
        {
          name: 'Stage 1',
          stats: makeStats({ cpk: 0.5, outOfSpecPercentage: 40, mean: 98, stdDev: 3 }),
          index: 0,
        },
        {
          name: 'Stage 2',
          stats: makeStats({ cpk: 1.0, outOfSpecPercentage: 10, mean: 99, stdDev: 2 }),
          index: 1,
        },
        {
          name: 'Stage 3',
          stats: makeStats({ cpk: 1.5, outOfSpecPercentage: 2, mean: 100, stdDev: 1.5 }),
          index: 2,
        },
      ],
      deltas: {
        meanShift: 2,
        variationRatio: 0.5,
        cpkDelta: 1.0,
        passRateDelta: 38,
        outOfSpecReduction: 38,
      },
      colorCoding: {
        meanShift: 'green',
        variationRatio: 'green',
        cpkDelta: 'green',
        passRateDelta: 'green',
        outOfSpecReduction: 'green',
      },
    };

    const result = toVerificationData(comparison);
    expect(result).not.toBeNull();
    // Should use Stage 1 as before, Stage 3 as after
    expect(result!.cpkBefore).toBe(0.5);
    expect(result!.cpkAfter).toBe(1.5);
    expect(result!.passRateBefore).toBe(60);
    expect(result!.passRateAfter).toBe(98);
  });
});
