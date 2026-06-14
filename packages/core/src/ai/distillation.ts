/**
 * CL-6: Transcript distillation via CoScout structured output.
 *
 * Converts a meeting transcript into `ProposedInsight`-shaped proposals using
 * a one-shot CoScout Responses API call with structured JSON output.
 *
 * **Dormant guarantee:** when `config` is undefined (i.e. no AI provider is
 * configured) OR the transcript is blank, this function returns `[]` and makes
 * NO network call. CoScout is `ai: false` in every channel today — BYOK and
 * tenant wiring are named-future. The deterministic typed/Markdown path (CL-4)
 * is the only functional return mode at V1 ship time; this path stays inert
 * until a provider key exists.
 *
 * **Stats engine invariant preserved:** this function produces qualitative
 * proposals only. Nothing enters the stats engine or canonical store state
 * here — that requires an explicit `acceptInsight` call by the analyst.
 *
 * @module
 */

import type { ProposedInsightKind } from '../consultations/types';
import type { ResponsesApiConfig } from './responsesApi';
import { sendResponsesTurn, extractResponseText } from './responsesApi';
import { proposedInsightSchema } from './schemas';
import { buildRole } from './prompts/coScout/role';
import { TERMINOLOGY_INSTRUCTION } from './prompts/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DistillInput {
  /** Undefined ⇒ provider 'none' ⇒ no-op (dormant path). */
  config?: ResponsesApiConfig;
  transcript: string;
  questions: Array<{ id: string; text: string }>;
}

/** The proposal shape returned by distillation — no status or store fields. */
export interface DistilledProposal {
  /** Maps to a question, or undefined when the insight arrived unanchored. */
  questionId?: string;
  text: string;
  kind: ProposedInsightKind;
}

// ── Valid kind set ─────────────────────────────────────────────────────────────

const VALID_KINDS = new Set<string>([
  'answer',
  'context',
  'new-hypothesis-proposal',
  'contradiction',
]);

// ── Implementation ─────────────────────────────────────────────────────────────

/**
 * Distill a meeting transcript into `ProposedInsight`-shaped objects via a
 * one-shot CoScout structured-output call.
 *
 * Returns `[]` and makes no network call when:
 * - `config` is `undefined` (no provider configured — dormant path), OR
 * - `transcript` is blank/whitespace-only.
 *
 * On partial or malformed model responses, drops invalid items defensively
 * and returns whatever is valid. Never throws on model response issues.
 */
export async function distillTranscriptToInsights(
  input: DistillInput
): Promise<DistilledProposal[]> {
  const { config, transcript, questions } = input;

  // Dormant path: no provider configured
  if (!config) return [];

  // Dormant path: blank transcript
  if (!transcript.trim()) return [];

  // Build a focused one-shot system prompt using tier-1 role + terminology.
  // We reuse buildRole() for consistent CoScout identity and TERMINOLOGY_INSTRUCTION
  // to enforce "suspected cause" language (never "root cause" — ESLint enforces
  // this in ai/prompts/ but we apply it defensively here too).
  const systemInstructions = [
    buildRole(),
    TERMINOLOGY_INSTRUCTION,
    buildDistillationInstructions(questions),
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const response = await sendResponsesTurn(config, {
      input: transcript,
      instructions: systemInstructions,
      tools: [], // one-shot: no tool loop
      text: {
        format: {
          type: 'json_schema',
          name: 'proposed_insights',
          schema: proposedInsightSchema as unknown as Record<string, unknown>,
          strict: true,
        },
      },
    });

    const rawText = extractResponseText(response);
    const validQuestionIds = new Set(questions.map(q => q.id));
    return parseAndValidatePayload(rawText, validQuestionIds);
  } catch {
    // Network or API errors: return [] rather than propagating — the analyst
    // can always use the deterministic path.
    return [];
  }
}

// ── Private helpers ────────────────────────────────────────────────────────────

/**
 * Build the distillation-specific instruction block.
 * Supplies the question list so the model can anchor insights by id.
 */
function buildDistillationInstructions(
  questions: Array<{ id: string; text: string }>
): string {
  const questionList =
    questions.length > 0
      ? questions
          .map((q, i) => `  Q${i + 1} [id: ${q.id}]: ${q.text}`)
          .join('\n')
      : '  (no questions provided — produce unanchored insights)';

  return `## Distillation Task

You are reading a meeting transcript from a process improvement consultation.
Your task: extract structured insights from the expert's words.

**Questions the analyst asked the expert:**
${questionList}

**Output rules:**
- Return a JSON object with key "insights" containing an array, matching the schema.
- For each insight, classify it as one of:
    "answer" — directly addresses one of the questions above (set questionId to the question's id)
    "context" — useful background knowledge that does not directly answer a question
    "new-hypothesis-proposal" — a mechanism or suspected cause the expert raised that is NOT in the existing questions
    "contradiction" — a statement that conflicts with the current investigation direction
- Set "questionId" to the question's id when the insight clearly answers it; set to null otherwise.
- Extract mechanisms and suspected causes; never say "root cause" — use "suspected cause".
- Each insight must be one clear statement (one to three sentences).
- Drop pleasantries, scheduling talk, and off-topic content.
- If the transcript contains no extractable insights, return an object with an empty insights array.`;
}

/**
 * Parse the raw model text as JSON and validate each item against the schema.
 *
 * The model response is an object `{ insights: [...] }` (object-rooted per
 * Azure strict-mode requirement). Drops malformed items; never throws.
 *
 * @param raw - Raw text from the model response.
 * @param validQuestionIds - Set of valid question ids from the consultation.
 *   A questionId not present in this set is treated as absent (the insight is
 *   kept but unanchored — I1: prevents dangling FKs).
 */
function parseAndValidatePayload(
  raw: string,
  validQuestionIds: Set<string>
): DistilledProposal[] {
  if (!raw || !raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  // The model response must be an object with an `insights` array (B1: object root).
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];

  const insightsRaw = (parsed as Record<string, unknown>).insights;
  if (!Array.isArray(insightsRaw)) return [];

  const results: DistilledProposal[] = [];

  for (const item of insightsRaw) {
    if (!item || typeof item !== 'object') continue;

    const { questionId, text, kind } = item as Record<string, unknown>;

    // text must be a non-empty string
    if (typeof text !== 'string' || !text.trim()) continue;

    // kind must be one of the 4 valid ProposedInsightKind values
    if (typeof kind !== 'string' || !VALID_KINDS.has(kind)) continue;

    const proposal: DistilledProposal = {
      text: text.trim(),
      kind: kind as ProposedInsightKind,
    };

    // questionId is optional — include only when it's a non-empty string AND
    // matches a question that was actually supplied (I1: drop hallucinated ids).
    // The model may return null for "no anchor" (per the nullable schema type).
    if (
      typeof questionId === 'string' &&
      questionId.trim() &&
      validQuestionIds.has(questionId.trim())
    ) {
      proposal.questionId = questionId.trim();
    }

    results.push(proposal);
  }

  return results;
}
