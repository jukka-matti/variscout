/**
 * Build a glossary prompt fragment for AI context grounding.
 *
 * Serializes relevant glossary terms into a compact text block
 * that can be injected into AI prompts to ensure correct terminology.
 * Optionally includes methodology concepts for framework awareness.
 */

import type { GlossaryCategory } from './types';
import { getTermsByCategory, glossaryTerms } from './terms';
import { concepts } from './concepts';

export interface GlossaryPromptOptions {
  /** Include methodology concepts (Four Lenses, phases, principles) */
  includeConcepts?: boolean;
}

/**
 * Build a glossary prompt fragment containing definitions for the given categories.
 * If no categories specified, includes all terms.
 *
 * @param categories - Optional list of categories to include
 * @param maxTerms - Maximum number of terms to include (default: 40)
 * @param options - Additional options (e.g., includeConcepts)
 * @returns A formatted text block with term definitions
 */
export function buildGlossaryPrompt(
  categories?: GlossaryCategory[],
  maxTerms = 40,
  options?: GlossaryPromptOptions
): string {
  const terms = categories ? categories.flatMap(cat => getTermsByCategory(cat)) : glossaryTerms;

  const selected = terms.slice(0, maxTerms);

  const parts: string[] = [];

  if (selected.length > 0) {
    const lines = selected.map(t => `- **${t.label}**: ${t.definition}`);
    parts.push(`## Terminology\n\n${lines.join('\n')}`);
  }

  if (options?.includeConcepts && concepts.length > 0) {
    const conceptLines = concepts.map(c => `- **${c.label}**: ${c.definition}`);
    parts.push(`## Methodology Concepts\n\n${conceptLines.join('\n')}`);
  }

  return parts.join('\n\n');
}
