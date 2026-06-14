import type { EntityBase } from '../identity';

export type ConsultationStatus = 'draft' | 'sent' | 'responses-imported' | 'closed';

export type ConsultationQuestionStatus = 'open' | 'answered';

export type ProposedInsightKind =
  | 'answer'
  | 'context'
  | 'new-hypothesis-proposal'
  | 'contradiction';

export type ProposedInsightStatus = 'pending' | 'accepted' | 'rejected';

export type ConsultationResponseSource = 'typed' | 'transcript';

/** What the recipient sees in the pack — a reference to an existing view. */
export interface ConsultationViewRef {
  kind: 'condition' | 'chart';
  /** Scope/condition id, or a chart slot key — resolved by the pack builder. */
  ref: string;
  label?: string;
}

/** Optional anchor tying a question to an existing investigation entity. */
export interface ConsultationAnchor {
  kind: 'finding' | 'hypothesis' | 'scope';
  id: string;
}

export interface ConsultationQuestion extends EntityBase {
  text: string;
  anchor?: ConsultationAnchor;
  status: ConsultationQuestionStatus;
}

export interface ConsultationResponse extends EntityBase {
  source: ConsultationResponseSource;
  /** Free text — NO identity management in V1. */
  respondentLabel: string;
  importedAt: number;
  /** Filename or hash of the imported artifact, for provenance. */
  rawArtifactRef?: string;
}

export interface ProposedInsight extends EntityBase {
  responseId: ConsultationResponse['id'];
  /** Maps to a question, or undefined when the insight arrived unanchored. */
  questionId?: ConsultationQuestion['id'];
  text: string;
  kind: ProposedInsightKind;
  status: ProposedInsightStatus;
  /** Set when accepted: the entity the analyst promoted this insight into. */
  acceptedAs?: { kind: 'finding' | 'hypothesis'; id: string };
}

export interface Consultation extends EntityBase {
  title: string;
  status: ConsultationStatus;
  updatedAt: number;
  viewSelection: ConsultationViewRef[];
  questions: ConsultationQuestion[];
  responses: ConsultationResponse[];
  proposedInsights: ProposedInsight[];
}
