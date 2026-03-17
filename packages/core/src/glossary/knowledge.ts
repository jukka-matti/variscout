/**
 * Unified knowledge lookup across glossary terms and methodology concepts.
 *
 * Provides a single API for accessing any knowledge entry (term or concept)
 * and traversing relationships between entries.
 */

import type { KnowledgeEntry } from './types';
import { isConcept } from './types';
import { glossaryTerms, glossaryMap } from './terms';
import { concepts, conceptMap } from './concepts';

/** All knowledge entries — terms + concepts */
export const allKnowledge: readonly KnowledgeEntry[] = [...glossaryTerms, ...concepts];

/** Combined lookup map for O(1) access by ID */
const knowledgeMap = new Map<string, KnowledgeEntry>(allKnowledge.map(e => [e.id, e]));

/** Get any knowledge entry (term or concept) by ID */
export function getEntry(id: string): KnowledgeEntry | undefined {
  return knowledgeMap.get(id);
}

/** Check if an entry exists by ID */
export function hasEntry(id: string): boolean {
  return knowledgeMap.has(id);
}

/**
 * Get entries that this entry relates to (outbound relationships).
 * For GlossaryTerms: uses relatedTerms array.
 * For Concepts: uses typed relations array.
 */
export function getRelated(id: string): KnowledgeEntry[] {
  const entry = knowledgeMap.get(id);
  if (!entry) return [];

  if (isConcept(entry)) {
    return entry.relations
      .map(r => knowledgeMap.get(r.targetId))
      .filter((e): e is KnowledgeEntry => e !== undefined);
  }

  // GlossaryTerm — use relatedTerms
  const term = entry;
  if (!term.relatedTerms) return [];
  return term.relatedTerms
    .map(tid => knowledgeMap.get(tid))
    .filter((e): e is KnowledgeEntry => e !== undefined);
}

/**
 * Get entries that reference this entry (inbound relationships).
 * Searches both concept relations and term relatedTerms.
 */
export function getReferencedBy(id: string): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = [];

  // Check concepts with relations pointing to this ID
  for (const concept of concepts) {
    if (concept.relations.some(r => r.targetId === id)) {
      results.push(concept);
    }
  }

  // Check terms with relatedTerms pointing to this ID
  for (const term of glossaryTerms) {
    if (term.relatedTerms?.includes(id)) {
      results.push(term);
    }
  }

  return results;
}

// Re-export for convenience — consumers can import from knowledge.ts directly
export { glossaryMap, conceptMap };
