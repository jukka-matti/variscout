import { describe, it, expect } from 'vitest';
import type { MeasurementPlan, MeasurementMethod, MeasurementPlanStatus } from '../types';
import type { ConditionLeaf } from '../../findings/hypothesisCondition';
import type { ProjectContributor } from '../../improvementProject/types';

describe('MeasurementMethod', () => {
  it('exhaustively enumerates 5 method values', () => {
    const methods: MeasurementMethod[] = [
      'sensor',
      'manual-count',
      'gemba-walk',
      'expert-assessment',
      'other',
    ];
    expect(methods).toHaveLength(5);
  });
});

describe('MeasurementPlanStatus', () => {
  it('exhaustively enumerates 4 status values', () => {
    const statuses: MeasurementPlanStatus[] = ['planned', 'in-progress', 'complete', 'skipped'];
    expect(statuses).toHaveLength(4);
  });
});

describe('MeasurementPlan — DCP shape (spec §7.1)', () => {
  it('has the full DCP field set', () => {
    const ownerId: ProjectContributor['id'] = 'pm-1';
    const scope: ConditionLeaf[] = [{ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' }];
    const plan: MeasurementPlan = {
      id: 'mp-1',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      outcome: 'Fill Weight (g)',
      primaryFactor: 'Nozzle temperature',
      neededFactors: ['SHIFT', 'Operator'],
      sampleSize: 50,
      method: 'sensor',
      owner: ownerId,
      status: 'planned',
      scope,
      processLocation: 'step-fill-1',
    };
    expect(plan.primaryFactor).toBe('Nozzle temperature');
    expect(plan.outcome).toBe('Fill Weight (g)');
    expect(plan.neededFactors).toEqual(['SHIFT', 'Operator']);
    expect(plan.scope).toEqual(scope);
    expect(plan.processLocation).toBe('step-fill-1');
    expect(plan.method).toBe('sensor');
    expect(plan.sampleSize).toBe(50);
    expect(plan.status).toBe('planned');
    expect(plan.hypothesisId).toBe('h-1');
  });

  it('allows empty scope array (no active drill chips)', () => {
    const plan: MeasurementPlan = {
      id: 'mp-2',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      outcome: 'Y',
      primaryFactor: 'X',
      neededFactors: [],
      sampleSize: 10,
      method: 'gemba-walk',
      owner: 'pm-1',
      status: 'complete',
      scope: [],
      processLocation: '',
    };
    expect(plan.scope).toEqual([]);
    expect(plan.processLocation).toBe('');
  });

  it('supports optional opDef, msaNote, and linkedFindingIds', () => {
    const plan: MeasurementPlan = {
      id: 'mp-3',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      outcome: 'Y',
      primaryFactor: 'X',
      neededFactors: [],
      sampleSize: 10,
      method: 'gemba-walk',
      owner: 'pm-1',
      status: 'complete',
      scope: [],
      processLocation: '',
      opDef: 'Measure at station 3 before packaging',
      msaNote: 'Gage R&R study planned Q3',
      linkedFindingIds: ['f-1', 'f-2'],
    };
    expect(plan.opDef).toBe('Measure at station 3 before packaging');
    expect(plan.msaNote).toBe('Gage R&R study planned Q3');
    expect(plan.linkedFindingIds).toEqual(['f-1', 'f-2']);
  });

  it('hypothesisId is excluded from MeasurementPlanPatch (immutability at type level)', () => {
    // The Omit<> in actions.ts enforces that hypothesisId cannot be patched.
    // This test documents the contract; tsc catches violations at compile time.
    // @ts-expect-error hypothesisId must not appear in MeasurementPlanPatch
    const _bad: import('../actions').MeasurementPlanPatch = { hypothesisId: 'h-other' };
    // Allowed: any field except identity/lifecycle/hypothesisId
    const _ok: import('../actions').MeasurementPlanPatch = { status: 'complete', sampleSize: 100 };
    expect(true).toBe(true);
  });
});
