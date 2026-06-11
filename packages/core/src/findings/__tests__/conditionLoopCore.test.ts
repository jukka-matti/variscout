/**
 * Tests for Task 1 of the ER-4 condition loop:
 *   - rowMatchesConditionLeaves (thin wrapper over the existing evaluator)
 *   - conditionLeavesToScopeState + buildConditionLeavesFromScopeState (round-trip)
 *   - buildBandLeaf + buildGroupLeaf (gesture builders)
 */
import { describe, it, expect } from 'vitest';
import type { ConditionLeaf } from '../hypothesisCondition';
import {
  rowMatchesConditionLeaves,
  conditionLeavesToScopeState,
  buildConditionLeavesFromScopeState,
  buildBandLeaf,
  buildGroupLeaf,
} from '../hypothesisCondition';
import { predicateSetKey } from '../hypothesisCondition';

// ---------------------------------------------------------------------------
// rowMatchesConditionLeaves — full op matrix
// ---------------------------------------------------------------------------

describe('rowMatchesConditionLeaves', () => {
  const row = {
    SHIFT: 'night',
    NOZZLE_TEMP: 130,
    SUPPLIER: 'B',
    LOT: 2,
  };

  // eq -----------------------------------------------------------------------
  it('eq string — true', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' }])
    ).toBe(true);
  });
  it('eq string — false', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'day' }])
    ).toBe(false);
  });
  it('eq number — true', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'eq', value: 130 },
      ])
    ).toBe(true);
  });
  it('eq number — false', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'NOZZLE_TEMP', op: 'eq', value: 99 }])
    ).toBe(false);
  });

  // neq ----------------------------------------------------------------------
  it('neq — true (different value)', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'SHIFT', op: 'neq', value: 'day' }])
    ).toBe(true);
  });
  it('neq — false (same value)', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'SHIFT', op: 'neq', value: 'night' }])
    ).toBe(false);
  });

  // in -----------------------------------------------------------------------
  it('in string array — true (member)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'SUPPLIER', op: 'in', value: ['A', 'B', 'C'] },
      ])
    ).toBe(true);
  });
  it('in string array — false (not a member)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'SUPPLIER', op: 'in', value: ['A', 'C'] },
      ])
    ).toBe(false);
  });
  it('in number array — true', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'LOT', op: 'in', value: [1, 2, 3] }])
    ).toBe(true);
  });
  it('in number array — false', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'LOT', op: 'in', value: [1, 3] }])
    ).toBe(false);
  });

  // gt / gte -----------------------------------------------------------------
  it('gt — true (strictly greater)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 },
      ])
    ).toBe(true);
  });
  it('gt — false (equal)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 130 },
      ])
    ).toBe(false);
  });
  it('gt — false (greater)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 140 },
      ])
    ).toBe(false);
  });
  it('gte — true (equal boundary)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gte', value: 130 },
      ])
    ).toBe(true);
  });
  it('gte — true (strictly greater)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gte', value: 120 },
      ])
    ).toBe(true);
  });
  it('gte — false (less than boundary)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gte', value: 131 },
      ])
    ).toBe(false);
  });

  // lt / lte -----------------------------------------------------------------
  it('lt — true (strictly less)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lt', value: 150 },
      ])
    ).toBe(true);
  });
  it('lt — false (equal)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lt', value: 130 },
      ])
    ).toBe(false);
  });
  it('lt — false (less than)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lt', value: 120 },
      ])
    ).toBe(false);
  });
  it('lte — true (equal boundary)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lte', value: 130 },
      ])
    ).toBe(true);
  });
  it('lte — true (strictly less)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lte', value: 150 },
      ])
    ).toBe(true);
  });
  it('lte — false (greater than boundary)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'lte', value: 129 },
      ])
    ).toBe(false);
  });

  // between ------------------------------------------------------------------
  it('between — true (both bounds inclusive, at lower bound)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'between', value: [130, 140] },
      ])
    ).toBe(true);
  });
  it('between — true (at upper bound)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'between', value: [120, 130] },
      ])
    ).toBe(true);
  });
  it('between — true (strictly inside)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'between', value: [120, 140] },
      ])
    ).toBe(true);
  });
  it('between — false (below range)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'between', value: [131, 200] },
      ])
    ).toBe(false);
  });
  it('between — false (above range)', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'between', value: [50, 129] },
      ])
    ).toBe(false);
  });

  // edge cases ---------------------------------------------------------------
  it('non-numeric cell vs comparison op → false', () => {
    // SHIFT is a string; gt against a number is meaningless → false
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'SHIFT', op: 'gt', value: 0 }])
    ).toBe(false);
  });
  it('non-numeric cell vs between → false', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'SHIFT', op: 'between', value: [0, 1] },
      ])
    ).toBe(false);
  });
  it('missing column → false for any op', () => {
    expect(
      rowMatchesConditionLeaves(row, [{ kind: 'leaf', column: 'MISSING', op: 'eq', value: 1 }])
    ).toBe(false);
  });
  it('undefined cell → false for any op', () => {
    const r: Record<string, unknown> = { X: undefined };
    expect(rowMatchesConditionLeaves(r, [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }])).toBe(
      false
    );
  });
  it('null cell → false for any op', () => {
    const r: Record<string, unknown> = { X: null };
    expect(rowMatchesConditionLeaves(r, [{ kind: 'leaf', column: 'X', op: 'eq', value: 1 }])).toBe(
      false
    );
  });

  // AND semantics over multiple leaves ----------------------------------------
  it('multi-leaf AND: both true → true', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 120 },
      ])
    ).toBe(true);
  });
  it('multi-leaf AND: one false → false', () => {
    expect(
      rowMatchesConditionLeaves(row, [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE_TEMP', op: 'gt', value: 200 },
      ])
    ).toBe(false);
  });
  it('empty leaves → true (vacuously; no predicate, full dataset)', () => {
    expect(rowMatchesConditionLeaves(row, [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// conditionLeavesToScopeState / buildConditionLeavesFromScopeState
// ---------------------------------------------------------------------------

describe('conditionLeavesToScopeState', () => {
  it('eq leaves → categoricalFilters only; rangeLeaves empty', () => {
    const leaves: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Line', op: 'eq', value: 'L1' },
    ];
    const result = conditionLeavesToScopeState(leaves);
    expect(result.categoricalFilters).toEqual({ Shift: ['Night'], Line: ['L1'] });
    expect(result.rangeLeaves).toEqual([]);
  });

  it('in leaves → categoricalFilters only', () => {
    const leaves: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Line', op: 'in', value: ['L1', 'L2'] },
    ];
    const result = conditionLeavesToScopeState(leaves);
    expect(result.categoricalFilters).toEqual({ Line: ['L1', 'L2'] });
    expect(result.rangeLeaves).toEqual([]);
  });

  it('range leaves (gt, lt, gte, lte, between) → rangeLeaves; categoricalFilters empty', () => {
    const leaves: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Temp', op: 'gt', value: 100 },
      { kind: 'leaf', column: 'Y', op: 'between', value: [10, 20] },
    ];
    const result = conditionLeavesToScopeState(leaves);
    expect(result.categoricalFilters).toEqual({});
    expect(result.rangeLeaves).toEqual(leaves);
  });

  it('neq leaves → rangeLeaves (not categorical membership)', () => {
    const leaves: ConditionLeaf[] = [{ kind: 'leaf', column: 'Shift', op: 'neq', value: 'day' }];
    const result = conditionLeavesToScopeState(leaves);
    expect(result.categoricalFilters).toEqual({});
    expect(result.rangeLeaves).toEqual(leaves);
  });

  it('mixed eq+range → split correctly', () => {
    const eq: ConditionLeaf = { kind: 'leaf', column: 'Machine', op: 'eq', value: 'M1' };
    const range: ConditionLeaf = { kind: 'leaf', column: 'Temp', op: 'gte', value: 80 };
    const result = conditionLeavesToScopeState([eq, range]);
    expect(result.categoricalFilters).toEqual({ Machine: ['M1'] });
    expect(result.rangeLeaves).toEqual([range]);
  });

  it('empty input → empty categoricalFilters and rangeLeaves', () => {
    const result = conditionLeavesToScopeState([]);
    expect(result.categoricalFilters).toEqual({});
    expect(result.rangeLeaves).toEqual([]);
  });

  it('multiple eq leaves for the same column → merged array', () => {
    const leaves: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Day' },
    ];
    const result = conditionLeavesToScopeState(leaves);
    expect(result.categoricalFilters).toEqual({ Shift: ['Night', 'Day'] });
  });

  it('in + eq for same column → merged without duplicates', () => {
    const leaves: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Shift', op: 'in', value: ['Night', 'Day'] },
    ];
    const result = conditionLeavesToScopeState(leaves);
    // Night deduped, Day added
    expect(result.categoricalFilters['Shift']).toContain('Night');
    expect(result.categoricalFilters['Shift']).toContain('Day');
    // Night should not appear twice
    expect(result.categoricalFilters['Shift']!.filter(v => v === 'Night').length).toBe(1);
  });
});

describe('buildConditionLeavesFromScopeState', () => {
  it('single-value categoricalFilter → eq leaf', () => {
    const result = buildConditionLeavesFromScopeState({ Shift: ['Night'] }, []);
    expect(result).toEqual([{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }]);
  });

  it('multi-value categoricalFilter → in leaf', () => {
    const result = buildConditionLeavesFromScopeState({ Line: ['L1', 'L2'] }, []);
    expect(result).toEqual([{ kind: 'leaf', column: 'Line', op: 'in', value: ['L1', 'L2'] }]);
  });

  it('empty values array → leaf dropped', () => {
    const result = buildConditionLeavesFromScopeState({ Shift: [] }, []);
    expect(result).toEqual([]);
  });

  it('rangeLeaves are appended as-is after categorical leaves', () => {
    const range: ConditionLeaf = { kind: 'leaf', column: 'Temp', op: 'gte', value: 80 };
    const result = buildConditionLeavesFromScopeState({ Machine: ['M1'] }, [range]);
    expect(result).toEqual([{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'M1' }, range]);
  });

  it('empty categoricalFilters + range leaves → only range leaves', () => {
    const range: ConditionLeaf = { kind: 'leaf', column: 'Y', op: 'between', value: [10, 20] };
    expect(buildConditionLeavesFromScopeState({}, [range])).toEqual([range]);
  });

  it('all empty → empty array', () => {
    expect(buildConditionLeavesFromScopeState({}, [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Lossless round-trip: predicateSetKey invariant
// ---------------------------------------------------------------------------

describe('round-trip losslessness', () => {
  it('categorical-only round-trip preserves predicateSetKey', () => {
    const original: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' },
      { kind: 'leaf', column: 'Product', op: 'in', value: ['X', 'Y'] },
    ];
    const { categoricalFilters, rangeLeaves } = conditionLeavesToScopeState(original);
    const rebuilt = buildConditionLeavesFromScopeState(categoricalFilters, rangeLeaves);
    expect(predicateSetKey(rebuilt)).toBe(predicateSetKey(original));
  });

  it('range-only round-trip preserves predicateSetKey', () => {
    const original: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Temp', op: 'between', value: [100, 200] },
      { kind: 'leaf', column: 'Y', op: 'gte', value: 50 },
    ];
    const { categoricalFilters, rangeLeaves } = conditionLeavesToScopeState(original);
    const rebuilt = buildConditionLeavesFromScopeState(categoricalFilters, rangeLeaves);
    expect(predicateSetKey(rebuilt)).toBe(predicateSetKey(original));
  });

  it('mixed categorical + range round-trip preserves predicateSetKey', () => {
    const original: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Temp', op: 'gte', value: 80 },
      { kind: 'leaf', column: 'Line', op: 'in', value: ['L1', 'L2'] },
      { kind: 'leaf', column: 'Y', op: 'between', value: [10, 20] },
    ];
    const { categoricalFilters, rangeLeaves } = conditionLeavesToScopeState(original);
    const rebuilt = buildConditionLeavesFromScopeState(categoricalFilters, rangeLeaves);
    expect(predicateSetKey(rebuilt)).toBe(predicateSetKey(original));
  });

  it('neq round-trip: neq leaves travel through rangeLeaves and preserve predicateSetKey', () => {
    // `neq` is a range/comparison leaf (not eq/in), so it lands in rangeLeaves
    // and must survive the round-trip with an identical predicateSetKey.
    const original: ConditionLeaf[] = [
      { kind: 'leaf', column: 'Shift', op: 'neq', value: 'Night' },
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' },
    ];
    const { categoricalFilters, rangeLeaves } = conditionLeavesToScopeState(original);
    // neq should end up in rangeLeaves, not categoricalFilters
    expect(rangeLeaves).toHaveLength(1);
    expect(rangeLeaves[0].op).toBe('neq');
    const rebuilt = buildConditionLeavesFromScopeState(categoricalFilters, rangeLeaves);
    expect(predicateSetKey(rebuilt)).toBe(predicateSetKey(original));
  });
});

// ---------------------------------------------------------------------------
// buildBandLeaf
// ---------------------------------------------------------------------------

describe('buildBandLeaf', () => {
  it('hi present → between leaf with [lo, hi]', () => {
    const leaf = buildBandLeaf('Fill_Weight', 100, 120);
    expect(leaf).toEqual({ kind: 'leaf', column: 'Fill_Weight', op: 'between', value: [100, 120] });
  });

  it('hi absent → gte leaf', () => {
    const leaf = buildBandLeaf('Fill_Weight', 100);
    expect(leaf).toEqual({ kind: 'leaf', column: 'Fill_Weight', op: 'gte', value: 100 });
  });

  it('hi present with same value as lo → between leaf (degenerate range is valid)', () => {
    const leaf = buildBandLeaf('Y', 42, 42);
    expect(leaf).toEqual({ kind: 'leaf', column: 'Y', op: 'between', value: [42, 42] });
  });
});

// ---------------------------------------------------------------------------
// buildGroupLeaf
// ---------------------------------------------------------------------------

describe('buildGroupLeaf', () => {
  it('string level → eq leaf', () => {
    const leaf = buildGroupLeaf('SUPPLIER', 'B');
    expect(leaf).toEqual({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' });
  });

  it('number level → eq leaf', () => {
    const leaf = buildGroupLeaf('LOT', 3);
    expect(leaf).toEqual({ kind: 'leaf', column: 'LOT', op: 'eq', value: 3 });
  });
});
