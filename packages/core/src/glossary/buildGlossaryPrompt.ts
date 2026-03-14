/**
 * Build a glossary prompt fragment for AI context grounding.
 *
 * Serializes relevant glossary terms into a compact text block
 * that can be injected into AI prompts to ensure correct terminology.
 */

import type { GlossaryCategory } from './types';
import { getTermsByCategory, glossaryTerms } from './terms';

/**
 * Build a glossary prompt fragment containing definitions for the given categories.
 * If no categories specified, includes all terms.
 *
 * @param categories - Optional list of categories to include
 * @param maxTerms - Maximum number of terms to include (default: 40)
 * @returns A formatted text block with term definitions
 */
export function buildGlossaryPrompt(categories?: GlossaryCategory[], maxTerms = 40): string {
  const terms = categories ? categories.flatMap(cat => getTermsByCategory(cat)) : glossaryTerms;

  const selected = terms.slice(0, maxTerms);

  if (selected.length === 0) return '';

  const lines = selected.map(t => `- **${t.label}**: ${t.definition}`);

  return `## Terminology\n\n${lines.join('\n')}`;
}
