/**
 * IM-3 auto-link engine (core-pure) — CS-11 de-automated variant.
 *
 * Re-ingest brings new columns. For each MeasurementPlan that named one of those
 * columns (see `matchColumnsToPlans`), this engine produces **pending-match
 * descriptors** — pure data describing what matched. No findings are created, no
 * actions are dispatched, no status is progressed. The host UI (Tasks 2/5/6) turns
 * analyst confirms into writes.
 *
 * "Tool assists, analyst decides." — VariScout V1 invariant.
 *
 * PLANS ONLY (LOCKED #1): the ProblemStatementScope / Hypothesis graph is NOT
 * touched here (deferred to IM-4).
 */

import { matchColumnsToPlans, type PlanColumnMatch } from './matcher';
import type { MeasurementPlan, MeasurementPlanStatus } from '../measurementPlan/types';

export interface ComputeReingestAutoLinkArgs {
  /** Newly-available dataset columns (the column-universe diff). */
  newColumns: readonly string[];
  /** Live MeasurementPlans (loaded via `listByHypothesis` across the IP's hypotheses). */
  plans: readonly MeasurementPlan[];
}

/**
 * A single pending-match descriptor produced by `computeReingestAutoLink`.
 *
 * Describes one (plan, column) match. The host UI surfaces these to the analyst
 * for explicit confirmation; confirmed matches are then written as link + status
 * actions (Tasks 2/5/6).
 */
export interface ReingestPendingMatch {
  /**
   * Deterministic id so hosts can dedup/dismiss across re-fires: `${planId}:${column}`.
   * Pure function of inputs — no clock, no randomness.
   */
  id: string;
  planId: string;
  /** The hypothesis the plan belongs to (focus-on-arrival + breadcrumb label). */
  hypothesisId: string;
  column: string;
  planStatus: MeasurementPlanStatus;
  /** Human label context: the plan's primaryFactor or, if empty, its outcome. */
  planLabel: string;
}

export interface ComputeReingestAutoLinkResult {
  /** One descriptor per matched (plan, column) pair. Empty when nothing matched. */
  pendingMatches: ReingestPendingMatch[];
}

/**
 * Compute pending-match descriptors for a set of newly-available columns. Pure:
 * returns descriptors; dispatches nothing, creates no findings.
 *
 * Per-pair deduplication within a single run uses a `Set` of `${planId}::${column}`
 * so a plan matched on the same column twice (it cannot be, given matcher semantics)
 * would still emit once. The deterministic `id` (`${planId}:${column}`) allows hosts
 * to dedup across re-fires.
 */
export function computeReingestAutoLink(
  args: ComputeReingestAutoLinkArgs
): ComputeReingestAutoLinkResult {
  const { newColumns, plans } = args;

  const matches: PlanColumnMatch[] = matchColumnsToPlans(newColumns, plans);

  const pendingMatches: ReingestPendingMatch[] = [];
  const seenPairs = new Set<string>();

  for (const { plan, matchedColumn } of matches) {
    const pairKey = `${plan.id}::${matchedColumn}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    pendingMatches.push({
      id: `${plan.id}:${matchedColumn}`,
      planId: plan.id,
      hypothesisId: plan.hypothesisId,
      column: matchedColumn,
      planStatus: plan.status,
      planLabel: plan.primaryFactor || plan.outcome,
    });
  }

  return { pendingMatches };
}
