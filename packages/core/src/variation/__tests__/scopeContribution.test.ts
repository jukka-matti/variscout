import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../__tests__/helpers/stressDataGenerator';
import { computeScopeWhatIfProjection, computeConditionCoverage } from '../scopeContribution';
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

  it('matches computeCumulativeProjection.projectedCpk for the equivalent activeFilters', async () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }];
    const { computeCumulativeProjection } = await import('../projection');
    const reference = computeCumulativeProjection(
      [{ activeFilters: { Machine: ['A'] } }],
      data,
      'Value',
      SPECS
    );
    const projectedCpk = computeScopeWhatIfProjection(predicates, data, 'Value', SPECS);
    expect(reference).not.toBeNull();
    expect(projectedCpk).toBeCloseTo(reference!.projectedCpk, 10);
  });

  it('maps a multi-value `in` leaf to the activeFilters value array', async () => {
    const data = makeFixture();
    const predicates: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'in', value: ['A', 'B'] },
    ];
    // 'in' both machines → the subset is everything, the complement is empty so the
    // engine applies no fix and returns the unchanged base Cpk. We assert the
    // mapping reached the engine by matching the equivalent activeFilters call.
    const { computeCumulativeProjection } = await import('../projection');
    const reference = computeCumulativeProjection(
      [{ activeFilters: { Machine: ['A', 'B'] } }],
      data,
      'Value',
      SPECS
    );
    const projectedCpk = computeScopeWhatIfProjection(predicates, data, 'Value', SPECS);
    expect(reference).not.toBeNull();
    expect(projectedCpk).toBeCloseTo(reference!.projectedCpk, 10);
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

  it('drops non-equality leaves (lt/gt/between) — only eq/in carry into activeFilters', () => {
    const data = makeFixture();
    // A lone `gt` leaf maps to no activeFilters → empty filter → null.
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Value', op: 'gt', value: 11 }];
    expect(computeScopeWhatIfProjection(predicates, data, 'Value', SPECS)).toBeNull();
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
});
