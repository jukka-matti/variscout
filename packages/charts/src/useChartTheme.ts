import { useState, useEffect, useMemo } from 'react';
import {
  getChromeColors,
  getDocumentTheme,
  getChartColors,
  type ChromeColorValues,
  type ChartColor,
} from './colors';
import type { Locale, MessageCatalog } from '@variscout/core';
import {
  LOCALES,
  getMessage,
  formatMessage,
  formatStatistic,
  formatPercent,
} from '@variscout/core/i18n';

export interface ChartThemeColors {
  /** Whether dark theme is active */
  isDark: boolean;
  /** Chrome colors for current theme */
  chrome: ChromeColorValues;
  /** Data colors */
  colors: Record<ChartColor, string>;
  /** Current locale for number formatting in charts */
  locale: Locale;
  /** Format a statistic value with locale-correct decimal separator */
  formatStat: (value: number, decimals?: number) => string;
  /** Format a percentage (0.0-1.0) with locale-correct formatting */
  formatPct: (value: number, decimals?: number) => string;
  /** Get a translated message by key */
  t: (key: keyof MessageCatalog) => string;
  /** Get a translated message with parameter interpolation */
  tf: (key: keyof MessageCatalog, params: Record<string, string | number>) => string;
}

/**
 * Get the current chart font scale derived from root font-size.
 * Returns ratio of computed font-size to the 16px baseline.
 */
export function getDocumentFontScale(): number {
  if (typeof document === 'undefined') return 1;
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return isNaN(px) ? 1 : px / 16;
}

/**
 * Get current locale from document attribute
 */
function getDocumentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale && (LOCALES as readonly string[]).includes(locale)) {
    return locale as Locale;
  }
  return 'en';
}

/**
 * Hook to get theme-aware chart colors
 * Automatically updates when theme changes
 */
export function useChartTheme(): ChartThemeColors {
  const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme);
  const [fontScale, setFontScale] = useState<number>(getDocumentFontScale);
  const [locale, setLocale] = useState<Locale>(getDocumentLocale);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- subscribing to DOM MutationObserver for attribute changes
    setTheme(getDocumentTheme());

    setFontScale(getDocumentFontScale());

    setLocale(getDocumentLocale());

    // Watch for theme, font scale (via inline style), and locale changes
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme());
      setFontScale(getDocumentFontScale());
      setLocale(getDocumentLocale());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'data-locale'],
    });

    return () => observer.disconnect();
  }, []);

  // fontScale is tracked as state to trigger re-renders when root font-size changes,
  // but is not returned. Consumers call getDocumentFontScale() directly in render.
  void fontScale;

  return useMemo(
    () => ({
      isDark: theme === 'dark',
      chrome: getChromeColors(theme === 'dark'),
      colors: getChartColors(),
      locale,
      formatStat: (value: number, decimals: number = 2) => formatStatistic(value, locale, decimals),
      formatPct: (value: number, decimals: number = 1) => formatPercent(value, locale, decimals),
      t: (key: keyof MessageCatalog) => getMessage(locale, key),
      tf: (key: keyof MessageCatalog, params: Record<string, string | number>) =>
        formatMessage(locale, key, params),
    }),
    [theme, fontScale, locale]
  );
}
