/**
 * Glossary module exports
 */

export type { GlossaryTerm, GlossaryCategory, GlossaryLocale } from './types';
export { glossaryTerms, glossaryMap, getTerm, getTermsByCategory, hasTerm } from './terms';

// Locale exports
export { deGlossary } from './locales/de';
export { esGlossary } from './locales/es';
export { frGlossary } from './locales/fr';
export { ptGlossary } from './locales/pt';

import type { GlossaryTerm, GlossaryLocale } from './types';
import { getTerm } from './terms';
import { deGlossary } from './locales/de';
import { esGlossary } from './locales/es';
import { frGlossary } from './locales/fr';
import { ptGlossary } from './locales/pt';

/**
 * Map of supported locales
 */
const localeMap: Record<string, GlossaryLocale> = {
  de: deGlossary,
  es: esGlossary,
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
export function getLocalizedTerm(termId: string, locale?: string): GlossaryTerm | undefined {
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
