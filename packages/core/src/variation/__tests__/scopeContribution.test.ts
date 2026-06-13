import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../__tests__/helpers/stressDataGenerator';
import {
  computeScopeWhatIfProjection,
  computeConditionCoverage,
  computeScopeProblemStats,
} from '../scopeContribution';
import { calculateStats } from '../../stats/basic';
import { simulateOverallImpact } from '../simulation';
import type { ConditionLeaf } from '../../findings/hypothesisCondition';
import type { DataRow } from '../../types';

/**
 * IM-5 scope-level helpers (ADR-088 #3/#4).
 *
 * computeScopeWhatIfProjection — reuses computeCumulativeProjection (the What-If
 *   engine, a simulation) for one drilled {factor=level} condition → projected Cpk.
 * computeConditionCoverage — descriptive prevalence % of rows matching the AND
 *   of leaves. NOT exploration coverage, NOT a multiplied-η² chain.
 *
 * Deterministic fixtures only — seeded PRNG, never Math.random / wall-clock.
 */

// ---------------------------------------------------------------------------
// Deterministic fixture: two machines, one clearly worse than the other.
// Machine A runs hot (mean ~12, out of an USL=13), Machine B is centred (~10).
// ---------------------------------------------------------------------------
function makeFixture(): DataRow[] {
  const rng = mulberry32(42);
  const rows: DataRow[] = [];
  // gaussian-ish via averaging two uniforms (Irwin-Hall n=2) — deterministic
  const noise = (scale: number): number => (rng() + rng() - 1) * scale;
  for (let i = 0; i < 60; i++) {
    rows.push({ Machine: 'A', Value: 12.2 + noise(0.6) });
  }
  for (let i = 0; i < 60; i++) {
    rows.push({ Machine: 'B', Value: 10.0 + noise(0.6) });
  }
  return rows;
}

const SPECS = { lsl: 8, usl: 13 };

describe('computeScopeWhatIfProjection', () => {
  it('returns a higher projected Cpk when fixing the worse machine condition', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const projectedCpk = computeScopeWhatIfProjection(predicates, data, 'Value', SPECS);
    expect(projectedCpk).not.toBeNull();
    // Reuses computeCumulativeProjection — the projected overall Cpk after the fix.
    expect(typeof projectedCpk).toBe('number');
    expect(projectedCpk as number).toBeGreaterThan(0);
  });

  it('agrees with simulateOverallImpact for a pure eq condition', () => {
    // Reference: manually partition by Machine=A, then call simulateOverallImpact
    // directly. computeScopeWhatIfProjection must produce the same projectedCpk.
    const data = makeFixture();
    const subsetValues = data.filter(r => r['Machine'] === 'A').map(r => r['Value'] as number);
    const compValues = data.filter(r => r['Machine'] !== 'A').map(r => r['Value'] as number);
    const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
    const variance = (v: number[], m: number) => v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length;
    const subMean = mean(subsetValues);
    const compMean = mean(compValues);
    const subStdDev = Math.sqrt(variance(subsetValues, subMean));
    const compStdDev = Math.sqrt(variance(compValues, compMean));
    const impact = simulateOverallImpact(
      { mean: subMean, stdDev: subStdDev, count: subsetValues.length },
      { mean: compMean, stdDev: compStdDev, count: compValues.length },
      { mean: compMean, stdDev: compStdDev },
      SPECS
    );
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const projectedCpk = computeScopeWhatIfProjection(predicates, data, 'Value', SPECS);
    expect(projectedCpk).not.toBeNull();
    expect(projectedCpk).toBeCloseTo(impact.projectedOverall.cpk!, 10);
  });

  it('maps a multi-value `in` leaf: whole-dataset match → null (no complement)', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'in', value: ['A', 'B'] },
    ];
    // 'in' [A, B] matches every row → complement is empty → null (no fix possible).
    const projectedCpk = computeScopeWhatIfProjection(predicates, data, 'Value', SPECS);
    expect(projectedCpk).toBeNull();
  });

  it('returns null when no specs are provided', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    expect(computeScopeWhatIfProjection(predicates, data, 'Value', undefined)).toBeNull();
  });

  it('returns null for an empty predicate list (no condition to fix)', () => {
    const data = makeFixture();
    expect(computeScopeWhatIfProjection([], data, 'Value', SPECS)).toBeNull();
  });

  it('returns null when the data is too small for a meaningful projection', () => {
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    expect(
      computeScopeWhatIfProjection(predicates, [{ Machine: 'A', Value: 12 }], 'Value', SPECS)
    ).toBeNull();
  });

  // -----------------------------------------------------------------------
  // REGRESSION: gte/between leaves must narrow the subset, NOT be silently
  // dropped. Previously leavesToActiveFilters discarded comparison ops, so
  // mixed conditions overstated both projection and coverage.
  // -----------------------------------------------------------------------

  it('mixed condition [Machine eq A AND Value gte 12.0]: projection differs from eq-only', () => {
    // Fixture: Machine-A rows span ~11.65–12.73. Threshold 12.0 cuts ~13/60 rows,
    // so the mixed subset is smaller and hotter than the eq-only subset.
    const data = makeFixture();
    // eq-only projection (Machine=A, all values)
    const eqOnly: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const projEqOnly = computeScopeWhatIfProjection(eqOnly, data, 'Value', SPECS);

    // Mixed: Machine=A AND Value >= 12.0 (only the hotter Machine-A rows)
    const mixed: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
      { kind: 'leaf', column: 'Value', op: 'gte', value: 12.0 },
    ];
    const projMixed = computeScopeWhatIfProjection(mixed, data, 'Value', SPECS);

    // Both must be non-null (there IS a subset and a complement in each case)
    expect(projEqOnly).not.toBeNull();
    expect(projMixed).not.toBeNull();

    // The gte leaf genuinely narrows the subset, so the projections must differ.
    // (If gte were silently dropped, projMixed would equal projEqOnly.)
    expect(projMixed).not.toBeCloseTo(projEqOnly!, 4);
  });

  it('zero-match condition returns null (no fix possible)', () => {
    const data = makeFixture();
    // Value >= 999 matches nothing in [9..13] fixture.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Value', op: 'gte', value: 999 }];
    expect(computeScopeWhatIfProjection(predicates, data, 'Value', SPECS)).toBeNull();
  });

  it('whole-dataset-match condition returns null (no complement)', () => {
    const data = makeFixture();
    // Value >= -999 matches every row → complement empty → null.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Value', op: 'gte', value: -999 }];
    expect(computeScopeWhatIfProjection(predicates, data, 'Value', SPECS)).toBeNull();
  });

  it('a lone gte leaf on the outcome column produces a non-null projection (not dropped)', () => {
    const data = makeFixture();
    // Value >= 11 selects ~Machine-A rows only (their mean is ~12.2). This should
    // produce a meaningful projection, not null.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Value', op: 'gte', value: 11 }];
    expect(computeScopeWhatIfProjection(predicates, data, 'Value', SPECS)).not.toBeNull();
  });
});

describe('computeConditionCoverage', () => {
  it('returns 0 when no rows match the condition', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'Z' }];
    expect(computeConditionCoverage(predicates, data)).toBe(0);
  });

  it('returns the partial prevalence % for a single-machine condition', () => {
    const data = makeFixture(); // 60 A + 60 B = 120 rows
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    expect(computeConditionCoverage(predicates, data)).toBeCloseTo(50, 6);
  });

  it('returns 100 when every row matches', () => {
    const data: DataRow[] = [
      { Machine: 'A', Value: 1 },
      { Machine: 'A', Value: 2 },
    ];
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    expect(computeConditionCoverage(predicates, data)).toBe(100);
  });

  it('ANDs multiple leaves (intersection prevalence)', () => {
    const data: DataRow[] = [
      { Machine: 'A', Shift: 'Night', Value: 1 },
      { Machine: 'A', Shift: 'Day', Value: 2 },
      { Machine: 'B', Shift: 'Night', Value: 3 },
      { Machine: 'B', Shift: 'Day', Value: 4 },
    ];
    const predicates: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
    ];
    // Only 1 of 4 rows satisfies both → 25%.
    expect(computeConditionCoverage(predicates, data)).toBe(25);
  });

  it('matches multi-value `in` leaves as membership', () => {
    const data: DataRow[] = [
      { Machine: 'A', Value: 1 },
      { Machine: 'B', Value: 2 },
      { Machine: 'C', Value: 3 },
      { Machine: 'D', Value: 4 },
    ];
    const predicates: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'in', value: ['A', 'B'] },
    ];
    expect(computeConditionCoverage(predicates, data)).toBe(50);
  });

  it('returns 0 for an empty dataset (no division by zero)', () => {
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    expect(computeConditionCoverage(predicates, [])).toBe(0);
  });

  it('returns 0 for an empty predicate list', () => {
    const data = makeFixture();
    expect(computeConditionCoverage([], data)).toBe(0);
  });

  // -----------------------------------------------------------------------
  // REGRESSION: comparison ops must be honoured (not silently dropped).
  // -----------------------------------------------------------------------

  it('gte leaf correctly counts rows above the threshold', () => {
    const data: DataRow[] = [{ Temp: 75 }, { Temp: 80 }, { Temp: 85 }, { Temp: 90 }];
    // Temp >= 80 → 3 of 4 rows
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Temp', op: 'gte', value: 80 }];
    expect(computeConditionCoverage(predicates, data)).toBeCloseTo(75, 6);
  });

  it('between leaf counts only rows in [lo, hi] inclusive', () => {
    const data: DataRow[] = [{ Temp: 75 }, { Temp: 80 }, { Temp: 85 }, { Temp: 90 }];
    // Temp between [80, 85] → rows 80 and 85 → 2/4 = 50%
    const predicates: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Temp', op: 'between', value: [80, 85] },
    ];
    expect(computeConditionCoverage(predicates, data)).toBeCloseTo(50, 6);
  });

  it('mixed [eq AND gte] condition narrows coverage vs eq-only', () => {
    const data = makeFixture(); // 60 A + 60 B rows; Machine-A Values ~12.2
    // eq-only: Machine=A → 50%
    const eqOnly: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const coverageEqOnly = computeConditionCoverage(eqOnly, data);
    expect(coverageEqOnly).toBeCloseTo(50, 1);

    // Mixed: Machine=A AND Value >= 12.0 → fewer rows (~47/120) → coverage < 50%
    const mixed: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
      { kind: 'leaf', column: 'Value', op: 'gte', value: 12.0 },
    ];
    const coverageMixed = computeConditionCoverage(mixed, data);
    expect(coverageMixed).toBeLessThan(coverageEqOnly);
    expect(coverageMixed).toBeGreaterThan(0);
  });
});

describe('computeScopeProblemStats', () => {
  // The Wall problem card's OBSERVED Cpk + out-of-spec count must be computed over
  // EXACTLY the subset the card represents — `rawData` ∩ predicates — NOT the full
  // series. This is the PR-2 (#398) honesty fix: condition/range drills write
  // conditionLeaves only (NOT projectStore.filters), so a stats source that reads
  // filters stays full-series and reports the WRONG (wider) Cpk for the displayed
  // condition. These tests would FAIL against the old useAnalysisStats-over-
  // filteredData implementation, which ignored the condition predicate entirely.

  it('computes Cpk over the conditioned subset, NOT the full series (the bug)', () => {
    const data = makeFixture(); // 60 Machine-A (~12.2, near USL=13) + 60 Machine-B (~10.0)
    // Full-series Cpk (what the buggy full-series path returns):
    const fullValues = data.map(r => r['Value'] as number);
    const fullCpk = calculateStats(fullValues, SPECS.usl, SPECS.lsl).cpk;
    // Conditioned (Machine=A) Cpk computed by hand:
    const aValues = data.filter(r => r['Machine'] === 'A').map(r => r['Value'] as number);
    const aCpk = calculateStats(aValues, SPECS.usl, SPECS.lsl).cpk;

    // The two MUST differ (A runs hot near USL) — otherwise the test proves nothing.
    expect(fullCpk).toBeDefined();
    expect(aCpk).toBeDefined();
    expect(aCpk).not.toBeCloseTo(fullCpk!, 3);

    // The helper, given the Machine=A predicate, must return A's Cpk — the
    // conditioned subset — never the full-series Cpk.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const result = computeScopeProblemStats(predicates, data, 'Value', SPECS);
    expect(result.cpk).toBeCloseTo(aCpk!, 10);
    expect(result.cpk).not.toBeCloseTo(fullCpk!, 3);
    expect(result.n).toBe(60);
  });

  it('honours range/between predicates (the divergent condition/range-drill path)', () => {
    const data = makeFixture();
    // A pure RANGE drill — the path that writes conditionLeaves only, never filters.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Value', op: 'gte', value: 12.0 }];
    const subsetValues = data.map(r => r['Value'] as number).filter(v => v >= 12.0);
    const expected = calculateStats(subsetValues, SPECS.usl, SPECS.lsl);
    const result = computeScopeProblemStats(predicates, data, 'Value', SPECS);
    expect(result.n).toBe(subsetValues.length);
    expect(result.cpk).toBeCloseTo(expected.cpk!, 10);
    // out-of-spec count = rounded outOfSpec% × n, over the SAME subset.
    expect(result.events).toBe(
      Math.round((expected.outOfSpecPercentage / 100) * subsetValues.length)
    );
  });

  it('empty predicates → the full series (no active scope)', () => {
    const data = makeFixture();
    const fullValues = data.map(r => r['Value'] as number);
    const full = calculateStats(fullValues, SPECS.usl, SPECS.lsl);
    const result = computeScopeProblemStats([], data, 'Value', SPECS);
    expect(result.n).toBe(120);
    expect(result.cpk).toBeCloseTo(full.cpk!, 10);
  });

  it('cpk is undefined when no spec limits are set (the no-specs honesty case)', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const result = computeScopeProblemStats(predicates, data, 'Value', undefined);
    expect(result.cpk).toBeUndefined();
    expect(result.events).toBe(0);
    expect(result.n).toBe(60); // still computed the subset; just no Cpk/events
  });

  it('empty subset (no match) → cpk undefined, events 0, n 0', () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'Z' }];
    const result = computeScopeProblemStats(predicates, data, 'Value', SPECS);
    expect(result.cpk).toBeUndefined();
    expect(result.events).toBe(0);
    expect(result.n).toBe(0);
  });

  it('counts out-of-spec events over the conditioned subset only', () => {
    // 3 in-spec, 2 above USL within Machine=A; Machine=B all in-spec.
    const data: DataRow[] = [
      { Machine: 'A', Value: 10 },
      { Machine: 'A', Value: 11 },
      { Machine: 'A', Value: 12 },
      { Machine: 'A', Value: 20 }, // > USL
      { Machine: 'A', Value: 21 }, // > USL
      { Machine: 'B', Value: 30 }, // > USL but NOT in the condition
    ];
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const result = computeScopeProblemStats(predicates, data, 'Value', { usl: 13, lsl: 0 });
    expect(result.n).toBe(5);
    expect(result.events).toBe(2); // only the 2 Machine-A overshoots, not Machine-B's
  });
});
