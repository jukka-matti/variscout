import { useState, useEffect, useMemo } from 'react';
import {
  getChromeColors,
  getDocumentTheme,
  getChartColors,
  type ChromeColorValues,
  type ChartColor,
} from './colors';

export interface ChartThemeColors {
  /** Whether dark theme is active */
  isDark: boolean;
  /** Current chart mode */
  mode: 'technical' | 'executive';
  /** Chrome colors for current theme */
  chrome: ChromeColorValues;
  /** Data colors for current theme/mode */
  colors: Record<ChartColor, string>;
  /** Font scale multiplier (from data-chart-scale attribute) */
  fontScale: number;
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
 * Get current chart mode from document attribute
 */
function getDocumentChartMode(): 'technical' | 'executive' {
  if (typeof document === 'undefined') return 'technical';
  const mode = document.documentElement.getAttribute('data-chart-mode');
  return mode === 'executive' ? 'executive' : 'technical';
}

/**
 * Hook to get theme-aware chart colors
 * Automatically updates when theme changes
 */
export function useChartTheme(): ChartThemeColors {
  const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme);
  const [mode, setMode] = useState<'technical' | 'executive'>(getDocumentChartMode);
  const [fontScale, setFontScale] = useState<number>(getDocumentFontScale);

  useEffect(() => {
    // Check initial values
    setTheme(getDocumentTheme());
    setMode(getDocumentChartMode());
    setFontScale(getDocumentFontScale());

    // Watch for theme and font scale changes
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme());
      setMode(getDocumentChartMode());
      setFontScale(getDocumentFontScale());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-chart-scale', 'data-chart-mode'],
    });

    return () => observer.disconnect();
  }, []);

  return useMemo(
    () => ({
      isDark: theme === 'dark',
      mode,
      chrome: getChromeColors(theme === 'dark', mode),
      colors: getChartColors(mode),
      fontScale,
    }),
    [theme, mode, fontScale]
  );
}
