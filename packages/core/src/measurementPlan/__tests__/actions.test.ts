import { describe, it, expect } from 'vitest';
import { reduceMeasurementPlans, type MeasurementPlanPatch } from '../actions';
import type { MeasurementPlan } from '../types';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  factor: 'Nozzle temperature',
  method: 'sensor',
  sampleSize: 50,
  owner: 'pm-1',
  status: 'planned',
};

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_ADD', () => {
  it('appends a new plan', () => {
    const next = reduceMeasurementPlans([], {
      kind: 'MEASUREMENT_PLAN_ADD',
      plan: basePlan,
    });
    expect(next).toEqual([basePlan]);
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_UPDATE', () => {
  it('merges patch onto the matched plan', () => {
    const start: MeasurementPlan[] = [basePlan];
    const patch: MeasurementPlanPatch = {
      status: 'in-progress',
      sampleSize: 75,
    };
    const next = reduceMeasurementPlans(start, {
      kind: 'MEASUREMENT_PLAN_UPDATE',
      planId: 'mp-1',
      patch,
    });
    expect(next).toHaveLength(1);
    expect(next[0].status).toBe('in-progress');
    expect(next[0].sampleSize).toBe(75);
    expect(next[0].id).toBe('mp-1');
    expect(next[0].createdAt).toBe(100);
    expect(next[0].hypothesisId).toBe('h-1');
  });

  it('leaves non-matching plans unchanged', () => {
    const otherPlan: MeasurementPlan = { ...basePlan, id: 'mp-2', factor: 'Other' };
    const next = reduceMeasurementPlans([basePlan, otherPlan], {
      kind: 'MEASUREMENT_PLAN_UPDATE',
      planId: 'mp-1',
      patch: { status: 'complete' },
    });
    expect(next[1]).toEqual(otherPlan);
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_REMOVE', () => {
  it('soft-deletes the matched plan (sets deletedAt)', () => {
    const next = reduceMeasurementPlans([basePlan], {
      kind: 'MEASUREMENT_PLAN_REMOVE',
      planId: 'mp-1',
      removedAt: 200,
    });
    expect(next).toHaveLength(1);
    expect(next[0].deletedAt).toBe(200);
    expect(next[0].id).toBe('mp-1');
    expect(next[0].factor).toBe(basePlan.factor);
  });

  it('does not mutate input', () => {
    const start: MeasurementPlan[] = [basePlan];
    reduceMeasurementPlans(start, {
      kind: 'MEASUREMENT_PLAN_REMOVE',
      planId: 'mp-1',
      removedAt: 200,
    });
    expect(start[0].deletedAt).toBeNull();
  });
});

describe('reduceMeasurementPlans — MEASUREMENT_PLAN_LINK_FINDING', () => {
  it('appends finding to linkedFindingIds', () => {
    const next = reduceMeasurementPlans([basePlan], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-1',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1']);
  });

  it('appends to existing linkedFindingIds array', () => {
    const planWithLink: MeasurementPlan = { ...basePlan, linkedFindingIds: ['f-1'] };
    const next = reduceMeasurementPlans([planWithLink], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-2',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1', 'f-2']);
  });

  it('does not duplicate when finding already linked', () => {
    const planWithLink: MeasurementPlan = { ...basePlan, linkedFindingIds: ['f-1'] };
    const next = reduceMeasurementPlans([planWithLink], {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-1',
      findingId: 'f-1',
    });
    expect(next[0].linkedFindingIds).toEqual(['f-1']);
  });
});

describe('MeasurementPlanPatch', () => {
  it('forbids changing lifecycle + identity + hypothesisId at the type level', () => {
    // @ts-expect-error id in Omit list
    const _patch1: MeasurementPlanPatch = { id: 'mp-99' };
    // @ts-expect-error createdAt in Omit list
    const _patch2: MeasurementPlanPatch = { createdAt: 999 };
    // @ts-expect-error deletedAt in Omit list
    const _patch3: MeasurementPlanPatch = { deletedAt: 999 };
    // @ts-expect-error hypothesisId in Omit list
    const _patch4: MeasurementPlanPatch = { hypothesisId: 'h-other' };
    // Allowed: status, factor, sampleSize, owner, method, linkedFindingIds, msaRequired
    const _patch5: MeasurementPlanPatch = { status: 'complete', sampleSize: 100 };
    expect(true).toBe(true);
  });
});
