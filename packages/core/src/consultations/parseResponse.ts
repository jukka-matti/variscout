/**
 * CL-4: Deterministic, edit-tolerant consultation response parser.
 *
 * Two entry points:
 *   parseMarkdownResponse — for the filled Markdown response template.
 *   parseJsonResponse     — for the equivalent structured JSON response.
 *
 * Both are PURE functions: no store imports, no mutations.
 *
 * ## Delimiting strategy
 *
 * The parser anchors ONLY on lines that contain [id: <uuid>].
 * Pattern: /^#{1,6}\s.*\[id:\s*([0-9a-f-]{36})\]/i
 *
 * A bare ### heading (without [id: ...]) inside an answer body is treated
 * as prose and does NOT start a new question section. This is the critical
 * edit-tolerance invariant: respondents often use markdown headings in their
 * prose, and we must not desync on them.
 *
 * The "## Consultation ... — responses" line similarly has no [id:] token,
 * so a respondent who copies that header verbatim inside their answer does
 * not corrupt the parse.
 */

import type { Consultation } from './types';
import type { ProposedInsightKind } from './types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ParsedInsight {
  questionId?: string;
  text: string;
  kind: ProposedInsightKind;
}

export interface ParsedResponse {
  respondentLabel: string;
  insights: ParsedInsight[];
}

// ---------------------------------------------------------------------------
// UUID regex (RFC 4122 lowercase, 36 chars with hyphens)
// ---------------------------------------------------------------------------

const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ID_ANCHOR_RE = new RegExp(`^#{1,6}\\s.*\\[id:\\s*(${UUID_RE})\\]`, 'i');

const PLACEHOLDER = '(type your answer here)';

// ---------------------------------------------------------------------------
// parseMarkdownResponse
// ---------------------------------------------------------------------------

/**
 * Parse a filled Markdown response template back into a ParsedResponse.
 *
 * Delimiting: anchors on [id: <uuid>] tokens in headings, NOT on bare ###.
 * This ensures a respondent who types markdown headings inside their answer
 * body does not desync the parser (the adversarial case).
 *
 * @throws {Error} with a readable message when no id-anchors are found.
 */
export function parseMarkdownResponse(raw: string, consultation: Consultation): ParsedResponse {
  const lines = raw.split('\n');
  const knownIds = new Set(consultation.questions.map(q => q.id));

  // ── 1. Extract respondent label ──────────────────────────────────────────

  let respondentLabel = 'Unknown respondent';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('respondent:')) {
      const label = trimmed.slice('respondent:'.length).trim();
      if (label && label !== '<your name>') {
        respondentLabel = label;
      } else if (label === '<your name>') {
        // Keep the template placeholder as-is (round-trip test expectation)
        respondentLabel = label;
      }
      break;
    }
  }

  // ── 2. Split the document into sections by [id: ...] anchor ─────────────

  type Section = { questionId: string; bodyLines: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = ID_ANCHOR_RE.exec(line);
    if (match) {
      // Start a new section.
      // NOTE: a duplicate [id: <uuid>] heading (same UUID appearing twice) produces
      // two separate sections — and therefore two insights — for the one question.
      // This is intentional for hand-edited files where a respondent may split a
      // long answer into multiple labelled blocks. CL-3's template generator never
      // emits duplicate IDs; the analyst reviews each resulting insight in the UI.
      if (current) sections.push(current);
      current = { questionId: match[1].toLowerCase(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
    // Lines before the first id-anchor are preamble (respondent line etc.) — skip
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    throw new Error(
      'Could not parse consultation response: no question anchors found. ' +
        'Expected headings with [id: <uuid>] tokens matching the response template.'
    );
  }

  // ── 3. Extract answers from sections ────────────────────────────────────

  const insights: ParsedInsight[] = [];

  for (const section of sections) {
    const { questionId, bodyLines } = section;

    // Skip unknown IDs
    if (!knownIds.has(questionId)) continue;

    // Collect answer lines: strip leading "> " quote marker, trim, filter empty
    const answerParts: string[] = [];
    for (const rawLine of bodyLines) {
      let cleaned = rawLine;
      // Strip block-quote prefix: "> " (with optional multiple spaces after >)
      if (cleaned.startsWith('> ')) {
        cleaned = cleaned.slice(2);
      } else if (cleaned === '>') {
        cleaned = '';
      }
      cleaned = cleaned.trim();
      if (cleaned) answerParts.push(cleaned);
    }

    const text = answerParts.join(' ').trim();

    // Skip empty or placeholder answers
    if (!text || text === PLACEHOLDER) continue;

    insights.push({ questionId, text, kind: 'answer' });
  }

  return { respondentLabel, insights };
}

// ---------------------------------------------------------------------------
// parseJsonResponse
// ---------------------------------------------------------------------------

/**
 * Parse a structured JSON response file.
 *
 * Expected shape:
 * {
 *   consultationId: string;
 *   respondentLabel: string;
 *   answers: Array<{ questionId: string; text: string }>;
 * }
 *
 * @throws {Error} with a readable message on invalid JSON or schema mismatch.
 */
export function parseJsonResponse(raw: string, consultation: Consultation): ParsedResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'Could not parse consultation response: invalid JSON. ' +
        'Ensure the response file is valid JSON before importing.'
    );
  }

  // Schema validation
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('respondentLabel' in parsed) ||
    !('answers' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).answers)
  ) {
    throw new Error(
      'Could not parse consultation response: JSON does not match the expected schema. ' +
        'Expected { consultationId, respondentLabel, answers: [{questionId, text}] }.'
    );
  }

  const payload = parsed as {
    consultationId?: unknown;
    respondentLabel: unknown;
    answers: unknown[];
  };

  const respondentLabel =
    typeof payload.respondentLabel === 'string' && payload.respondentLabel.trim()
      ? payload.respondentLabel.trim()
      : 'Unknown respondent';

  const knownIds = new Set(consultation.questions.map(q => q.id));
  const insights: ParsedInsight[] = [];

  for (const answer of payload.answers) {
    if (
      typeof answer !== 'object' ||
      answer === null ||
      !('questionId' in answer) ||
      !('text' in answer)
    ) {
      continue; // skip malformed individual answers
    }

    const ans = answer as { questionId: unknown; text: unknown };
    if (typeof ans.questionId !== 'string' || typeof ans.text !== 'string') continue;

    const questionId = ans.questionId.trim().toLowerCase();
    const text = ans.text.trim();

    if (!text) continue; // skip empty answers
    if (!knownIds.has(questionId)) continue; // skip unknown IDs

    insights.push({ questionId, text, kind: 'answer' });
  }

  return { respondentLabel, insights };
}
