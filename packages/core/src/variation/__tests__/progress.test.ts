import { describe, it, expect } from 'vitest';
import { computeImprovementProgress } from '../progress';
import { createFinding } from '../../findings';
import type { Finding, FindingProjection } from '../../findings';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  const base = createFinding('Test finding', {}, null);
  return { ...base, ...overrides };
}

function makeProjection(overrides: Partial<FindingProjection> = {}): FindingProjection {
  return {
    baselineMean: 18.3,
    baselineSigma: 4.2,
    projectedMean: 15.1,
    projectedSigma: 3.1,
    meanDelta: -3.2,
    sigmaDelta: -1.1,
    simulationParams: { meanAdjustment: -3.2, variationReduction: 26 },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeImprovementProgress', () => {
  const target = { metric: 'mean' as const, value: 12.0, direction: 'minimize' as const };
  const currentStats = { mean: 18.3, sigma: 4.2 };

  it('returns empty progress when no key-driver findings', () => {
    const result = computeImprovementProgress([], target, currentStats);
    expect(result.target.current).toBe(18.3);
    expect(result.target.gap).toBeCloseTo(6.3);
    expect(result.projectedImprovement.byFinding).toHaveLength(0);
    expect(result.projectedImprovement.percentCovered).toBe(0);
  });

  it('calculates progress from a single key-driver finding with projection', () => {
    const finding = makeFinding({
      tag: 'key-driver',
      projection: makeProjection(),
    });

    const result = computeImprovementProgress([finding], target, currentStats);
    expect(result.projectedImprovement.byFinding).toHaveLength(1);
    expect(result.projectedImprovement.byFinding[0].projected).toBeCloseTo(3.2);
    expect(result.projectedImprovement.percentCovered).toBeGreaterThan(0);
  });

  it('ignores findings without key-driver tag', () => {
    const finding = makeFinding({
      tag: 'low-impact',
      projection: makeProjection(),
    });

    const result = computeImprovementProgress([finding], target, currentStats);
    expect(result.projectedImprovement.byFinding).toHaveLength(0);
  });

  it('ignores key-driver findings without projections', () => {
    const finding = makeFinding({ tag: 'key-driver' });

    const result = computeImprovementProgress([finding], target, currentStats);
    expect(result.projectedImprovement.byFinding).toHaveLength(0);
  });

  it('computes gap for maximize direction', () => {
    const maxTarget = { metric: 'cpk' as const, value: 1.33, direction: 'maximize' as const };
    const stats = { mean: 10, sigma: 2, cpk: 0.8 };

    const result = computeImprovementProgress([], maxTarget, stats);
    expect(result.target.gap).toBeCloseTo(0.53);
  });

  it('computes gap for target (bidirectional) direction', () => {
    const biTarget = { metric: 'mean' as const, value: 15.0, direction: 'target' as const };
    const stats = { mean: 18.0, sigma: 2 };

    const result = computeImprovementProgress([], biTarget, stats);
    expect(result.target.gap).toBeCloseTo(3.0);
  });

  it('handles zero gap gracefully', () => {
    const zeroTarget = { metric: 'mean' as const, value: 18.3, direction: 'minimize' as const };
    const result = computeImprovementProgress([], zeroTarget, currentStats);
    expect(result.target.gap).toBe(0);
    expect(result.projectedImprovement.percentCovered).toBe(0);
  });

  it('tracks verified improvements from resolved findings with outcomes', () => {
    const finding = makeFinding({
      tag: 'key-driver',
      status: 'resolved',
      projection: makeProjection({
        baselineCpk: 0.8,
        projectedCpk: 1.2,
      }),
      outcome: { effective: 'yes', cpkAfter: 1.3, verifiedAt: Date.now() },
    });

    const cpkTarget = { metric: 'cpk' as const, value: 1.33, direction: 'maximize' as const };
    const stats = { mean: 10, sigma: 2, cpk: 0.8 };

    const result = computeImprovementProgress([finding], cpkTarget, stats);
    expect(result.verifiedImprovement.total).toBeGreaterThan(0);
    expect(result.projectedImprovement.byFinding[0].actual).toBeDefined();
  });

  it('orders findings by largest improvement first', () => {
    const small = makeFinding({
      id: 'small',
      tag: 'key-driver',
      projection: makeProjection({ baselineMean: 18.3, projectedMean: 17.0, meanDelta: -1.3 }),
    });
    const large = makeFinding({
      id: 'large',
      tag: 'key-driver',
      projection: makeProjection({ baselineMean: 18.3, projectedMean: 14.0, meanDelta: -4.3 }),
    });

    const result = computeImprovementProgress([small, large], target, currentStats);
    expect(result.projectedImprovement.byFinding[0].findingId).toBe('large');
    expect(result.projectedImprovement.byFinding[1].findingId).toBe('small');
  });
});
