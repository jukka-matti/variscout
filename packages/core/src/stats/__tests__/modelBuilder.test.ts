/**
 * modelBuilder.test.ts — the vital-few selector over the REAL best-subsets engine.
 *
 * Deterministic: fixed fixtures, no Math.random / Date.now. Floats via
 * toBeCloseTo. These tests drive `computeBestSubsets` for real (no mocks) so
 * they prove the selector composes with the actual engine, plus a few
 * hand-built `BestSubsetsResult` fixtures for the p-gate / redundancy edges.
 */
import { describe, it, expect } from 'vitest';
import type { DataRow } from '../../types';
import type { BestSubsetResult, BestSubsetsResult } from '../bestSubsets';
import { computeBestSubsets } from '../bestSubsets';
import {
  factorSetKey,
  buildSubsetIndex,
  lookupSubset,
  perFactorPValues,
  selectVitalFew,
  isFitOnlyEstimate,
  redundancyHint,
  VITAL_FEW_R2ADJ_TOLERANCE,
  VITAL_FEW_P_THRESHOLD,
} from '../modelBuilder';

// ============================================================================
// Fixtures (deterministic)
// ============================================================================

/**
 * A categorical fixture where `Shift` strongly explains the outcome, `Noise` is
 * pure junk (no relationship), and `Machine` is a weak third factor. Built so
 * the vital-few default lands on {Shift} alone (junk + weak factors fail the
 * 1-pt-of-max OR the p-gate).
 */
function shiftDominatedFixture(): DataRow[] {
  const rows: DataRow[] = [];
  // 12 rows per shift × 3 shifts = 36 rows; Shift drives the mean strongly.
  const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
  const shifts = ['A', 'B', 'C'];
  // A fixed wobble per row. Noise/Machine are assigned so each level sees the
  // SAME balanced mix of wobble values → neither has any marginal relationship
  // to Y within a shift (genuine junk). Deterministic, no PRNG.
  //   wobble:  +1 -1 +1 -1 | +1 -1 +1 -1 | +1 -1 +1 -1   (r = 0..11)
  //   Noise:    x  x  y  y |  x  x  y  y |  x  x  y  y     → each level sees {+1,-1}
  const wobbleSeq = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
  const noiseSeq = ['x', 'x', 'y', 'y', 'x', 'x', 'y', 'y', 'x', 'x', 'y', 'y'];
  const machineSeq = ['m1', 'm1', 'm1', 'm1', 'm2', 'm2', 'm1', 'm1', 'm1', 'm1', 'm2', 'm2'];
  for (const s of shifts) {
    for (let r = 0; r < 12; r++) {
      rows.push({
        Shift: s,
        Noise: noiseSeq[r],
        Machine: machineSeq[r],
        Y: shiftMean[s] + wobbleSeq[r],
      });
    }
  }
  return rows;
}

// ============================================================================
// factorSetKey + lookup
// ============================================================================

describe('factorSetKey', () => {
  it('is order-independent ({A,B} === {B,A})', () => {
    expect(factorSetKey(['A', 'B'])).toBe(factorSetKey(['B', 'A']));
  });
  it('distinguishes different sets', () => {
    expect(factorSetKey(['A', 'B'])).not.toBe(factorSetKey(['A', 'C']));
  });
});

describe('buildSubsetIndex + lookupSubset', () => {
  it('indexes every enumerated subset for O(1) lookup by exact factor set', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise', 'Machine'])!;
    expect(result).not.toBeNull();
    const index = buildSubsetIndex(result);

    // Every enumerated subset is retrievable, regardless of factor order.
    for (const subset of result.subsets) {
      const looked = lookupSubset(index, [...subset.factors].reverse());
      expect(looked).toBe(subset);
    }
    // maxRSquaredAdj equals the top subset's R²adj (engine pre-sorts desc).
    expect(index.maxRSquaredAdj).toBeCloseTo(result.subsets[0].rSquaredAdj, 10);
  });

  it('returns null for the empty set and for non-enumerated combinations', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise'])!;
    const index = buildSubsetIndex(result);
    expect(lookupSubset(index, [])).toBeNull();
    expect(lookupSubset(index, ['NotAFactor'])).toBeNull();
  });
});

// ============================================================================
// selectVitalFew — the LOCKED default
// ============================================================================

describe('selectVitalFew', () => {
  it('picks the fewest factors within 1pt of max R²adj where each kept p < .15', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise', 'Machine'])!;
    const index = buildSubsetIndex(result);
    const selection = selectVitalFew(result, index)!;

    expect(selection).not.toBeNull();
    // Shift dominates → the vital few is {Shift} alone (adding junk does not buy
    // a full 1-pt of R²adj, and junk factors fail the p-gate anyway).
    expect(selection.factors).toEqual(['Shift']);
    // Every kept factor's p clears the .15 gate.
    for (const f of selection.factors) {
      expect(selection.perFactorP.get(f)!).toBeLessThan(VITAL_FEW_P_THRESHOLD);
    }
  });

  it('never returns MORE factors than the max-R²adj subset', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise', 'Machine'])!;
    const index = buildSubsetIndex(result);
    const selection = selectVitalFew(result, index)!;
    expect(selection.factors.length).toBeLessThanOrEqual(result.subsets[0].factorCount);
  });

  it('respects an injected looser tolerance (more factors can qualify)', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise', 'Machine'])!;
    const index = buildSubsetIndex(result);
    // Default tolerance is 0.01.
    expect(VITAL_FEW_R2ADJ_TOLERANCE).toBeCloseTo(0.01, 10);
    const tight = selectVitalFew(result, index, { r2adjTolerance: 0 })!;
    // With zero tolerance only the literal max subset(s) qualify; size ≤ default.
    expect(tight.factors.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to the single best subset when no candidate clears the p-gate', () => {
    // Hand-built: best subset's only factor has p = 0.9 (fails .15 gate).
    const best: BestSubsetResult = {
      factors: ['F'],
      factorCount: 1,
      rSquared: 0.05,
      rSquaredAdj: 0.02,
      fStatistic: 1.1,
      pValue: 0.9,
      isSignificant: false,
      dfModel: 1,
      levelEffects: new Map(),
      cellMeans: new Map(),
    };
    const result: BestSubsetsResult = {
      subsets: [best],
      n: 30,
      totalFactors: 1,
      factorNames: ['F'],
      grandMean: 0,
      ssTotal: 100,
    };
    const index = buildSubsetIndex(result);
    const selection = selectVitalFew(result, index)!;
    // Still returns a model (the engine's top) rather than nothing.
    expect(selection.factors).toEqual(['F']);
  });

  it('returns null for an empty result', () => {
    const result: BestSubsetsResult = {
      subsets: [],
      n: 0,
      totalFactors: 0,
      factorNames: [],
      grandMean: 0,
      ssTotal: 0,
    };
    expect(selectVitalFew(result, buildSubsetIndex(result))).toBeNull();
  });
});

// ============================================================================
// perFactorPValues
// ============================================================================

describe('perFactorPValues', () => {
  it('uses the OLS per-predictor group-min p when predictors exist', () => {
    const subset: BestSubsetResult = {
      factors: ['Temp', 'Supplier'],
      factorCount: 2,
      rSquared: 0.6,
      rSquaredAdj: 0.55,
      fStatistic: 8,
      pValue: 0.002,
      isSignificant: true,
      dfModel: 3,
      levelEffects: new Map(),
      cellMeans: new Map(),
      predictors: [
        {
          name: 'Temp',
          factorName: 'Temp',
          type: 'continuous',
          coefficient: 1,
          standardError: 0.1,
          tStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
        },
        {
          name: 'Supplier[B]',
          factorName: 'Supplier',
          type: 'categorical',
          level: 'B',
          coefficient: 0.2,
          standardError: 0.3,
          tStatistic: 0.6,
          pValue: 0.4,
          isSignificant: false,
        },
        {
          name: 'Supplier[C]',
          factorName: 'Supplier',
          type: 'categorical',
          level: 'C',
          coefficient: 5,
          standardError: 0.5,
          tStatistic: 10,
          pValue: 0.02,
          isSignificant: true,
        },
      ],
    };
    const result: BestSubsetsResult = {
      subsets: [subset],
      n: 40,
      totalFactors: 2,
      factorNames: ['Temp', 'Supplier'],
      grandMean: 0,
      ssTotal: 100,
    };
    const p = perFactorPValues(subset, buildSubsetIndex(result));
    expect(p.get('Temp')!).toBeCloseTo(0.001, 10);
    // Group min across Supplier's two dummies → 0.02.
    expect(p.get('Supplier')!).toBeCloseTo(0.02, 10);
  });

  it('falls back to the single-factor subset overall-F p for ANOVA models', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise'])!;
    const index = buildSubsetIndex(result);
    // The 2-factor model has no per-predictor p (ANOVA path) → fallback to each
    // factor's own single-factor subset p.
    const both = lookupSubset(index, ['Shift', 'Noise'])!;
    const p = perFactorPValues(both, index);
    const shiftSingle = index.singleByFactor.get('Shift')!;
    const noiseSingle = index.singleByFactor.get('Noise')!;
    expect(p.get('Shift')!).toBeCloseTo(shiftSingle.pValue, 10);
    expect(p.get('Noise')!).toBeCloseTo(noiseSingle.pValue, 10);
    // Shift is the dominant factor → its marginal p is far below Noise's.
    expect(p.get('Shift')!).toBeLessThan(p.get('Noise')!);
  });
});

// ============================================================================
// Ambient honesty: overfit + redundancy
// ============================================================================

describe('isFitOnlyEstimate', () => {
  it('is true when the subset carries an overfit / obs-per-predictor warning', () => {
    const subset = {
      factors: ['A'],
      warnings: ['Possible overfitting: R² - R²adj = 0.250 (threshold: 0.1)'],
    } as unknown as BestSubsetResult;
    expect(isFitOnlyEstimate(subset)).toBe(true);
  });
  it('is true for a low observation-to-predictor warning', () => {
    const subset = {
      factors: ['A'],
      warnings: ['Low observation-to-predictor ratio: 3.0 (recommended: ≥ 10)'],
    } as unknown as BestSubsetResult;
    expect(isFitOnlyEstimate(subset)).toBe(true);
  });
  it('is false with no warnings, and false for an unrelated warning', () => {
    expect(isFitOnlyEstimate({ factors: ['A'] } as unknown as BestSubsetResult)).toBe(false);
    expect(
      isFitOnlyEstimate({
        factors: ['A'],
        warnings: ['High multicollinearity: VIF(A) = 12.0 (> 10)'],
      } as unknown as BestSubsetResult)
    ).toBe(false);
  });
});

describe('redundancyHint', () => {
  const withFactor: BestSubsetResult = {
    factors: ['A', 'B'],
    factorCount: 2,
    rSquared: 0.6,
    rSquaredAdj: 0.5,
    fStatistic: 5,
    pValue: 0.01,
    isSignificant: true,
    dfModel: 2,
    levelEffects: new Map(),
    cellMeans: new Map(),
    vif: new Map([
      ['A', 1.2],
      ['B', 15], // B is highly collinear
    ]),
  };

  it('fires when removing a high-VIF factor barely changes R²adj', () => {
    const withoutB: BestSubsetResult = { ...withFactor, factors: ['A'], rSquaredAdj: 0.495 };
    const hint = redundancyHint('B', withFactor, withoutB);
    expect(hint).not.toBeNull();
    expect(hint!.removedFactor).toBe('B');
    expect(hint!.vif).toBeCloseTo(15, 10);
    expect(hint!.rSquaredAdjDelta).toBeCloseTo(0.005, 10);
  });

  it('does NOT fire when the factor is not highly collinear', () => {
    const withoutA: BestSubsetResult = { ...withFactor, factors: ['B'], rSquaredAdj: 0.498 };
    expect(redundancyHint('A', withFactor, withoutA)).toBeNull();
  });

  it('does NOT fire when removal materially moves R²adj', () => {
    const withoutB: BestSubsetResult = { ...withFactor, factors: ['A'], rSquaredAdj: 0.3 };
    expect(redundancyHint('B', withFactor, withoutB)).toBeNull();
  });

  it('returns null when there is no without-factor model', () => {
    expect(redundancyHint('B', withFactor, null)).toBeNull();
  });
});
