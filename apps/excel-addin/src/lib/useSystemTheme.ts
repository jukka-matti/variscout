/**
 * useSystemTheme Hook
 *
 * Detects system theme preference (prefers-color-scheme) and provides
 * the appropriate theme tokens for the Content Add-in.
 *
 * Sets `data-theme` attribute on document root for @variscout/charts compatibility.
 */

import { useState, useEffect, useMemo } from 'react';
import { darkTheme, type ThemeTokens } from './darkTheme';
import { lightTheme } from './lightTheme';

/** Re-export ThemeTokens for consumers */
export type { ThemeTokens };

export interface UseSystemThemeResult {
  /** Whether the current theme is dark */
  isDark: boolean;
  /** The active theme tokens */
  theme: ThemeTokens;
}

/**
 * Detects system theme preference and returns appropriate theme tokens.
 * Automatically updates when the user changes their OS theme.
 */
export function useSystemTheme(): UseSystemThemeResult {
  // Initialize from current system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true; // SSR fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Update document attribute for chart package compatibility
  useEffect(() => {
    const themeValue = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeValue);
  }, [isDark]);

  // Memoize theme object to prevent unnecessary re-renders
  const theme = useMemo<ThemeTokens>(() => (isDark ? darkTheme : lightTheme), [isDark]);

  return { isDark, theme };
}
