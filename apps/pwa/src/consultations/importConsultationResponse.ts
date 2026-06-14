/**
 * CL-5a / CL-6: Response file import handler.
 *
 * Reads a File, routes to the correct parser based on filename extension:
 *   - `.json`                   → `parseJsonResponse` (deterministic)
 *   - `.md` / `.txt` (non-VTT) → `parseMarkdownResponse` (deterministic)
 *   - `.vtt` / transcript       → `distillTranscriptToInsights` (AI-gated, CL-6)
 *
 * The transcript path is **dormant** when `config` is `undefined` — it returns a
 * `ParsedResponse` with `[]` insights and makes no network call. CoScout is
 * `ai: false` in every channel today; this path stays inert until BYOK/tenant
 * wiring lands (named-future).
 *
 * TODO(CL-6): pass CoScout config when BYOK/tenant wiring lands (call site in
 * `ConsultationBuilder` currently passes `undefined`).
 *
 * This function does NOT call the store — the caller (CL-5b) is responsible
 * for passing the result to `useAnalyzeStore.getState().importResponse(...)`.
 * Keeping this layer store-free makes it independently testable.
 *
 * Parse errors from the deterministic path propagate to the caller.
 * The AI path never throws — network errors yield `[]` insights.
 */

import {
  parseJsonResponse,
  parseMarkdownResponse,
  type ParsedResponse,
} from '@variscout/core/consultations';
import type { Consultation } from '@variscout/core/consultations';
import { distillTranscriptToInsights } from '@variscout/core/ai';
import type { ResponsesApiConfig } from '@variscout/core/ai';

/** Extensions that signal a transcript file rather than a typed response. */
const TRANSCRIPT_EXTENSIONS = new Set(['.vtt']);

/**
 * The result of importing a consultation response file — a `ParsedResponse`
 * augmented with the resolved `source` so the caller can pass the correct
 * source to `importResponse` without re-inspecting the filename.
 */
export interface ImportedConsultationResponse extends ParsedResponse {
  /** How the response was produced — affects insight status and review UX. */
  source: 'typed' | 'transcript';
}

/**
 * Read a response file and parse it into an `ImportedConsultationResponse`.
 *
 * Routing rule:
 *   - `.json` (case-insensitive) → `parseJsonResponse` (deterministic, source='typed')
 *   - `.vtt`                     → `distillTranscriptToInsights` (AI-gated, source='transcript')
 *   - all else                   → `parseMarkdownResponse` (deterministic, source='typed')
 *
 * @param config - CoScout provider config. Pass `undefined` (the default today)
 *   to keep the transcript path dormant.
 * @throws {Error} when a deterministic parser cannot parse the file content.
 */
export async function importConsultationResponseFile(
  file: { name: string; text(): Promise<string> },
  consultation: Consultation,
  config?: ResponsesApiConfig
): Promise<ImportedConsultationResponse> {
  const raw = await file.text();
  const ext = getExtension(file.name);

  // Structured JSON response — case-insensitive (M2: handles .JSON etc.)
  if (ext === '.json') {
    return { ...parseJsonResponse(raw, consultation), source: 'typed' };
  }

  // Transcript file — AI-gated path (CL-6)
  if (TRANSCRIPT_EXTENSIONS.has(ext)) {
    return distillToResponse(raw, consultation, config);
  }

  // Default: deterministic Markdown/typed path (CL-4)
  return { ...parseMarkdownResponse(raw, consultation), source: 'typed' };
}

// ── Private helpers ────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

/**
 * Route a transcript through `distillTranscriptToInsights`.
 *
 * When `config` is undefined (dormant path), this returns an empty response
 * without making any network call — the correct V1 behavior.
 */
async function distillToResponse(
  transcript: string,
  consultation: Consultation,
  config: ResponsesApiConfig | undefined
): Promise<ImportedConsultationResponse> {
  const questions = consultation.questions.map(q => ({ id: q.id, text: q.text }));

  const proposals = await distillTranscriptToInsights({
    config,
    transcript,
    questions,
  });

  return {
    // No respondent label from a transcript — the analyst can fill it in via the UI
    respondentLabel: '',
    insights: proposals,
    source: 'transcript',
  };
}
