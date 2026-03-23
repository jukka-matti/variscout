/**
 * @variscout/core/i18n
 *
 * Internationalization infrastructure for VariScout.
 * Custom lightweight solution using typed message catalogs + native Intl APIs.
 *
 * English is statically bundled (zero-delay fallback).
 * All other locales are lazy-loaded via the app-provided loader function.
 * Apps call registerLocaleLoaders() at startup with their bundler's
 * dynamic import mechanism (e.g., import.meta.glob for Vite).
 */

export type { Locale, MessageCatalog } from './types';
export { LOCALES, LOCALE_NAMES } from './types';

export { formatStatistic, formatPercent, formatDate, formatInteger } from './format';

import type { Locale, MessageCatalog } from './types';
import { LOCALES } from './types';
import { en } from './messages/en';

/** Lazy loader map: file path → () => Promise<module> */
type LocaleLoaderMap = Record<string, () => Promise<Record<string, MessageCatalog>>>;

// Loader map injected by the app at startup (bundler-specific)
let loaders: LocaleLoaderMap = {};

// Mutable registry — starts with English, grows as locales load
const loaded = new Map<string, MessageCatalog>([['en', en]]);

// Set of valid locale strings for fast membership checks (used by detectLocale)
const localeSet = new Set<string>(LOCALES as readonly string[]);

// Filename ↔ locale mapping for zh-Hans/zh-Hant
const LOCALE_TO_FILENAME: Record<string, string> = {
  'zh-Hans': 'zhHans',
  'zh-Hant': 'zhHant',
};

/**
 * Register bundler-specific locale loaders.
 * Call once at app startup before any locale preloading.
 *
 * @example Vite apps:
 * ```ts
 * import { registerLocaleLoaders } from '@variscout/core';
 *
 * registerLocaleLoaders(
 *   import.meta.glob('./node_modules/@variscout/core/src/i18n/messages/*.ts', { eager: false })
 * );
 * ```
 */
export function registerLocaleLoaders(loaderMap: LocaleLoaderMap): void {
  loaders = loaderMap;
}

/**
 * Register a single locale's message catalog directly.
 * Useful for testing or SSR where dynamic imports aren't available.
 */
export function registerLocale(locale: string, messages: MessageCatalog): void {
  loaded.set(locale, messages);
}

/**
 * Preload a locale's message catalog via the registered loader.
 * Returns immediately for English or already-loaded locales.
 * Falls back to English if no loader is registered or the locale file doesn't exist.
 */
export async function preloadLocale(locale: Locale): Promise<MessageCatalog> {
  if (loaded.has(locale)) return loaded.get(locale)!;
  const filename = LOCALE_TO_FILENAME[locale] ?? locale;

  // Try to find the loader by matching the filename in any registered path
  const matchingKey = Object.keys(loaders).find(k => k.endsWith(`/${filename}.ts`));
  if (!matchingKey) return en;

  const mod = await loaders[matchingKey]();
  const catalog = mod[filename] as MessageCatalog;
  loaded.set(locale, catalog);
  return catalog;
}

/**
 * Check whether a locale's catalog has been loaded.
 */
export function isLocaleLoaded(locale: Locale): boolean {
  return loaded.has(locale);
}

/**
 * Get the full message catalog for a locale.
 * Returns English fallback if the locale hasn't been preloaded yet.
 */
export function getMessages(locale: Locale): MessageCatalog {
  return loaded.get(locale) ?? en;
}

/**
 * Get a single translated message by key.
 * Falls back to English if the key is missing in the target locale
 * or if the locale hasn't been preloaded yet.
 */
export function getMessage(locale: Locale, key: keyof MessageCatalog): string {
  return loaded.get(locale)?.[key] ?? en[key];
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
  let msg = loaded.get(locale)?.[key] ?? en[key];
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
  if (localeSet.has(lang)) return lang as Locale;

  // Hyphenated script variants (e.g., "zh-hans-cn" → "zh-Hans", "zh-hant-tw" → "zh-Hant")
  if (lang.startsWith('zh-hant') || lang.startsWith('zh-tw')) return 'zh-Hant';
  if (lang.startsWith('zh')) return 'zh-Hans';

  // Norwegian: "no" → "nb"
  if (lang === 'no' || lang.startsWith('no-')) return 'nb';

  // Prefix match (e.g., "de-AT" → "de", "pt-BR" → "pt")
  const prefix = lang.split('-')[0];
  if (localeSet.has(prefix)) return prefix as Locale;

  return 'en';
}
