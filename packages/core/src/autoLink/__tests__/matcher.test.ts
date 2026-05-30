import { describe, it, expect } from 'vitest';
import { matchColumnsToPlans, columnsReferencedByPlan } from '../matcher';
import type { MeasurementPlan } from '../../measurementPlan/types';
import type { ConditionLeaf } from '../../findings/hypothesisCondition';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  outcome: 'Fill Weight',
  primaryFactor: 'Nozzle temperature',
  neededFactors: ['Shift', 'Operator'],
  method: 'sensor',
  sampleSize: 50,
  owner: 'pm-1',
  status: 'planned',
  scope: [],
  processLocation: '',
};

function planWith(overrides: Partial<MeasurementPlan>): MeasurementPlan {
  return { ...basePlan, ...overrides };
}

describe('columnsReferencedByPlan', () => {
  it('unions primaryFactor + neededFactors + scope leaves', () => {
    const scope: ConditionLeaf[] = [{ kind: 'leaf', column: 'Line', op: 'eq', value: 'A' }];
    const cols = columnsReferencedByPlan(planWith({ scope }));
    expect([...cols].sort()).toEqual(['Line', 'Nozzle temperature', 'Operator', 'Shift']);
  });

  it('dedupes a column that appears in multiple fields', () => {
    const scope: ConditionLeaf[] = [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }];
    const cols = columnsReferencedByPlan(planWith({ primaryFactor: 'Shift', scope }));
    expect([...cols]).toEqual(['Shift', 'Operator']);
  });

  it('returns empty set for a plan that names no columns', () => {
    const cols = columnsReferencedByPlan(
      planWith({ primaryFactor: '', neededFactors: [], scope: [] })
    );
    expect(cols.size).toBe(0);
  });
});

describe('matchColumnsToPlans', () => {
  it('matches on a neededFactors hit', () => {
    const matches = matchColumnsToPlans(['Shift'], [basePlan]);
    expect(matches).toEqual([{ plan: basePlan, matchedColumn: 'Shift' }]);
  });

  it('matches on a primaryFactor hit', () => {
    const matches = matchColumnsToPlans(['Nozzle temperature'], [basePlan]);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedColumn).toBe('Nozzle temperature');
  });

  it('matches on a scope-leaf hit', () => {
    const scope: ConditionLeaf[] = [{ kind: 'leaf', column: 'Line', op: 'eq', value: 'A' }];
    const plan = planWith({ id: 'mp-scope', neededFactors: [], primaryFactor: '', scope });
    const matches = matchColumnsToPlans(['Line'], [plan]);
    expect(matches).toEqual([{ plan, matchedColumn: 'Line' }]);
  });

  it('returns no match when no column is named by any plan', () => {
    const matches = matchColumnsToPlans(['Unrelated'], [basePlan]);
    expect(matches).toEqual([]);
  });

  it('returns no match for an empty newColumns list', () => {
    expect(matchColumnsToPlans([], [basePlan])).toEqual([]);
  });

  it('matches multiple plans that each name a different new column', () => {
    const planA = planWith({ id: 'mp-a', primaryFactor: 'A', neededFactors: [], scope: [] });
    const planB = planWith({ id: 'mp-b', primaryFactor: 'B', neededFactors: [], scope: [] });
    const matches = matchColumnsToPlans(['A', 'B'], [planA, planB]);
    expect(matches.map(m => [m.plan.id, m.matchedColumn])).toEqual([
      ['mp-a', 'A'],
      ['mp-b', 'B'],
    ]);
  });

  it('yields one row per matched column when a plan names two new columns', () => {
    const matches = matchColumnsToPlans(['Shift', 'Operator'], [basePlan]);
    expect(matches.map(m => m.matchedColumn)).toEqual(['Shift', 'Operator']);
    expect(matches.every(m => m.plan === basePlan)).toBe(true);
  });

  it('skips soft-deleted plans', () => {
    const deleted = planWith({ id: 'mp-del', deletedAt: 999 });
    expect(matchColumnsToPlans(['Shift'], [deleted])).toEqual([]);
  });

  it('preserves plans order then newColumns order', () => {
    const planA = planWith({ id: 'mp-a', primaryFactor: 'X', neededFactors: ['Y'], scope: [] });
    const planB = planWith({ id: 'mp-b', primaryFactor: 'Z', neededFactors: [], scope: [] });
    const matches = matchColumnsToPlans(['Z', 'Y', 'X'], [planA, planB]);
    // planA first (X then Y per newColumns order), then planB (Z)
    expect(matches.map(m => [m.plan.id, m.matchedColumn])).toEqual([
      ['mp-a', 'Y'],
      ['mp-a', 'X'],
      ['mp-b', 'Z'],
    ]);
  });
});
