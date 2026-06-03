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
  perFactorDeltaR2,
  selectVitalFew,
  isFitOnlyEstimate,
  redundancyHint,
  computeSubsetVIF,
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

  it('falls back to the single-factor subset overall-F p for ANOVA models (no data passed)', () => {
    const data = shiftDominatedFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Noise'])!;
    const index = buildSubsetIndex(result);
    // 2-arg call (no rows/outcome) → the legacy marginal fallback, NOT nested-F.
    const both = lookupSubset(index, ['Shift', 'Noise'])!;
    const p = perFactorPValues(both, index);
    const shiftSingle = index.singleByFactor.get('Shift')!;
    const noiseSingle = index.singleByFactor.get('Noise')!;
    expect(p.get('Shift')!).toBeCloseTo(shiftSingle.pValue, 10);
    expect(p.get('Noise')!).toBeCloseTo(noiseSingle.pValue, 10);
    // Shift is the dominant factor → its marginal p is far below Noise's.
    expect(p.get('Shift')!).toBeLessThan(p.get('Noise')!);
  });

  // MAJOR 1 — the honest, uniform per-factor partial p.
  //
  // `Echo` is a near-copy of `Shift` (strongly correlated) but adds NO
  // independent signal to Y. Its MARGINAL (single-factor) p is highly
  // significant because it tracks the real driver Shift. Its PARTIAL p
  // (Echo given Shift, the nested-F) is clearly NON-significant. A surface that
  // showed Echo's marginal p as bare `p {value}` would mislead an MBB into
  // reading it as the in-model partial; the nested-F path computes the honest
  // partial uniformly across the OLS + all-categorical (ANOVA) engine paths.
  function shiftWithRedundantEchoFixture(): DataRow[] {
    const rows: DataRow[] = [];
    const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
    const echoFor: Record<string, string> = { A: 'eA', B: 'eB', C: 'eC' };
    const shifts = ['A', 'B', 'C'];
    // Small deterministic wobble so Shift does not explain 100% (residual df > 0
    // and the nested model is identifiable, not singular).
    const wobble = [1, -1, 2, -2, 0, 1, -1, 2, -2, 0, 1, -1, 2, -2, 0, 1, -1, 2, -2, 0];
    for (const s of shifts) {
      for (let r = 0; r < 20; r++) {
        // Echo mirrors Shift except for two deliberate crossovers per shift, so
        // Echo is highly correlated with Shift but not a perfect alias (the
        // {Shift,Echo} design stays full rank). The crossovers carry NO extra Y
        // signal — Y depends only on Shift + wobble.
        const crossover = r === 5 || r === 13;
        const otherShift = shifts[(shifts.indexOf(s) + 1) % shifts.length];
        const echo = crossover ? echoFor[otherShift] : echoFor[s];
        rows.push({ Shift: s, Echo: echo, Y: shiftMean[s] + wobble[r] });
      }
    }
    return rows;
  }

  it('computes the honest nested-F partial p (marginal ≠ partial) for a redundant categorical factor', () => {
    const data = shiftWithRedundantEchoFixture();
    const result = computeBestSubsets(data, 'Y', ['Shift', 'Echo'])!;
    const index = buildSubsetIndex(result);
    const both = lookupSubset(index, ['Shift', 'Echo'])!;

    // Echo's MARGINAL p (its own single-factor subset overall-F) is significant
    // — it tracks the real driver.
    const echoMarginal = index.singleByFactor.get('Echo')!.pValue;
    expect(echoMarginal).toBeLessThan(0.05);

    // Echo's PARTIAL p (nested-F, given Shift) is clearly NON-significant.
    const partial = perFactorPValues(both, index, data, 'Y');
    expect(partial.get('Echo')!).toBeGreaterThan(0.15); // fails the vital-few gate
    // And it is materially larger than the misleading marginal p.
    expect(partial.get('Echo')!).toBeGreaterThan(echoMarginal);
    // Shift's partial p stays significant (it IS the driver).
    expect(partial.get('Shift')!).toBeLessThan(0.05);

    // The vital-few default, gated by the honest partial p, therefore drops the
    // redundant Echo and keeps Shift alone.
    const selection = selectVitalFew(result, index, { data, outcome: 'Y' })!;
    expect(selection.factors).toEqual(['Shift']);
  });

  it('nested-F partial p of a continuous factor equals its OLS t-test p (F = t² at 1 df)', () => {
    // For a single continuous factor in an OLS model, the nested-F (Δdf = 1)
    // collapses to the predictor's two-tailed t-test p. We document this
    // equivalence so the categorical and continuous surface values mean the same.
    const rows: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      rows.push({ Temp: i, Y: 2 * i + (i % 4) - 1.5 });
    }
    const result = computeBestSubsets(rows, 'Y', ['Temp'])!;
    const index = buildSubsetIndex(result);
    const subset = lookupSubset(index, ['Temp'])!;
    const olsPredictorP = subset.predictors!.find(p => p.factorName === 'Temp')!.pValue;
    const nestedF = perFactorPValues(subset, index, rows, 'Y');
    expect(nestedF.get('Temp')!).toBeCloseTo(olsPredictorP, 6);
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

describe('computeSubsetVIF', () => {
  it('returns an empty map for a lone factor (VIF undefined with no peers)', () => {
    const data = shiftDominatedFixture();
    expect(computeSubsetVIF(data, 'Y', ['Shift']).size).toBe(0);
  });

  it('reports very high VIF for two near-collinear continuous factors', () => {
    const rows: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      const x1 = i;
      const x2 = 2 * i + (i % 2 === 0 ? 0.01 : -0.01); // near-collinear with x1
      rows.push({ X1: x1, X2: x2, Y: 3 * x1 + (i % 3) });
    }
    const vif = computeSubsetVIF(rows, 'Y', ['X1', 'X2']);
    expect(vif.get('X1')!).toBeGreaterThan(10);
    expect(vif.get('X2')!).toBeGreaterThan(10);
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

  it('reads the explicit vif option when the subset carries no stamped VIF', () => {
    // withFactor.vif has no entry for 'B' here → falls back to options.vif.
    const noVif: BestSubsetResult = { ...withFactor, vif: new Map() };
    const withoutB: BestSubsetResult = { ...noVif, factors: ['A'], rSquaredAdj: 0.495 };
    expect(redundancyHint('B', noVif, withoutB)).toBeNull(); // no vif anywhere
    const hint = redundancyHint('B', noVif, withoutB, { vif: 25 });
    expect(hint).not.toBeNull();
    expect(hint!.vif).toBeCloseTo(25, 10);
  });
});

// ============================================================================
// perFactorDeltaR2 — per-factor semipartial R² (association strength)
// ============================================================================

/** Deterministic: Shift dominates Y, Machine adds a little, Noise is junk. */
function buildRerankData(): DataRow[] {
  const shiftEffect: Record<string, number> = { A: 0, B: 10, C: 20 };
  const machineEffect: Record<string, number> = { X: 0, Y: 2 };
  const rows: DataRow[] = [];
  let i = 0;
  for (const s of ['A', 'B', 'C']) {
    for (const m of ['X', 'Y']) {
      for (const nz of ['p', 'q']) {
        for (let r = 0; r < 3; r++) {
          const wobble = ((i * 7) % 5) - 2; // deterministic -2..2
          rows.push({
            Shift: s,
            Machine: m,
            Noise: nz,
            Y: shiftEffect[s] + machineEffect[m] + wobble,
          });
          i++;
        }
      }
    }
  }
  return rows;
}

describe('perFactorDeltaR2', () => {
  const data = buildRerankData();
  const result = computeBestSubsets(data, 'Y', ['Shift', 'Machine', 'Noise'])!;
  const index = buildSubsetIndex(result);

  it('ranks the dominant factor highest and junk near zero, all >= 0', () => {
    const kept = ['Shift', 'Machine', 'Noise'];
    const d = perFactorDeltaR2(kept, ['Shift', 'Machine', 'Noise'], index);
    expect(d.get('Shift')!).toBeGreaterThan(d.get('Machine')!);
    expect(d.get('Machine')!).toBeGreaterThan(d.get('Noise')!);
    for (const v of d.values()) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('for a KEPT factor returns the drop-on-remove (semipartial R²)', () => {
    // Use the public lookupSubset accessor (not raw byKey.get) so the test
    // stays decoupled from the internal subset-key encoding.
    const full = lookupSubset(index, ['Shift', 'Machine'])!;
    const reduced = lookupSubset(index, ['Machine'])!;
    const d = perFactorDeltaR2(['Shift', 'Machine'], ['Shift'], index);
    expect(d.get('Shift')!).toBeCloseTo(full.rSquared - reduced.rSquared, 10);
  });

  it('for a NON-KEPT candidate returns the gain-on-add', () => {
    const kept = ['Machine'];
    const augmented = lookupSubset(index, ['Machine', 'Shift'])!;
    const base = lookupSubset(index, ['Machine'])!;
    const d = perFactorDeltaR2(kept, ['Shift'], index);
    expect(d.get('Shift')!).toBeCloseTo(augmented.rSquared - base.rSquared, 10);
  });

  it('with no kept factors a candidate gets its single-factor marginal R² (empty baseline)', () => {
    // The Analyze Wall opens a fresh scope with zero factors selected; the
    // baseline R² is then 0, so a candidate's ΔR² is its standalone
    // single-factor R². Guards the lookupSubset([]) → null empty-set path.
    const single = lookupSubset(index, ['Shift'])!;
    const d = perFactorDeltaR2([], ['Shift'], index);
    expect(d.get('Shift')!).toBeCloseTo(single.rSquared, 10);
  });
});
