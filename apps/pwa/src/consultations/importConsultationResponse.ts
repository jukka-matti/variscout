/**
 * CL-5a: Response file import handler.
 *
 * Reads a File, routes to the correct parser (JSON vs Markdown) based on
 * filename extension, and returns the parsed result.
 *
 * This function does NOT call the store — the caller (CL-5b) is responsible
 * for passing the result to `useAnalyzeStore.getState().importResponse(...)`.
 * Keeping this layer store-free makes it independently testable.
 *
 * Parse errors propagate to the caller (the CL-5b UI will surface them).
 */

import {
  parseJsonResponse,
  parseMarkdownResponse,
  type ParsedResponse,
} from '@variscout/core/consultations';
import type { Consultation } from '@variscout/core/consultations';

/**
 * Read a response file and parse it into a `ParsedResponse`.
 *
 * Routing rule:
 *   - filename ends with `.json` → `parseJsonResponse`
 *   - all other extensions     → `parseMarkdownResponse`
 *
 * @throws {Error} when the file content cannot be parsed (parse errors propagate).
 */
export async function importConsultationResponseFile(
  file: { name: string; text(): Promise<string> },
  consultation: Consultation
): Promise<ParsedResponse> {
  const raw = await file.text();
  if (file.name.endsWith('.json')) {
    return parseJsonResponse(raw, consultation);
  }
  return parseMarkdownResponse(raw, consultation);
}
