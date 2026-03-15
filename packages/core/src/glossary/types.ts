/**
 * Glossary types for the systemic help tooltip system
 */

export type GlossaryCategory =
  | 'control-limits'
  | 'capability'
  | 'statistics'
  | 'charts'
  | 'methodology'
  | 'investigation';

export interface GlossaryTerm {
  /** Unique identifier for the term (e.g., 'cp', 'ucl', 'pValue') */
  id: string;
  /** Display label (e.g., 'Cp', 'UCL', 'p-value') */
  label: string;
  /** Short definition for tooltip display (50-100 chars) */
  definition: string;
  /** Extended explanation (optional, for expanded views) */
  description?: string;
  /** Category for grouping terms */
  category: GlossaryCategory;
  /** Path to learn more content (e.g., '/learn/two-voices') */
  learnMorePath?: string;
  /** IDs of related terms */
  relatedTerms?: string[];
}

export interface GlossaryLocale {
  locale: string;
  terms: Record<string, Omit<GlossaryTerm, 'id' | 'category' | 'learnMorePath' | 'relatedTerms'>>;
}

// ============================================================================
// Knowledge Model — Concepts (methodology, phases, principles)
// ============================================================================

/** Category for methodology concepts */
export type ConceptCategory = 'framework' | 'phase' | 'principle';

/** Typed relationship between knowledge entries */
export interface KnowledgeRelation {
  /** ID of the target term or concept */
  targetId: string;
  /** Relationship type */
  type: 'uses' | 'leads-to' | 'contains' | 'contrasts';
}

/**
 * A methodology concept — frameworks, phases, and principles
 * that define how VariScout approaches variation analysis.
 */
export interface Concept {
  /** Unique identifier (e.g., 'fourLenses', 'phaseInitial') */
  id: string;
  /** Display label (e.g., 'Four Lenses') */
  label: string;
  /** Short definition (50-100 chars) */
  definition: string;
  /** Extended explanation */
  description?: string;
  /** Concept category — disambiguates from GlossaryTerm.category in union */
  conceptCategory: ConceptCategory;
  /** Path to learn more content */
  learnMorePath?: string;
  /** Typed relationships to other terms and concepts */
  relations: KnowledgeRelation[];
}

/** Unified knowledge entry — either a vocabulary term or a methodology concept */
export type KnowledgeEntry = GlossaryTerm | Concept;

/** Type guard: is this a Concept (has conceptCategory)? */
export function isConcept(entry: KnowledgeEntry): entry is Concept {
  return 'conceptCategory' in entry;
}

/** Type guard: is this a GlossaryTerm (has category)? */
export function isGlossaryTerm(entry: KnowledgeEntry): entry is GlossaryTerm {
  return 'category' in entry && !('conceptCategory' in entry);
}
