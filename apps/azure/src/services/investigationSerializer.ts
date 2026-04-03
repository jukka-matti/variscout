import type { Finding, Question, SuspectedCause } from '@variscout/core';
import { migrateCauseRolesToHubs } from '@variscout/core';

// ---------------------------------------------------------------------------
// Serialized investigation state (structured JSON for project persistence)
// ---------------------------------------------------------------------------

/**
 * Structured representation of the investigation state saved as JSON.
 * The `suspectedCauses` field is optional so old project files (without hubs)
 * remain valid and are migrated on deserialize.
 */
export interface SerializedInvestigationState {
  findings: Finding[];
  questions: Question[];
  suspectedCauses?: SuspectedCause[];
}

/**
 * Serialize the investigation state to a plain object suitable for JSON storage.
 * `suspectedCauses` is omitted when the array is empty (compact serialization).
 */
export function serializeInvestigationState(
  findings: Finding[],
  questions: Question[],
  suspectedCauses: SuspectedCause[]
): SerializedInvestigationState {
  const state: SerializedInvestigationState = { findings, questions };
  if (suspectedCauses.length > 0) {
    state.suspectedCauses = suspectedCauses;
  }
  return state;
}

/**
 * Deserialize investigation state from a stored object.
 *
 * Migration: if the stored object has no `suspectedCauses` field but contains
 * questions with `causeRole === 'suspected-cause'`, those questions are
 * automatically migrated into individual SuspectedCause hubs. This ensures
 * existing saved projects gain hub entities the first time they are loaded.
 */
export function deserializeInvestigationState(raw: SerializedInvestigationState): {
  findings: Finding[];
  questions: Question[];
  suspectedCauses: SuspectedCause[];
} {
  const findings = raw.findings ?? [];
  const questions = raw.questions ?? [];

  if (raw.suspectedCauses !== undefined) {
    // Data already has hubs — use them directly
    return { findings, questions, suspectedCauses: raw.suspectedCauses };
  }

  // No hubs in stored data — attempt migration from legacy causeRole questions
  const migratedHubs = migrateCauseRolesToHubs(questions);
  return { findings, questions, suspectedCauses: migratedHubs };
}

// ---------------------------------------------------------------------------
// Foundry IQ JSONL serializers (one-way, for AI Knowledge Base uploads)
// ---------------------------------------------------------------------------

/** Serialize findings to JSONL for Foundry IQ indexing */
export function serializeFindings(findings: Finding[]): string {
  return findings
    .map(f =>
      JSON.stringify({
        id: f.id,
        type: 'finding',
        text: f.text,
        status: f.status,
        comments: f.comments?.map(c => c.text).filter(Boolean),
        outcome: f.outcome
          ? {
              effective: f.outcome.effective,
              cpkBefore: f.outcome.cpkBefore,
              cpkAfter: f.outcome.cpkAfter,
              notes: f.outcome.notes,
            }
          : undefined,
        actions: f.actions?.map(a => ({
          text: a.text,
          assignee: a.assignee?.displayName,
          completed: !!a.completedAt,
        })),
        questionId: f.questionId,
        createdAt: f.createdAt,
      })
    )
    .join('\n');
}

/** Serialize answered/ruled-out questions to JSONL */
export function serializeQuestions(questions: Question[]): string {
  return questions
    .filter(q => q.status === 'answered' || q.status === 'ruled-out')
    .map(q =>
      JSON.stringify({
        id: q.id,
        type: q.status === 'answered' ? 'answer' : 'ruled-out',
        text: q.text,
        status: q.status,
        factor: q.factor,
        manualNote: q.manualNote,
        causeRole: q.causeRole,
        evidence: q.evidence,
        linkedFindingIds: q.linkedFindingIds,
        ideas: q.ideas
          ?.filter(i => i.selected)
          .map(i => ({
            text: i.text,
            direction: i.direction,
            timeframe: i.timeframe,
          })),
      })
    )
    .join('\n');
}

/**
 * Serialize suspected cause hubs to JSONL for Foundry IQ indexing.
 * Only confirmed and suspected hubs are included; not-confirmed hubs are skipped.
 */
export function serializeSuspectedCauses(hubs: SuspectedCause[]): string {
  return hubs
    .filter(h => h.status !== 'not-confirmed')
    .map(h =>
      JSON.stringify({
        id: h.id,
        type: 'suspected-cause',
        name: h.name,
        synthesis: h.synthesis,
        status: h.status,
        questionIds: h.questionIds,
        findingIds: h.findingIds,
        totalContribution: h.totalContribution,
        createdAt: h.createdAt,
      })
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Debounced serializer (Foundry IQ upload orchestrator)
// ---------------------------------------------------------------------------

interface SerializerOptions {
  projectId: string;
  uploadBlob: (path: string, content: string) => Promise<void>;
}

/** Debounced serialization — call after findings/questions/hubs change */
export function createInvestigationSerializer(options: SerializerOptions) {
  let findingsTimer: ReturnType<typeof setTimeout> | null = null;
  let questionsTimer: ReturnType<typeof setTimeout> | null = null;
  let suspectedCausesTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 5000;

  return {
    onFindingsChange(findings: Finding[]) {
      if (findingsTimer) clearTimeout(findingsTimer);
      findingsTimer = setTimeout(async () => {
        try {
          const jsonl = serializeFindings(findings);
          await options.uploadBlob(`${options.projectId}/investigation/findings.jsonl`, jsonl);
        } catch (err) {
          console.warn('[KB] Failed to serialize findings:', err);
        }
      }, DEBOUNCE_MS);
    },

    onQuestionsChange(questions: Question[]) {
      if (questionsTimer) clearTimeout(questionsTimer);
      questionsTimer = setTimeout(async () => {
        try {
          const jsonl = serializeQuestions(questions);
          await options.uploadBlob(`${options.projectId}/investigation/questions.jsonl`, jsonl);
        } catch (err) {
          console.warn('[KB] Failed to serialize questions:', err);
        }
      }, DEBOUNCE_MS);
    },

    onSuspectedCausesChange(hubs: SuspectedCause[]) {
      if (suspectedCausesTimer) clearTimeout(suspectedCausesTimer);
      suspectedCausesTimer = setTimeout(async () => {
        try {
          const jsonl = serializeSuspectedCauses(hubs);
          await options.uploadBlob(
            `${options.projectId}/investigation/suspected-causes.jsonl`,
            jsonl
          );
        } catch (err) {
          console.warn('[KB] Failed to serialize suspected causes:', err);
        }
      }, DEBOUNCE_MS);
    },

    dispose() {
      if (findingsTimer) clearTimeout(findingsTimer);
      if (questionsTimer) clearTimeout(questionsTimer);
      if (suspectedCausesTimer) clearTimeout(suspectedCausesTimer);
    },
  };
}
