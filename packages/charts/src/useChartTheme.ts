import { useState, useEffect, useMemo } from 'react';
import { getChromeColors, getDocumentTheme, type ChromeColorValues } from './colors';

export interface ChartThemeColors {
  /** Whether dark theme is active */
  isDark: boolean;
  /** Chrome colors for current theme */
  chrome: ChromeColorValues;
}

/**
 * Hook to get theme-aware chart colors
 * Automatically updates when theme changes
 */
export function useChartTheme(): ChartThemeColors {
  const [theme, setTheme] = useState<'light' | 'dark'>(getDocumentTheme);

  useEffect(() => {
    // Check initial theme
    setTheme(getDocumentTheme());

    // Watch for theme changes via data-theme attribute
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const colors = useMemo(
    () => ({
      isDark: theme === 'dark',
      chrome: getChromeColors(theme === 'dark'),
    }),
    [theme]
  );

  return colors;
}
