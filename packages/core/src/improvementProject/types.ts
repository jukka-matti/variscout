import type { EntityBase } from '../identity';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessParticipantRef,
  ProcessHubInvestigation,
} from '../processHub';
import type { Hypothesis, Finding, ImprovementIdea, ActionItem } from '../findings/types';
import type { SustainmentRecord, ControlHandoff } from '../sustainment';
import type { ProjectMember } from '../projectMembership/types';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

export interface ImprovementProjectMetadata {
  title: string; // required
  businessCase?: string;
  financialImpact?: { amount?: number; currency: string };
  team?: Array<{
    role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
    /** RACI assignment for the project roster entry. */
    raci?: 'R' | 'A' | 'C' | 'I';
    person: ProcessParticipantRef;
  }>;
  /** Wedge V1 membership roster. Replaces legacy team[] after migration window. */
  members?: ProjectMember[];
  investigationId?: ProcessHubInvestigation['id'];
  /** Improvement actions tracked at the project level. Read-write via reduceActionItems. */
  actions?: ActionItem[];
}

export interface ImprovementProjectOutcomeGoal {
  outcomeSpecId: OutcomeSpec['id'];
  baseline?: number;
  target: number;
  deadline?: string;
}

export interface ImprovementProjectFactorControl {
  factor: string;
  targetCondition: string;
  linkedHypothesisId?: Hypothesis['id'];
}

export interface ImprovementProjectMechanismGoal {
  description: string;
  linkedFindingIds?: Finding['id'][];
}

export interface ImprovementProjectGoal {
  outcomeGoal: ImprovementProjectOutcomeGoal; // Y-level required
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
  sustainmentRecordId?: SustainmentRecord['id'];
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
   *  Sections mode (Sustainment or Handoff stages typically); surfaces in
   *  the Report Overview "What we standardized + learned" section. */
  reflection?: string;
}
