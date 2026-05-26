import type {
  Finding,
  Question,
  Hypothesis,
  HypothesisEvidence,
  HypothesisStatus,
} from '@variscout/core';

// ---------------------------------------------------------------------------
// Serialized investigation state (structured JSON for project persistence)
// ---------------------------------------------------------------------------

/**
 * Structured representation of the investigation state saved as JSON.
 * The `hypotheses` field is optional. Old project files without hubs
 * deserialize to an empty hubs array (no back-compat migration per wedge V1).
 */
export interface SerializedInvestigationState {
  findings: Finding[];
  questions: Question[];
  hypotheses?: Hypothesis[];
}

/**
 * Shape of a hypothesis as it may appear in legacy stored data,
 * before the `totalContribution` → `evidence` migration.
 */
interface LegacyStoredHub extends Omit<Hypothesis, 'evidence'> {
  // Old numeric field, present before HypothesisEvidence was introduced
  totalContribution?: number;
  evidence?: HypothesisEvidence;
}

const VALID_HYPOTHESIS_STATUSES: ReadonlySet<HypothesisStatus> = new Set([
  'proposed',
  'evidenced',
  'confirmed',
  'refuted',
  'needs-disconfirmation',
]);

/**
 * Strict status validator — fails loud on unknown values.
 *
 * Per RPS V1 spec D15 (no backward compatibility, design-phase clean breaks),
 * we do not silently translate legacy status values like 'suspected' or
 * 'not-confirmed'. Dev fixtures reset via `pnpm dev:reset` (OQ7).
 */
function assertHypothesisStatus(status: HypothesisStatus): HypothesisStatus {
  if (!VALID_HYPOTHESIS_STATUSES.has(status)) {
    throw new Error(
      `Invalid HypothesisStatus encountered during deserialization: ${JSON.stringify(status)}. ` +
        `Valid values: ${Array.from(VALID_HYPOTHESIS_STATUSES).join(', ')}.`
    );
  }
  return status;
}

/**
 * Serialize the investigation state to a plain object suitable for JSON storage.
 * `hypotheses` is omitted when the array is empty (compact serialization).
 */
export function serializeInvestigationState(
  findings: Finding[],
  questions: Question[],
  hypotheses: Hypothesis[]
): SerializedInvestigationState {
  const state: SerializedInvestigationState = { findings, questions };
  if (hypotheses.length > 0) {
    state.hypotheses = hypotheses;
  }
  return state;
}

/**
 * Deserialize investigation state from a stored object.
 *
 * Field-level normalization applied on load:
 * 1. If a hub has `totalContribution` (legacy numeric field) but no `evidence`,
 *    a basic `HypothesisEvidence` is synthesised from it.
 * 2. `selectedForImprovement` defaults to `undefined` when absent.
 *
 * Status values are asserted strictly: per RPS V1 spec D15 (no backward
 * compatibility), unknown status values throw rather than being silently
 * translated.
 *
 * Per wedge V1 no-back-compat: there is no migration from legacy
 * `causeRole === 'suspected-cause'` questions to hubs. Investigations without
 * hubs return an empty hubs array.
 */
export function deserializeInvestigationState(raw: SerializedInvestigationState): {
  findings: Finding[];
  questions: Question[];
  hypotheses: Hypothesis[];
} {
  const findings = raw.findings ?? [];
  const questions = raw.questions ?? [];

  if (raw.hypotheses !== undefined) {
    // Data already has hubs — apply field-level migration then return
    const migratedHubs = (raw.hypotheses as LegacyStoredHub[]).map((stored): Hypothesis => {
      const { totalContribution: _legacy, ...clean } = stored;
      const hub: Hypothesis = {
        ...clean,
        status: assertHypothesisStatus(stored.status),
        evidence: stored.evidence,
        selectedForImprovement: stored.selectedForImprovement,
      };

      // Migrate legacy totalContribution (number) → HypothesisEvidence
      if (stored.totalContribution != null && !stored.evidence) {
        hub.evidence = {
          mode: 'standard',
          contribution: {
            value: stored.totalContribution,
            label: 'R²adj',
            description: `Explains ${Math.round(stored.totalContribution * 100)}% of variation`,
          },
        };
      }

      return hub;
    });
    return { findings, questions, hypotheses: migratedHubs };
  }

  // No hubs in stored data — return empty hubs array per wedge V1 no-back-compat.
  return { findings, questions, hypotheses: [] };
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
 * serialize hypothesis hubs to JSONL for Foundry IQ indexing.
 * Only non-refuted hypotheses are included; refuted hypotheses are skipped.
 */
export function serializeHypotheses(hubs: Hypothesis[]): string {
  return hubs
    .filter(h => h.status !== 'refuted')
    .map(h =>
      JSON.stringify({
        id: h.id,
        type: 'hypothesis',
        name: h.name,
        synthesis: h.synthesis,
        status: h.status,
        questionIds: h.questionIds,
        findingIds: h.findingIds,
        evidence: h.evidence,
        selectedForImprovement: h.selectedForImprovement,
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
  let hypothesesTimer: ReturnType<typeof setTimeout> | null = null;
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

    onHypothesesChange(hubs: Hypothesis[]) {
      if (hypothesesTimer) clearTimeout(hypothesesTimer);
      hypothesesTimer = setTimeout(async () => {
        try {
          const jsonl = serializeHypotheses(hubs);
          await options.uploadBlob(`${options.projectId}/investigation/hypotheses.jsonl`, jsonl);
        } catch (err) {
          console.warn('[KB] Failed to serialize hypotheses:', err);
        }
      }, DEBOUNCE_MS);
    },

    dispose() {
      if (findingsTimer) clearTimeout(findingsTimer);
      if (questionsTimer) clearTimeout(questionsTimer);
      if (hypothesesTimer) clearTimeout(hypothesesTimer);
    },
  };
}
