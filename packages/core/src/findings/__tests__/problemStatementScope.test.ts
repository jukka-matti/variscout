import { describe, it, expect } from 'vitest';
import {
  createProblemStatementScope,
  buildConditionFromCategoricalFilters,
  activeFiltersToCondition,
  type ConditionLeaf,
} from '../../index';

describe('createProblemStatementScope', () => {
  it('creates a scope with required fields and lifecycle stamps', () => {
    const scope = createProblemStatementScope('inv-1', 'Fill Weight');
    expect(scope.projectId).toBe('inv-1');
    expect(scope.outcome).toBe('Fill Weight');
    expect(scope.predicates).toEqual([]);
    expect(scope.hypothesisIds).toEqual([]);
    expect(scope.gateNode).toBeUndefined();
    expect(scope.whatIfProjection).toBeUndefined();
    expect(typeof scope.id).toBe('string');
    expect(scope.id.length).toBeGreaterThan(0);
    expect(scope.createdAt).toBe(scope.updatedAt);
    expect(scope.deletedAt).toBeNull();
  });

  it('accepts predicates and nested hypothesis ids', () => {
    const predicates: ConditionLeaf[] = [{ kind: 'leaf', column: 'Line', op: 'eq', value: 'A' }];
    const scope = createProblemStatementScope('inv-1', 'Yield', predicates, ['hyp-1', 'hyp-2']);
    expect(scope.predicates).toEqual(predicates);
    expect(scope.hypothesisIds).toEqual(['hyp-1', 'hyp-2']);
  });

  it('mints distinct ids per call', () => {
    const a = createProblemStatementScope('inv-1', 'A');
    const b = createProblemStatementScope('inv-1', 'A');
    expect(a.id).not.toBe(b.id);
  });
});

describe('buildConditionFromCategoricalFilters', () => {
  it('maps a single-value chip to an eq leaf', () => {
    const leaves = buildConditionFromCategoricalFilters([{ column: 'Shift', values: ['Night'] }]);
    expect(leaves).toEqual([{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }]);
  });

  it('maps a multi-value chip to an in leaf', () => {
    const leaves = buildConditionFromCategoricalFilters([{ column: 'Line', values: ['A', 'C'] }]);
    expect(leaves).toEqual([{ kind: 'leaf', column: 'Line', op: 'in', value: ['A', 'C'] }]);
  });

  it('keeps numeric values numeric for in leaves', () => {
    const leaves = buildConditionFromCategoricalFilters([{ column: 'Head', values: [5, 6, 7] }]);
    expect(leaves).toEqual([{ kind: 'leaf', column: 'Head', op: 'in', value: [5, 6, 7] }]);
  });

  it('stringifies mixed value arrays for in leaves', () => {
    const leaves = buildConditionFromCategoricalFilters([{ column: 'Head', values: [5, 'B'] }]);
    expect(leaves).toEqual([{ kind: 'leaf', column: 'Head', op: 'in', value: ['5', 'B'] }]);
  });

  it('drops empty chips', () => {
    const leaves = buildConditionFromCategoricalFilters([
      { column: 'Shift', values: [] },
      { column: 'Line', values: ['A'] },
    ]);
    expect(leaves).toEqual([{ kind: 'leaf', column: 'Line', op: 'eq', value: 'A' }]);
  });

  it('returns multiple leaves as a flat AND set', () => {
    const leaves = buildConditionFromCategoricalFilters([
      { column: 'Shift', values: ['Night'] },
      { column: 'Line', values: ['A', 'C'] },
    ]);
    expect(leaves).toHaveLength(2);
    expect(leaves[0]).toEqual({ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' });
    expect(leaves[1]).toEqual({ kind: 'leaf', column: 'Line', op: 'in', value: ['A', 'C'] });
  });
});

describe('activeFiltersToCondition', () => {
  it('converts a Record<column, values[]> snapshot to leaves', () => {
    const leaves = activeFiltersToCondition({ Shift: ['Night'], Line: ['A', 'C'] });
    expect(leaves).toHaveLength(2);
    expect(leaves).toContainEqual({ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' });
    expect(leaves).toContainEqual({ kind: 'leaf', column: 'Line', op: 'in', value: ['A', 'C'] });
  });

  it('returns an empty array for an empty map', () => {
    expect(activeFiltersToCondition({})).toEqual([]);
  });
});
