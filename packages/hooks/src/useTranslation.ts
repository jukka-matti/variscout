import { useState, useEffect, useMemo } from 'react';
import type { Locale, MessageCatalog } from '@variscout/core';
import { getMessage, formatStatistic, formatPercent } from '@variscout/core/i18n';

export interface UseTranslationReturn {
  /** Get a translated message by key */
  t: (key: keyof MessageCatalog) => string;
  /** Current locale */
  locale: Locale;
  /** Format a number with locale-correct decimal separator */
  formatNumber: (value: number, decimals?: number) => string;
  /** Format a statistic (Cpk, Cp, etc.) with locale-correct formatting */
  formatStat: (value: number, decimals?: number) => string;
  /** Format a percentage (0.0-1.0) with locale-correct formatting */
  formatPct: (value: number, decimals?: number) => string;
}

/**
 * Get the current locale from the document attribute.
 * Falls back to 'en' if not set.
 */
function getDocumentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale === 'de' || locale === 'es' || locale === 'fr' || locale === 'pt') {
    return locale;
  }
  return 'en';
}

/**
 * Component-level translation hook.
 *
 * Reads locale from the data-locale DOM attribute (set by useLocaleState).
 * No React Context dependency — works anywhere without provider wrapping.
 * Uses MutationObserver to track changes, same pattern as useChartTheme.
 */
export function useTranslation(): UseTranslationReturn {
  const [locale, setLocale] = useState<Locale>(getDocumentLocale);

  useEffect(() => {
    // Sync initial value
    setLocale(getDocumentLocale());

    // Watch for locale changes on document element
    const observer = new MutationObserver(() => {
      setLocale(getDocumentLocale());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-locale'],
    });

    return () => observer.disconnect();
  }, []);

  return useMemo(
    () => ({
      t: (key: keyof MessageCatalog) => getMessage(locale, key),
      locale,
      formatNumber: (value: number, decimals: number = 2) =>
        formatStatistic(value, locale, decimals),
      formatStat: (value: number, decimals: number = 2) => formatStatistic(value, locale, decimals),
      formatPct: (value: number, decimals: number = 1) => formatPercent(value, locale, decimals),
    }),
    [locale]
  );
}
