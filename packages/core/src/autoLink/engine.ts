/**
 * IM-3 auto-link engine (core-pure).
 *
 * Re-ingest brings new columns. For each MeasurementPlan that named one of those
 * columns (see `matchColumnsToPlans`), this engine produces — but does NOT
 * dispatch — the HubActions to:
 *   1. add a bare auto-Finding recording "this needed factor arrived",
 *   2. link that finding to the plan (`MEASUREMENT_PLAN_LINK_FINDING`),
 *   3. progress the plan `planned → in-progress` (only if currently `planned`).
 *
 * # Determinism + idempotency (the #1 risk)
 *
 * A reactive hook re-fires on every `rawData` change, so running this on the same
 * (plan, column) data twice must NOT double-add findings or re-progress status.
 * Idempotency is guaranteed by a CONTENT-DERIVED finding id: `mintFindingId(planId,
 * column)` returns the SAME id for the same pair on every run. Therefore:
 *   - The caller skips a `findingsToAdd` entry whose id already exists in the store
 *     (set membership) — no duplicate finding.
 *   - `MEASUREMENT_PLAN_LINK_FINDING` is already idempotent on `linkedFindingIds`
 *     (re-linking the same id is a no-op in the reducer).
 *   - The status bump is guarded on `plan.status === 'planned'`, so a plan already
 *     `in-progress`/`complete`/`skipped` is never re-progressed.
 *
 * PLANS ONLY (LOCKED #1): the ProblemStatementScope / Hypothesis graph is NOT
 * touched here (deferred to IM-4).
 */

import type { Finding, FindingEvidenceType, FindingStatus } from '../findings/types';
import type { MeasurementPlanAction } from '../measurementPlan/actions';
import { matchColumnsToPlans, type PlanColumnMatch } from './matcher';
import type { MeasurementPlan } from '../measurementPlan/types';

/**
 * Deterministic minters injected by the caller. The engine NEVER calls
 * `crypto.randomUUID` or `Date.now()` directly — keeps it pure + testable.
 */
export interface AutoLinkMinters {
  /**
   * Mint a STABLE finding id for a (planId, column) pair. MUST be a pure function
   * of its inputs so re-running on identical data yields identical ids — this is
   * the load-bearing idempotency guarantee. The app supplies a hash-based minter
   * (e.g. a UUIDv5-style derivation over `${planId}::${column}`).
   */
  mintFindingId(planId: string, column: string): string;
  /** Fixed creation timestamp (Unix ms) for the batch. Injected — not `Date.now()`. */
  now(): number;
}

export interface ComputeReingestAutoLinkArgs {
  /** Newly-available dataset columns (the column-universe diff). */
  newColumns: readonly string[];
  /** Live MeasurementPlans (loaded via `listByHypothesis` across the IP's hypotheses). */
  plans: readonly MeasurementPlan[];
  /**
   * Active drill-scope filters at re-ingest time, used as the auto-Finding's
   * `context.activeFilters`. Defaults to `{}` (bare observation, no scope).
   */
  activeScopeFilters?: Record<string, (string | number)[]>;
  /** Investigation FK for the created findings. Defaults to `'general-unassigned'`. */
  investigationId?: string;
  minters: AutoLinkMinters;
}

export interface ComputeReingestAutoLinkResult {
  /** Bare auto-Findings (deterministic ids). Caller skips ids already in the store. */
  findingsToAdd: Finding[];
  /** One `MEASUREMENT_PLAN_LINK_FINDING` per matched (plan, column). */
  linkActions: MeasurementPlanAction[];
  /** `MEASUREMENT_PLAN_UPDATE {status:'in-progress'}` only for currently-`planned` plans. */
  statusActions: MeasurementPlanAction[];
}

const AUTO_FINDING_EVIDENCE_TYPE: FindingEvidenceType = 'data';
const AUTO_FINDING_STATUS: FindingStatus = 'observed';

/**
 * Build the bare auto-Finding for a matched (plan, column). No `source` — this is
 * a source-less observation (LOCKED #5; `FindingSource` stays a 5-variant union,
 * no new `'auto-link'` variant, so every exhaustive switch is untouched). The
 * MATCH keys off the plan's needed columns, not a chart-derived condition.
 *
 * Shape mirrors `createFinding`'s contract (`evidenceType:'data'`, `status:'observed'`,
 * empty `comments`, `deletedAt:null`) but with injected id + clock for determinism.
 */
function buildAutoFinding(
  plan: MeasurementPlan,
  column: string,
  activeFilters: Record<string, (string | number)[]>,
  investigationId: string,
  minters: AutoLinkMinters
): Finding {
  const now = minters.now();
  return {
    id: minters.mintFindingId(plan.id, column),
    text: `Needed factor "${column}" arrived for measurement plan on "${plan.primaryFactor || plan.outcome}".`,
    createdAt: now,
    deletedAt: null,
    investigationId,
    context: {
      activeFilters,
      cumulativeScope: null,
    },
    evidenceType: AUTO_FINDING_EVIDENCE_TYPE,
    status: AUTO_FINDING_STATUS,
    comments: [],
    statusChangedAt: now,
  };
}

/**
 * Compute the auto-link cascade for a set of newly-available columns. Pure: returns
 * actions; dispatches nothing. Per-pair de-duplication within a single run uses a
 * `Set` of `${planId}::${column}` so a plan matched on the same column twice (it
 * cannot be, given matcher semantics) would still emit once; cross-run idempotency
 * is the deterministic-id contract documented above.
 */
export function computeReingestAutoLink(
  args: ComputeReingestAutoLinkArgs
): ComputeReingestAutoLinkResult {
  const {
    newColumns,
    plans,
    activeScopeFilters = {},
    investigationId = 'general-unassigned',
    minters,
  } = args;

  const matches: PlanColumnMatch[] = matchColumnsToPlans(newColumns, plans);

  const findingsToAdd: Finding[] = [];
  const linkActions: MeasurementPlanAction[] = [];
  const statusActions: MeasurementPlanAction[] = [];

  // Guard against emitting more than one status bump per plan in a single run
  // (a plan can match >1 new column → multiple findings/links, but ONE status bump).
  const statusBumpedPlanIds = new Set<string>();
  // Guard against duplicate (plan, column) pairs within a single run.
  const seenPairs = new Set<string>();

  for (const { plan, matchedColumn } of matches) {
    const pairKey = `${plan.id}::${matchedColumn}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const finding = buildAutoFinding(
      plan,
      matchedColumn,
      activeScopeFilters,
      investigationId,
      minters
    );
    findingsToAdd.push(finding);
    linkActions.push({
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: plan.id,
      findingId: finding.id,
    });

    // Status: planned → in-progress only. Never → complete; leave non-planned alone.
    if (plan.status === 'planned' && !statusBumpedPlanIds.has(plan.id)) {
      statusBumpedPlanIds.add(plan.id);
      statusActions.push({
        kind: 'MEASUREMENT_PLAN_UPDATE',
        planId: plan.id,
        patch: { status: 'in-progress' },
      });
    }
  }

  return { findingsToAdd, linkActions, statusActions };
}
