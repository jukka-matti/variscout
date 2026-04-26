/**
 * Locale-aware formatting utilities
 *
 * Wraps native Intl APIs to replace .toFixed() across the codebase.
 * Zero bundle cost — Intl is built into all modern browsers.
 */

import type { Locale } from './types';

/** BCP 47 locale tags for Intl APIs */
const BCP47: Record<Locale, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fi: 'fi-FI',
  fr: 'fr-FR',
  pt: 'pt-PT',
  ja: 'ja-JP',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  ko: 'ko-KR',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
  sv: 'sv-SE',
  da: 'da-DK',
  nb: 'nb-NO',
  cs: 'cs-CZ',
  hu: 'hu-HU',
  ro: 'ro-RO',
  uk: 'uk-UA',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  ms: 'ms-MY',
  ar: 'ar-SA',
  he: 'he-IL',
  hi: 'hi-IN',
  el: 'el-GR',
  bg: 'bg-BG',
  hr: 'hr-HR',
  sk: 'sk-SK',
};

// Cache formatters per locale+decimals to avoid re-creation
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const percentFormatCache = new Map<string, Intl.NumberFormat>();
const dateFormatCache = new Map<string, Intl.DateTimeFormat>();

function getNumberFormatter(locale: Locale, decimals: number): Intl.NumberFormat {
  const key = `${locale}:${decimals}`;
  let fmt = numberFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(BCP47[locale], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatCache.set(key, fmt);
  }
  return fmt;
}

function getPercentFormatter(locale: Locale, decimals: number): Intl.NumberFormat {
  const key = `${locale}:${decimals}`;
  let fmt = percentFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(BCP47[locale], {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    percentFormatCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a statistical value (Cpk, Cp, σ, mean, etc.) with locale-correct decimal separator.
 *
 * Replaces `.toFixed()` — returns "1,33" for German, "1.33" for English.
 *
 * @param value - The numeric value to format
 * @param locale - Target locale (defaults to 'en')
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns Formatted string suitable for display and SVG <text> elements
 */
export function formatStatistic(
  value: number,
  locale: Locale = 'en',
  decimals: number = 2
): string {
  if (!isFinite(value)) return '—';
  return getNumberFormatter(locale, decimals).format(value);
}

/**
 * Format a percentage value with locale-correct formatting.
 *
 * @param value - The fractional value (0.0 to 1.0)
 * @param locale - Target locale (defaults to 'en')
 * @param decimals - Number of decimal places (defaults to 1)
 * @returns Formatted percentage string (e.g., "95.5%" or "95,5 %")
 */
export function formatPercent(value: number, locale: Locale = 'en', decimals: number = 1): string {
  if (!isFinite(value)) return '—';
  return getPercentFormatter(locale, decimals).format(value);
}

/**
 * Format a date with locale-correct formatting.
 *
 * @param date - Date to format
 * @param locale - Target locale (defaults to 'en')
 * @param style - 'short' (12/31/24), 'medium' (Dec 31, 2024), or 'long' (December 31, 2024)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  locale: Locale = 'en',
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const key = `${locale}:${style}`;
  let fmt = dateFormatCache.get(key);
  if (!fmt) {
    const options: Intl.DateTimeFormatOptions = {
      short: { year: '2-digit', month: 'numeric', day: 'numeric' } as const,
      medium: { year: 'numeric', month: 'short', day: 'numeric' } as const,
      long: { year: 'numeric', month: 'long', day: 'numeric' } as const,
    }[style];
    fmt = new Intl.DateTimeFormat(BCP47[locale], options);
    dateFormatCache.set(key, fmt);
  }
  return fmt.format(date);
}

/**
 * Format an integer (no decimal places) with locale-correct thousands separator.
 *
 * @param value - The integer to format
 * @param locale - Target locale (defaults to 'en')
 * @returns Formatted string (e.g., "1,234" for English, "1.234" for German)
 */
export function formatInteger(value: number, locale: Locale = 'en'): string {
  if (!isFinite(value)) return '—';
  return getNumberFormatter(locale, 0).format(Math.round(value));
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function getPluralRules(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(BCP47[locale]);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * Pick the locale-correct plural form via Intl.PluralRules.
 *
 * Use to avoid hand-rolled English-only pluralization (e.g. `count + ' investigation' + (count === 1 ? '' : 's')`).
 *
 * @param count - The count driving the plural choice
 * @param forms - Map of LDML plural categories to strings; `other` is required as a fallback
 * @param locale - Target locale (defaults to 'en')
 * @returns The form matching the locale's plural rule for `count`, or `forms.other` if the matched category is missing
 */
export function formatPlural(count: number, forms: PluralForms, locale: Locale = 'en'): string {
  const category = getPluralRules(locale).select(Math.abs(count));
  return forms[category] ?? forms.other;
}
