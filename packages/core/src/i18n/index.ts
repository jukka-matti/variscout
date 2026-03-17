/**
 * @variscout/core/i18n
 *
 * Internationalization infrastructure for VariScout.
 * Custom lightweight solution using typed message catalogs + native Intl APIs.
 */

export type { Locale, MessageCatalog } from './types';
export { LOCALES, LOCALE_NAMES } from './types';

export { formatStatistic, formatPercent, formatDate, formatInteger } from './format';

import type { Locale, MessageCatalog } from './types';
import { en } from './messages/en';
import { de } from './messages/de';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { pt } from './messages/pt';

/** All message catalogs keyed by locale */
const catalogs: Record<Locale, MessageCatalog> = { en, de, es, fr, pt };

/**
 * Get the full message catalog for a locale.
 */
export function getMessages(locale: Locale): MessageCatalog {
  return catalogs[locale];
}

/**
 * Get a single translated message by key.
 * Falls back to English if the key is missing in the target locale.
 */
export function getMessage(locale: Locale, key: keyof MessageCatalog): string {
  return catalogs[locale]?.[key] ?? catalogs.en[key];
}

/**
 * Detect the best matching locale from a browser language string.
 * Falls back to 'en' if no match.
 *
 * @param browserLang - navigator.language value (e.g., "de-AT", "fr", "pt-BR")
 */
export function detectLocale(browserLang: string): Locale {
  const lang = browserLang.toLowerCase();

  // Exact match (e.g., "en", "de")
  if (lang in catalogs) return lang as Locale;

  // Prefix match (e.g., "de-AT" → "de", "pt-BR" → "pt")
  const prefix = lang.split('-')[0];
  if (prefix in catalogs) return prefix as Locale;

  return 'en';
}
