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

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

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
}
