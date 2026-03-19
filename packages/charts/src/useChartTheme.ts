import { useState, useEffect, useMemo } from 'react';
import {
  getChromeColors,
  getDocumentTheme,
  getChartColors,
  type ChromeColorValues,
  type ChartColor,
} from './colors';
import type { Locale } from '@variscout/core';
import { LOCALES, formatStatistic, formatPercent } from '@variscout/core/i18n';

export interface ChartThemeColors {
  /** Whether dark theme is active */
  isDark: boolean;
  /** Chrome colors for current theme */
  chrome: ChromeColorValues;
  /** Data colors */
  colors: Record<ChartColor, string>;
  /** Font scale multiplier (from data-chart-scale attribute) */
  fontScale: number;
  /** Current locale for number formatting in charts */
  locale: Locale;
  /** Format a statistic value with locale-correct decimal separator */
  formatStat: (value: number, decimals?: number) => string;
  /** Format a percentage (0.0-1.0) with locale-correct formatting */
  formatPct: (value: number, decimals?: number) => string;
}

/**
 * Get the current chart font scale from document attribute
 */
function getDocumentFontScale(): number {
  if (typeof document === 'undefined') return 1;
  const scale = document.documentElement.getAttribute('data-chart-scale');
  if (!scale) return 1;
  const parsed = parseFloat(scale);
  return isNaN(parsed) ? 1 : parsed;
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
    // Check initial values
    setTheme(getDocumentTheme());
    setFontScale(getDocumentFontScale());
    setLocale(getDocumentLocale());

    // Watch for theme, font scale, and locale changes
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme());
      setFontScale(getDocumentFontScale());
      setLocale(getDocumentLocale());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-chart-scale', 'data-locale'],
    });

    return () => observer.disconnect();
  }, []);

  return useMemo(
    () => ({
      isDark: theme === 'dark',
      chrome: getChromeColors(theme === 'dark'),
      colors: getChartColors(),
      fontScale,
      locale,
      formatStat: (value: number, decimals: number = 2) => formatStatistic(value, locale, decimals),
      formatPct: (value: number, decimals: number = 1) => formatPercent(value, locale, decimals),
    }),
    [theme, fontScale, locale]
  );
}
