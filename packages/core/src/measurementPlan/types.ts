import type { EntityBase } from '../identity';
import type { Finding } from '../findings/types';
import type { Hypothesis } from '../findings/types';
import type { ProjectContributor } from '../improvementProject/types';
import type { ConditionLeaf } from '../findings/hypothesisCondition';

export type MeasurementMethod =
  | 'sensor'
  | 'manual-count'
  | 'gemba-walk'
  | 'expert-assessment'
  | 'other';

export type MeasurementPlanStatus = 'planned' | 'in-progress' | 'complete' | 'skipped';

/**
 * DCP-aligned measurement plan attached to a Hypothesis on the Investigation Wall.
 *
 * Field notes:
 * - `hypothesisId` is required + immutable (no plan without a Hypothesis; excluded from
 *   `MeasurementPlanPatch` via `Omit<>` — see actions.ts).
 * - `neededFactors` = dataset column names (string[]).  IM-3's column-overlap matcher
 *   joins on these names.  Stratifiers/covariates to collect alongside `primaryFactor`.
 * - `scope` is a COPY of the active WHERE leaves (drill chips) when the plan is created.
 *   It is NOT a reference to the `ProblemStatementScope` entity — it is a snapshot of the
 *   `ConditionLeaf[]` from `analysisScopeStore.categoricalFilters` at creation time.
 *   May be `[]` when no drill chips are active.
 * - `processLocation` is the ProcessMap node id (`step-${slug}-${seq}`) this plan belongs
 *   to.  `''` is allowed for a mapless project (ADR-087 tolerates orphaned stepIds pre-launch).
 * - `opDef` and `msaNote` are informational free-text notes — they are NOT gates.
 *   Formal MSA / Gage R&R gates defer to V2.
 */
export interface MeasurementPlan extends EntityBase {
  /** Required + immutable. (§11 #2 decision-log 2026-05-30.) */
  hypothesisId: Hypothesis['id'];
  /** The Y being studied on this plan. */
  outcome: string;
  /** RENAMED from `factor`. The primary X being measured. */
  primaryFactor: string;
  /**
   * Stratifiers / covariates to collect alongside `primaryFactor`.
   * VALUES ARE DATASET COLUMN NAMES — IM-3's column-overlap matcher depends on this contract.
   */
  neededFactors: string[];
  sampleSize: number;
  method: MeasurementMethod;
  owner: ProjectContributor['id'];
  status: MeasurementPlanStatus;
  /**
   * Active WHERE drill-chip conditions captured at plan creation time.
   * This is a COPY (snapshot), NOT a reference to the `ProblemStatementScope` entity.
   * May be `[]` when no drill chips were active.
   */
  scope: ConditionLeaf[];
  /**
   * ProcessMap node id this plan is attached to. Resolves against canonical ProcessMap
   * node ids (`step-${slug}-${seq}`). Empty string `''` is allowed for mapless projects.
   */
  processLocation: string;
  /** Optional operational-definition note (informational — not a maturity gate). */
  opDef?: string;
  /**
   * Optional MSA / Gage R&R comment (informational — not a gate).
   * Replaces the removed `msaRequired: boolean` flag.
   */
  msaNote?: string;
  linkedFindingIds?: Finding['id'][];
  /**
   * Optional ISO-8601 date string (YYYY-MM-DD) by which the data-collection
   * task should be completed. Surfaced prominently on the Wall card next to
   * the status badge (Task 4, IM-4b).
   */
  dueDate?: string;
}
