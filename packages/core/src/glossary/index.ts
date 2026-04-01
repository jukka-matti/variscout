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
export { enGlossary } from './locales/en';
export { arGlossary } from './locales/ar';
export { bgGlossary } from './locales/bg';
export { csGlossary } from './locales/cs';
export { daGlossary } from './locales/da';
export { deGlossary } from './locales/de';
export { elGlossary } from './locales/el';
export { esGlossary } from './locales/es';
export { fiGlossary } from './locales/fi';
export { frGlossary } from './locales/fr';
export { heGlossary } from './locales/he';
export { hiGlossary } from './locales/hi';
export { hrGlossary } from './locales/hr';
export { huGlossary } from './locales/hu';
export { idGlossary } from './locales/id';
export { itGlossary } from './locales/it';
export { jaGlossary } from './locales/ja';
export { koGlossary } from './locales/ko';
export { msGlossary } from './locales/ms';
export { nbGlossary } from './locales/nb';
export { nlGlossary } from './locales/nl';
export { plGlossary } from './locales/pl';
export { ptGlossary } from './locales/pt';
export { roGlossary } from './locales/ro';
export { skGlossary } from './locales/sk';
export { svGlossary } from './locales/sv';
export { thGlossary } from './locales/th';
export { trGlossary } from './locales/tr';
export { ukGlossary } from './locales/uk';
export { viGlossary } from './locales/vi';
export { zhHansGlossary } from './locales/zhHans';
export { zhHantGlossary } from './locales/zhHant';

import type { Locale } from '../i18n/types';
import type { GlossaryTerm, GlossaryLocale } from './types';
import { getTerm } from './terms';
import { enGlossary } from './locales/en';
import { arGlossary } from './locales/ar';
import { bgGlossary } from './locales/bg';
import { csGlossary } from './locales/cs';
import { daGlossary } from './locales/da';
import { deGlossary } from './locales/de';
import { elGlossary } from './locales/el';
import { esGlossary } from './locales/es';
import { fiGlossary } from './locales/fi';
import { frGlossary } from './locales/fr';
import { heGlossary } from './locales/he';
import { hiGlossary } from './locales/hi';
import { hrGlossary } from './locales/hr';
import { huGlossary } from './locales/hu';
import { idGlossary } from './locales/id';
import { itGlossary } from './locales/it';
import { jaGlossary } from './locales/ja';
import { koGlossary } from './locales/ko';
import { msGlossary } from './locales/ms';
import { nbGlossary } from './locales/nb';
import { nlGlossary } from './locales/nl';
import { plGlossary } from './locales/pl';
import { ptGlossary } from './locales/pt';
import { roGlossary } from './locales/ro';
import { skGlossary } from './locales/sk';
import { svGlossary } from './locales/sv';
import { thGlossary } from './locales/th';
import { trGlossary } from './locales/tr';
import { ukGlossary } from './locales/uk';
import { viGlossary } from './locales/vi';
import { zhHansGlossary } from './locales/zhHans';
import { zhHantGlossary } from './locales/zhHant';

/**
 * Map of supported locales
 */
const localeMap: Partial<Record<Locale, GlossaryLocale>> = {
  en: enGlossary,
  ar: arGlossary,
  bg: bgGlossary,
  cs: csGlossary,
  da: daGlossary,
  de: deGlossary,
  el: elGlossary,
  es: esGlossary,
  fi: fiGlossary,
  fr: frGlossary,
  he: heGlossary,
  hi: hiGlossary,
  hr: hrGlossary,
  hu: huGlossary,
  id: idGlossary,
  it: itGlossary,
  ja: jaGlossary,
  ko: koGlossary,
  ms: msGlossary,
  nb: nbGlossary,
  nl: nlGlossary,
  pl: plGlossary,
  pt: ptGlossary,
  ro: roGlossary,
  sk: skGlossary,
  sv: svGlossary,
  th: thGlossary,
  tr: trGlossary,
  uk: ukGlossary,
  vi: viGlossary,
  'zh-Hans': zhHansGlossary,
  'zh-Hant': zhHantGlossary,
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
  return ['en', ...Object.keys(localeMap).filter(k => k !== 'en')];
}
