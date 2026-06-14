import { generateDeterministicId, type EntityBase } from '../identity';
import type {
  Consultation,
  ConsultationAnchor,
  ConsultationQuestion,
  ConsultationResponse,
  ConsultationResponseSource,
  ProposedInsight,
  ProposedInsightKind,
} from './types';

function base(): EntityBase {
  return { id: generateDeterministicId(), createdAt: Date.now(), deletedAt: null };
}

export function createConsultation(title: string): Consultation {
  const now = Date.now();
  return {
    ...base(),
    title,
    status: 'draft',
    updatedAt: now,
    viewSelection: [],
    questions: [],
    responses: [],
    proposedInsights: [],
  };
}

export function createConsultationQuestion(
  text: string,
  anchor?: ConsultationAnchor
): ConsultationQuestion {
  return { ...base(), text, status: 'open', ...(anchor ? { anchor } : {}) };
}

export function createConsultationResponse(
  source: ConsultationResponseSource,
  respondentLabel: string,
  rawArtifactRef?: string
): ConsultationResponse {
  return {
    ...base(),
    source,
    respondentLabel,
    importedAt: Date.now(),
    ...(rawArtifactRef ? { rawArtifactRef } : {}),
  };
}

export function createProposedInsight(
  responseId: string,
  text: string,
  kind: ProposedInsightKind,
  questionId?: string
): ProposedInsight {
  return {
    ...base(),
    responseId,
    text,
    kind,
    status: 'pending',
    ...(questionId ? { questionId } : {}),
  };
}
