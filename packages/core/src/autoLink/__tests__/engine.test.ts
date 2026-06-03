import { describe, it, expect } from 'vitest';
import { computeReingestAutoLink } from '../engine';
import type { MeasurementPlan } from '../../measurementPlan/types';

const basePlan: MeasurementPlan = {
  id: 'plan-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  outcome: 'Fill Weight',
  primaryFactor: 'Nozzle temperature',
  neededFactors: ['nozzle-temp'],
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

describe('computeReingestAutoLink', () => {
  it('returns a pending-match descriptor per matched plan+column, with no finding and no actions', () => {
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [basePlan],
    });

    expect(result.pendingMatches).toEqual([
      expect.objectContaining({
        id: 'plan-1:nozzle-temp',
        planId: 'plan-1',
        hypothesisId: 'h-1',
        column: 'nozzle-temp',
        planStatus: 'planned',
      }),
    ]);

    // De-automation negative controls — the old write surfaces are GONE:
    expect((result as Record<string, unknown>).findingsToAdd).toBeUndefined();
    expect((result as Record<string, unknown>).linkActions).toBeUndefined();
    expect((result as Record<string, unknown>).statusActions).toBeUndefined();
  });

  it('includes planLabel from primaryFactor', () => {
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [basePlan],
    });
    expect(result.pendingMatches[0].planLabel).toBe('Nozzle temperature');
  });

  it('falls back to outcome for planLabel when primaryFactor is empty', () => {
    const plan = planWith({ primaryFactor: '', outcome: 'Fill Weight' });
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [plan],
    });
    expect(result.pendingMatches[0].planLabel).toBe('Fill Weight');
  });

  it('mechanical matching preserved: soft-deleted plans are skipped (matcher untouched)', () => {
    // a deletedAt!==null plan whose neededFactors contains the new column yields NO pending match
    const deletedPlan = planWith({ deletedAt: 12345 });
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [deletedPlan],
    });
    expect(result.pendingMatches).toHaveLength(0);
  });

  it('no match → empty pendingMatches', () => {
    const result = computeReingestAutoLink({
      newColumns: ['Unrelated'],
      plans: [basePlan],
    });
    expect(result).toEqual({ pendingMatches: [] });
  });

  it('emits one descriptor per matched (plan, column) pair — a plan matching two columns yields two descriptors', () => {
    const plan = planWith({ primaryFactor: 'Nozzle temperature', neededFactors: ['nozzle-temp'] });
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp', 'Nozzle temperature'],
      plans: [plan],
    });
    // one per matched column
    expect(result.pendingMatches).toHaveLength(2);
    const ids = result.pendingMatches.map(m => m.id);
    expect(ids).toContain('plan-1:nozzle-temp');
    expect(ids).toContain('plan-1:Nozzle temperature');
  });

  it('deterministic id: same (planId, column) always yields plan-1:nozzle-temp', () => {
    const r1 = computeReingestAutoLink({ newColumns: ['nozzle-temp'], plans: [basePlan] });
    const r2 = computeReingestAutoLink({ newColumns: ['nozzle-temp'], plans: [basePlan] });
    expect(r1.pendingMatches[0].id).toBe('plan-1:nozzle-temp');
    expect(r2).toEqual(r1);
  });

  it('does NOT emit for a plan already in-progress (planStatus is surfaced, status progression removed)', () => {
    const inProgressPlan = planWith({ status: 'in-progress' });
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [inProgressPlan],
    });
    // The match still occurs — the descriptor carries planStatus for the host UI to decide
    expect(result.pendingMatches).toHaveLength(1);
    expect(result.pendingMatches[0].planStatus).toBe('in-progress');
  });

  it('complete and skipped plans still match — planStatus is carried for host to decide', () => {
    const complete = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [planWith({ id: 'c', status: 'complete' })],
    });
    const skipped = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [planWith({ id: 's', status: 'skipped' })],
    });
    expect(complete.pendingMatches[0].planStatus).toBe('complete');
    expect(skipped.pendingMatches[0].planStatus).toBe('skipped');
  });

  it('multiple plans can match the same column — one descriptor per plan', () => {
    const plan2 = planWith({ id: 'plan-2', hypothesisId: 'h-2' });
    const result = computeReingestAutoLink({
      newColumns: ['nozzle-temp'],
      plans: [basePlan, plan2],
    });
    expect(result.pendingMatches).toHaveLength(2);
    expect(result.pendingMatches.map(m => m.planId)).toEqual(['plan-1', 'plan-2']);
  });
});
