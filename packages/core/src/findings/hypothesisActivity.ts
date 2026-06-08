import type { MeasurementPlan } from '../measurementPlan/types';
import type { HypothesisTestPlanFactor } from './hypothesisTestPlan';
import type { DisconfirmationAttempt, Hypothesis } from './types';

export const STALLED_WORKING_DAY_THRESHOLD = 5;

export interface HypothesisActivityStalledState {
  isStalled: boolean;
  quietWorkingDays: number;
  thresholdWorkingDays: number;
}

export interface HypothesisActivity {
  runNowFactors: HypothesisTestPlanFactor[];
  inFlightPlans: MeasurementPlan[];
  pendingAttempts: DisconfirmationAttempt[];
  stalled: HypothesisActivityStalledState;
}

export interface DeriveHypothesisActivityArgs {
  hub: Hypothesis;
  plans: readonly MeasurementPlan[];
  testPlanFactors?: readonly HypothesisTestPlanFactor[];
  now: number;
}

export function deriveHypothesisActivity({
  hub,
  plans,
  testPlanFactors,
  now,
}: DeriveHypothesisActivityArgs): HypothesisActivity {
  const runNowFactors = (testPlanFactors ?? []).filter(tp => tp.readiness === 'ready');
  const inFlightPlans = plans.filter(
    plan => plan.deletedAt === null && (plan.status === 'planned' || plan.status === 'in-progress')
  );
  const pendingAttempts = (hub.disconfirmationAttempts ?? []).filter(
    attempt => attempt.verdict === 'pending'
  );
  const quietWorkingDays = workingDaysBetween(hub.updatedAt, now);
  const unsettled = hub.status !== 'evidence-survived-test' && hub.status !== 'refuted';
  const isStalled =
    unsettled &&
    runNowFactors.length === 0 &&
    inFlightPlans.length === 0 &&
    pendingAttempts.length === 0 &&
    quietWorkingDays >= STALLED_WORKING_DAY_THRESHOLD;

  return {
    runNowFactors,
    inFlightPlans,
    pendingAttempts,
    stalled: {
      isStalled,
      quietWorkingDays,
      thresholdWorkingDays: STALLED_WORKING_DAY_THRESHOLD,
    },
  };
}

export function workingDaysBetween(startMs: number, endMs: number): number {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;

  let days = 0;
  const cursor = startOfUtcDay(startMs);
  const end = startOfUtcDay(endMs);

  while (cursor.getTime() < end.getTime()) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function startOfUtcDay(ms: number): Date {
  const date = new Date(ms);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
