import type { EntityBase } from '../identity';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessParticipantRef,
  ProcessHubAnalyze,
} from '../processHub';
import type { Hypothesis, Finding, ImprovementIdea, ActionItem } from '../findings/types';
import type { ControlRecord, ControlHandoff } from '../control';
import type { ProjectMember } from '../projectMembership/types';
import type { StepTimingBinding, TimeDecompositionBinding } from '../derived/types';
import type { FormulaBinding } from '../derived/formula/types';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

/**
 * Canvas-edited process step entry persisted on the ImprovementProject root
 * (Canvas Connection Journey E1, CCJ §3.3.3). Structurally mirrors
 * `ExtractedStep` in `@variscout/ui` (Canvas EditMode/ProcessZone); the two
 * are reconciled when CanvasWorkspace adopts the IP-blob persistence path.
 * Kept here so `@variscout/core` can reference process step state without
 * the forbidden core → ui import.
 */
export interface ProcessStepEntry {
  id: string;
  name: string;
  order: number;
}

export interface ImprovementProjectMetadata {
  title: string; // required
  businessCase?: string;
  financialImpact?: { amount?: number; currency: string };
  /** Wedge V1 membership roster (lead / member / sponsor) — the canonical project
   *  roster. ACL gated via `canAccess()` from `@variscout/core/projectMembership`
   *  per ADR-082. Optional only for the bootstrap window; future schema work may
   *  promote to required. */
  members?: ProjectMember[];
  investigationId?: ProcessHubAnalyze['id'];
  /** Improvement actions tracked at the project level. Read-write via reduceActionItems. */
  actions?: ActionItem[];
}

export interface ImprovementProjectOutcomeGoal {
  outcomeSpecId: OutcomeSpec['id'];
  baseline?: number;
  target: number;
  deadline?: string;
  /** Optional: bind this outcome to a specific process step (step-bound Y).
   *  If omitted, the outcome is global (whole-process Y, feeds L1 view).
   *  If present, references a step id in the IP's ProcessMap; feeds L3
   *  focal-step view. Per Spec 2 §3.3.1 step-bound vs global symmetry —
   *  outcomes AND factors can both be global or step-bound. */
  stepId?: string;
}

export interface ImprovementProjectFactorControl {
  factor: string;
  targetCondition: string;
  linkedHypothesisId?: Hypothesis['id'];
  /** Optional: binds this control to a specific process step. Empty = global. */
  stepId?: string;
}

export interface ImprovementProjectMechanismGoal {
  description: string;
  linkedFindingIds?: Finding['id'][];
}

export interface ImprovementProjectGoal {
  /** List of outcome goals (Y-level). At least one required.
   *  Multi-outcome supported (e.g., Yield_pct + ScrapRate_pct + GradeA_ratio
   *  for batch processes per Spec 2 §3.2.2). No formal "primary" concept —
   *  order in the list is a quiet signal (leftmost = shown first) but no
   *  hierarchy is enforced. */
  outcomeGoals: ImprovementProjectOutcomeGoal[];
  factorControls?: ImprovementProjectFactorControl[]; // X-level
  mechanismGoals?: ImprovementProjectMechanismGoal[]; // x-level
  freeText?: string; // fallback when no OutcomeSpec available
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

export interface ImprovementProjectBackgroundSection {
  /** Snapshot copy of capability summary at IP open. Drift indicator triggers refresh. */
  snapshotText?: string;
  snapshotSourceHash?: string;
  snapshottedAt?: string;
  manualNarrative?: string;
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

export interface ImprovementProjectInvestigationLineageSection {
  hypothesisIds?: Hypothesis['id'][];
  findingIds?: Finding['id'][];
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

export interface ImprovementProjectApproachSection {
  improvementIdeaIds?: ImprovementIdea['id'][];
  actionItemIds?: ActionItem['id'][];
  narrative?: string;
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

export interface ImprovementProjectOutcomeReferenceSection {
  sustainmentRecordId?: ControlRecord['id'];
  controlHandoffId?: ControlHandoff['id'];
  /** Optional last-edit timestamp used by synthesized V1 activity feed events. */
  updatedAt?: number;
}

export interface ImprovementProjectSignoff {
  requestedAt?: number;
  approvedAt?: number;
  approvedBy?: ProcessParticipantRef;
}

export interface ImprovementProject extends EntityBase {
  hubId: ProcessHub['id'];
  status: ImprovementProjectStatus;
  metadata: ImprovementProjectMetadata;
  goal: ImprovementProjectGoal;
  sections: {
    background: ImprovementProjectBackgroundSection;
    investigationLineage: ImprovementProjectInvestigationLineageSection;
    approach: ImprovementProjectApproachSection;
    outcomeReference: ImprovementProjectOutcomeReferenceSection;
  };
  updatedAt: number;
  signoff?: ImprovementProjectSignoff;
  /** Optional analyst-authored lessons-learned narrative. Authored in
   *  Sections mode (Control or Handoff stages typically); surfaces in
   *  the Report Overview "What we standardized + learned" section. */
  reflection?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Canvas Connection Journey — flat root fields (CCJ E1)
  //
  // Persisted Canvas Edit-mode state, lifted out of CanvasWorkspace local
  // useState into the active IP so it survives reloads + scopes per-project.
  // All optional during the bootstrap window; UI wires + IDB persistence land
  // in subsequent E1 tasks (this task ships the type extension only).
  // ─────────────────────────────────────────────────────────────────────────

  /** Free-text description of the situation being investigated. ≤ 500 chars.
   *  Authored in the Create Project flow (CCJ E1) and editable from Canvas
   *  Edit mode. Distinct from `ImprovementProjectGoal.freeText` which is the
   *  goal-side fallback when no OutcomeSpec is available. */
  issueStatement?: string;

  /** Canvas-edited process step list (from C3 — Process Structure zone).
   *  Previously held as local `useState<ExtractedStep[]>` in `CanvasWorkspace`;
   *  lifted to the IP root so it persists across sessions. Step ids referenced
   *  by `stepTimings`, `goal.outcomeGoals[].stepId`,
   *  `goal.factorControls[].stepId`. */
  processSteps?: ProcessStepEntry[];

  /** Per-step timing bindings (from D1 — Step Timings workflow).
   *  Paired (start + end columns) drives Lead_time + Total_work_time +
   *  Wait_time derivation; duration columns contribute to Total_work_time
   *  only. `stepId` references entries in `processSteps`. */
  stepTimings?: StepTimingBinding[];

  /** Calculated-column formula bindings (from D2 — Calc workflow).
   *  Covers DPMO / Yield / Throughput / Difference / Custom families. */
  formulaBindings?: FormulaBinding[];

  /** Time-as-factors decomposition bindings (from D3 — derive year /
   *  quarter / month / week / dayOfWeek / hour-bucket columns from a
   *  date-kind source column). */
  timeDecompositionBindings?: TimeDecompositionBinding[];
}
