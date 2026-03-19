/**
 * Glossary module exports
 */

// Types
export type {
  GlossaryTerm,
  GlossaryCategory,
  GlossaryLocale,
  ConceptCategory,
  KnowledgeRelation,
  Concept,
  KnowledgeEntry,
} from './types';
export { isConcept, isGlossaryTerm } from './types';

// Terms (vocabulary)
export { glossaryTerms, glossaryMap, getTerm, getTermsByCategory, hasTerm } from './terms';

// Concepts (methodology)
export { concepts, conceptMap, getConcept } from './concepts';

// Unified knowledge lookup
export { allKnowledge, getEntry, hasEntry, getRelated, getReferencedBy } from './knowledge';

// Prompt builder
export { buildGlossaryPrompt } from './buildGlossaryPrompt';

// Locale exports
export { deGlossary } from './locales/de';
export { esGlossary } from './locales/es';
export { fiGlossary } from './locales/fi';
export { frGlossary } from './locales/fr';
export { ptGlossary } from './locales/pt';

import type { Locale } from '../i18n/types';
import type { GlossaryTerm, GlossaryLocale } from './types';
import { getTerm } from './terms';
import { deGlossary } from './locales/de';
import { esGlossary } from './locales/es';
import { fiGlossary } from './locales/fi';
import { frGlossary } from './locales/fr';
import { ptGlossary } from './locales/pt';

/**
 * Map of supported locales
 */
const localeMap: Partial<Record<Locale, GlossaryLocale>> = {
  de: deGlossary,
  es: esGlossary,
  fi: fiGlossary,
  fr: frGlossary,
  pt: ptGlossary,
};

/**
 * Get a glossary term with optional localization
 *
 * @param termId - The term ID to look up
 * @param locale - Optional locale code (de, es, fr, pt). Defaults to English.
 * @returns The term with localized label/definition/description if available
 *
 * @example
 * const term = getLocalizedTerm('cpk', 'de');
 * // Returns Cpk with German definition
 */
export function getLocalizedTerm(termId: string, locale?: Locale): GlossaryTerm | undefined {
  const baseTerm = getTerm(termId);
  if (!baseTerm) return undefined;

  // If no locale or English, return base term
  if (!locale || locale === 'en') {
    return baseTerm;
  }

  // Get locale data
  const localeData = localeMap[locale];
  if (!localeData) {
    return baseTerm;
  }

  // Get localized term data
  const localizedData = localeData.terms[termId];
  if (!localizedData) {
    return baseTerm;
  }

  // Merge localized data with base term
  return {
    ...baseTerm,
    label: localizedData.label,
    definition: localizedData.definition,
    description: localizedData.description || baseTerm.description,
  };
}

/**
 * Get all available locale codes
 */
export function getAvailableLocales(): string[] {
  return ['en', ...Object.keys(localeMap)];
}
