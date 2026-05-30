import { describe, it, expect } from 'vitest';
import { computeReingestAutoLink, type AutoLinkMinters } from '../engine';
import type { MeasurementPlan } from '../../measurementPlan/types';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  outcome: 'Fill Weight',
  primaryFactor: 'Nozzle temperature',
  neededFactors: ['Shift'],
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

/** Deterministic minters: stable id per (planId, column); fixed clock. */
const minters: AutoLinkMinters = {
  mintFindingId: (planId, column) => `auto::${planId}::${column}`,
  now: () => 1_700_000_000_000,
};

describe('computeReingestAutoLink', () => {
  it('emits a finding + link + status bump for a matched planned plan', () => {
    const res = computeReingestAutoLink({ newColumns: ['Shift'], plans: [basePlan], minters });

    expect(res.findingsToAdd).toHaveLength(1);
    const f = res.findingsToAdd[0];
    expect(f.id).toBe('auto::mp-1::Shift');
    expect(f.source).toBeUndefined(); // bare observation — no FindingSource variant
    expect(f.evidenceType).toBe('data');
    expect(f.status).toBe('observed');
    expect(f.deletedAt).toBeNull();
    expect(f.context.activeFilters).toEqual({});
    expect(f.context.cumulativeScope).toBeNull();
    expect(f.createdAt).toBe(1_700_000_000_000);

    expect(res.linkActions).toEqual([
      { kind: 'MEASUREMENT_PLAN_LINK_FINDING', planId: 'mp-1', findingId: 'auto::mp-1::Shift' },
    ]);
    expect(res.statusActions).toEqual([
      { kind: 'MEASUREMENT_PLAN_UPDATE', planId: 'mp-1', patch: { status: 'in-progress' } },
    ]);
  });

  it('uses activeScopeFilters as the finding context when provided', () => {
    const res = computeReingestAutoLink({
      newColumns: ['Shift'],
      plans: [basePlan],
      activeScopeFilters: { Line: ['A'] },
      minters,
    });
    expect(res.findingsToAdd[0].context.activeFilters).toEqual({ Line: ['A'] });
  });

  it('threads investigationId onto the finding', () => {
    const res = computeReingestAutoLink({
      newColumns: ['Shift'],
      plans: [basePlan],
      investigationId: 'inv-42',
      minters,
    });
    expect(res.findingsToAdd[0].investigationId).toBe('inv-42');
  });

  it('does NOT bump status for a plan already in-progress (only planned → in-progress)', () => {
    const res = computeReingestAutoLink({
      newColumns: ['Shift'],
      plans: [planWith({ status: 'in-progress' })],
      minters,
    });
    expect(res.findingsToAdd).toHaveLength(1); // still records the arrival
    expect(res.linkActions).toHaveLength(1); // still links
    expect(res.statusActions).toEqual([]); // but never re-progresses
  });

  it('never progresses a complete or skipped plan', () => {
    const complete = computeReingestAutoLink({
      newColumns: ['Shift'],
      plans: [planWith({ id: 'c', status: 'complete' })],
      minters,
    });
    const skipped = computeReingestAutoLink({
      newColumns: ['Shift'],
      plans: [planWith({ id: 's', status: 'skipped' })],
      minters,
    });
    expect(complete.statusActions).toEqual([]);
    expect(skipped.statusActions).toEqual([]);
  });

  it('emits exactly ONE status bump even when a plan matches two new columns', () => {
    const plan = planWith({ primaryFactor: 'Nozzle temperature', neededFactors: ['Shift'] });
    const res = computeReingestAutoLink({
      newColumns: ['Shift', 'Nozzle temperature'],
      plans: [plan],
      minters,
    });
    expect(res.findingsToAdd).toHaveLength(2); // one per matched column
    expect(res.linkActions).toHaveLength(2);
    expect(res.statusActions).toHaveLength(1); // ONE status bump
  });

  it('no match → empty result', () => {
    const res = computeReingestAutoLink({ newColumns: ['Unrelated'], plans: [basePlan], minters });
    expect(res).toEqual({ findingsToAdd: [], linkActions: [], statusActions: [] });
  });

  it('IDEMPOTENT: re-running on identical data yields byte-identical findings (stable ids)', () => {
    const args = { newColumns: ['Shift'], plans: [basePlan], minters };
    const first = computeReingestAutoLink(args);
    const second = computeReingestAutoLink(args);
    // Deterministic id + clock → the two runs are structurally identical, so a
    // caller deduping on finding id will add the finding exactly once.
    expect(second.findingsToAdd.map(f => f.id)).toEqual(first.findingsToAdd.map(f => f.id));
    expect(second).toEqual(first);
  });

  it('is deterministic — no Date.now / crypto under the hood (fixed minters drive all ids/timestamps)', () => {
    const res = computeReingestAutoLink({ newColumns: ['Shift'], plans: [basePlan], minters });
    // Every id + timestamp traces to the injected minters.
    expect(res.findingsToAdd[0].id).toBe('auto::mp-1::Shift');
    expect(res.findingsToAdd[0].createdAt).toBe(1_700_000_000_000);
    expect(res.findingsToAdd[0].statusChangedAt).toBe(1_700_000_000_000);
  });
});
