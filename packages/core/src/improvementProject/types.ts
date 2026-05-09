import type { EntityBase } from '../identity';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessParticipantRef,
  ProcessHubInvestigation,
} from '../processHub';
import type { Hypothesis, Finding, ImprovementIdea, ActionItem } from '../findings/types';
import type { SustainmentRecord, ControlHandoff } from '../sustainment';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

export interface ImprovementProjectMetadata {
  title: string; // required
  businessCase?: string;
  financialImpact?: { amount?: number; currency: string };
  team?: Array<{
    role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
    person: ProcessParticipantRef;
  }>;
  investigationId?: ProcessHubInvestigation['id'];
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
}

export interface ImprovementProjectBackgroundSection {
  /** Snapshot copy of capability summary at IP open. Drift indicator triggers refresh. */
  snapshotText?: string;
  snapshottedAt?: string;
  manualNarrative?: string;
}

export interface ImprovementProjectInvestigationLineageSection {
  hypothesisIds?: Hypothesis['id'][];
  findingIds?: Finding['id'][];
}

export interface ImprovementProjectApproachSection {
  improvementIdeaIds?: ImprovementIdea['id'][];
  actionItemIds?: ActionItem['id'][];
  narrative?: string;
}

export interface ImprovementProjectOutcomeReferenceSection {
  sustainmentRecordId?: SustainmentRecord['id'];
  controlHandoffId?: ControlHandoff['id'];
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
}
