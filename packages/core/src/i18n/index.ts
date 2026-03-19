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
import { fi } from './messages/fi';
import { fr } from './messages/fr';
import { pt } from './messages/pt';
import { ja } from './messages/ja';
import { zhHans } from './messages/zhHans';
import { zhHant } from './messages/zhHant';
import { ko } from './messages/ko';
import { it } from './messages/it';
import { nl } from './messages/nl';
import { pl } from './messages/pl';
import { ru } from './messages/ru';
import { tr } from './messages/tr';
import { sv } from './messages/sv';
import { da } from './messages/da';
import { nb } from './messages/nb';
import { cs } from './messages/cs';
import { hu } from './messages/hu';
import { ro } from './messages/ro';
import { uk } from './messages/uk';
import { th } from './messages/th';
import { vi } from './messages/vi';
import { id } from './messages/id';
import { ms } from './messages/ms';
import { ar } from './messages/ar';
import { he } from './messages/he';
import { hi } from './messages/hi';
import { el } from './messages/el';
import { bg } from './messages/bg';
import { hr } from './messages/hr';
import { sk } from './messages/sk';

/** All message catalogs keyed by locale */
const catalogs: Record<Locale, MessageCatalog> = {
  en,
  de,
  es,
  fi,
  fr,
  pt,
  ja,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  ko,
  it,
  nl,
  pl,
  ru,
  tr,
  sv,
  da,
  nb,
  cs,
  hu,
  ro,
  uk,
  th,
  vi,
  id,
  ms,
  ar,
  he,
  hi,
  el,
  bg,
  hr,
  sk,
};

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
 * Get a translated message with parameter interpolation.
 * Replaces `{param}` placeholders with provided values.
 * Falls back to English if the key is missing in the target locale.
 *
 * @example
 * ```ts
 * formatMessage('en', 'data.rowsLoaded', { count: 150 })
 * // => "150 rows loaded"
 * ```
 */
export function formatMessage(
  locale: Locale,
  key: keyof MessageCatalog,
  params?: Record<string, string | number>
): string {
  let msg = catalogs[locale]?.[key] ?? catalogs.en[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replaceAll(`{${k}}`, String(v));
    }
  }
  return msg;
}

/**
 * Detect the best matching locale from a browser language string.
 * Falls back to 'en' if no match.
 *
 * @param browserLang - navigator.language value (e.g., "de-AT", "fr", "pt-BR")
 */
export function detectLocale(browserLang: string): Locale {
  const lang = browserLang.toLowerCase();

  // Exact match (e.g., "en", "de", "zh-hans")
  if (lang in catalogs) return lang as Locale;

  // Hyphenated script variants (e.g., "zh-hans-cn" → "zh-Hans", "zh-hant-tw" → "zh-Hant")
  if (lang.startsWith('zh-hant') || lang.startsWith('zh-tw')) return 'zh-Hant';
  if (lang.startsWith('zh')) return 'zh-Hans';

  // Norwegian: "no" → "nb"
  if (lang === 'no' || lang.startsWith('no-')) return 'nb';

  // Prefix match (e.g., "de-AT" → "de", "pt-BR" → "pt")
  const prefix = lang.split('-')[0];
  if (prefix in catalogs) return prefix as Locale;

  return 'en';
}
