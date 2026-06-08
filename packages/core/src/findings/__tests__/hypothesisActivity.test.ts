import { describe, expect, it } from 'vitest';
import type { DisconfirmationAttempt, Hypothesis } from '../types';
import type { MeasurementPlan } from '../../measurementPlan/types';
import {
  STALLED_WORKING_DAY_THRESHOLD,
  deriveHypothesisActivity,
  workingDaysBetween,
} from '../hypothesisActivity';

const MONDAY = Date.UTC(2026, 5, 1, 12, 0, 0);
const NEXT_MONDAY = Date.UTC(2026, 5, 8, 12, 0, 0);

function hub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h1',
    name: 'Night shift staffing gap drives late starts',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: MONDAY,
    updatedAt: MONDAY,
    deletedAt: null,
    ...overrides,
  };
}

function plan(overrides: Partial<MeasurementPlan> = {}): MeasurementPlan {
  return {
    id: 'mp1',
    hypothesisId: 'h1',
    outcome: 'CycleTime',
    primaryFactor: 'Shift',
    neededFactors: [],
    sampleSize: 30,
    method: 'gemba-walk',
    owner: 'm1',
    status: 'planned',
    scope: [],
    processLocation: '',
    linkedFindingIds: [],
    createdAt: MONDAY,
    deletedAt: null,
    ...overrides,
  };
}

function pendingAttempt(overrides: Partial<DisconfirmationAttempt> = {}): DisconfirmationAttempt {
  return {
    id: 'da1',
    attemptedAt: new Date(MONDAY).toISOString(),
    attemptedBy: { userId: 'user-lead', displayName: 'Matti' },
    description: 'Check whether Shift still explains CycleTime this week',
    verdict: 'pending',
    linkedFindingIds: [],
    ...overrides,
  };
}

describe('workingDaysBetween', () => {
  it('counts Monday through Friday and skips weekends', () => {
    expect(workingDaysBetween(MONDAY, NEXT_MONDAY)).toBe(5);
  });

  it('returns zero when the end is before the start', () => {
    expect(workingDaysBetween(NEXT_MONDAY, MONDAY)).toBe(0);
  });
});

describe('deriveHypothesisActivity', () => {
  it('projects ready run-now factors but does not turn them into activity rows', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({ updatedAt: MONDAY }),
      plans: [],
      testPlanFactors: [{ factor: 'Shift', readiness: 'ready', tool: 'two-sample' }],
      now: NEXT_MONDAY,
    });

    expect(activity.runNowFactors.map(f => f.factor)).toEqual(['Shift']);
    expect(activity.inFlightPlans).toEqual([]);
    expect(activity.pendingAttempts).toEqual([]);
    expect(activity.stalled.isStalled).toBe(false);
  });

  it('projects only planned and in-progress measurement plans as in-flight', () => {
    const activity = deriveHypothesisActivity({
      hub: hub(),
      plans: [
        plan({ id: 'planned', status: 'planned' }),
        plan({ id: 'in-progress', status: 'in-progress' }),
        plan({ id: 'complete', status: 'complete' }),
        plan({ id: 'skipped', status: 'skipped' }),
      ],
      testPlanFactors: [],
      now: NEXT_MONDAY,
    });

    expect(activity.inFlightPlans.map(p => p.id)).toEqual(['planned', 'in-progress']);
  });

  it('ignores soft-deleted measurement plans', () => {
    const activity = deriveHypothesisActivity({
      hub: hub(),
      plans: [plan({ id: 'deleted', deletedAt: NEXT_MONDAY })],
      testPlanFactors: [],
      now: NEXT_MONDAY,
    });

    expect(activity.inFlightPlans).toEqual([]);
  });

  it('projects pending disconfirmation attempts as in-flight activity', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({
        disconfirmationAttempts: [
          pendingAttempt({ id: 'pending', verdict: 'pending' }),
          pendingAttempt({ id: 'survived', verdict: 'survived' }),
          pendingAttempt({ id: 'refuted', verdict: 'refuted' }),
        ],
      }),
      plans: [],
      testPlanFactors: [],
      now: NEXT_MONDAY,
    });

    expect(activity.pendingAttempts.map(a => a.id)).toEqual(['pending']);
    expect(activity.stalled.isStalled).toBe(false);
  });

  it('marks a quiet unsettled cause stalled after five working days with no run-now checks or open activity', () => {
    const activity = deriveHypothesisActivity({
      hub: hub({ updatedAt: MONDAY, status: 'needs-disconfirmation' }),
      plans: [plan({ status: 'complete' })],
      testPlanFactors: [{ factor: 'Operator', readiness: 'gap', tool: null }],
      now: NEXT_MONDAY,
    });

    expect(STALLED_WORKING_DAY_THRESHOLD).toBe(5);
    expect(activity.stalled).toEqual({
      isStalled: true,
      quietWorkingDays: 5,
      thresholdWorkingDays: 5,
    });
  });

  it('never marks verified or ruled-out causes stalled', () => {
    for (const status of ['evidence-survived-test', 'refuted'] as const) {
      const activity = deriveHypothesisActivity({
        hub: hub({ updatedAt: MONDAY, status }),
        plans: [],
        testPlanFactors: [],
        now: NEXT_MONDAY,
      });
      expect(activity.stalled.isStalled).toBe(false);
    }
  });
});
