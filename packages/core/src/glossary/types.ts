/**
 * Glossary types for the systemic help tooltip system
 */

export type GlossaryCategory =
  | 'control-limits'
  | 'capability'
  | 'statistics'
  | 'charts'
  | 'methodology';

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
