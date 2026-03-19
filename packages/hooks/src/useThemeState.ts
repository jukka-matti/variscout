import { useState, useEffect, useCallback, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

/** Chart font scale presets */
export type ChartFontScale = 'compact' | 'normal' | 'large';

/** Scale values for each preset */
export const CHART_FONT_SCALES: Record<ChartFontScale, number> = {
  compact: 0.85,
  normal: 1.0,
  large: 1.15,
};

export interface ThemeConfig {
  mode: ThemeMode;
  companyAccent?: string;
  chartFontScale?: ChartFontScale;
}

export interface UseThemeStateOptions {
  /** Whether theming features (theme switching, company accent) are enabled */
  themingEnabled: boolean;
}

export interface UseThemeStateReturn {
  theme: ThemeConfig;
  resolvedTheme: 'light' | 'dark';
  isThemingEnabled: boolean;
  chartFontScaleValue: number;
  setTheme: (config: Partial<ThemeConfig>) => void;
}

const THEME_STORAGE_KEY = 'variscout_theme';

function loadStoredTheme(): ThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { mode: 'system' };
}

function saveTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Shared theme state hook for PWA and Azure apps.
 *
 * Manages theme config, system preference detection, document attribute application,
 * and company accent color. The `themingEnabled` option controls whether theme
 * switching is active (false in free PWA, true in Azure).
 */
export function useThemeState({ themingEnabled }: UseThemeStateOptions): UseThemeStateReturn {
  const [theme, setThemeState] = useState<ThemeConfig>(loadStoredTheme);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

  // Detect system color scheme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Resolve the actual theme (handles 'system' mode)
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (!themingEnabled) {
      // When theming toggle is hidden, follow system preference
      return systemPreference;
    }
    if (theme.mode === 'system') {
      return systemPreference;
    }
    return theme.mode;
  }, [theme.mode, systemPreference, themingEnabled]);

  // Calculate chart font scale value
  const chartFontScaleValue = useMemo(() => {
    const preset = theme.chartFontScale ?? 'normal';
    return CHART_FONT_SCALES[preset];
  }, [theme.chartFontScale]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-chart-scale', String(chartFontScaleValue));

    if (themingEnabled && theme.companyAccent) {
      const hex = theme.companyAccent.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--accent', `${r} ${g} ${b}`);
      root.style.setProperty('--accent-hex', theme.companyAccent);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-hex');
    }
  }, [resolvedTheme, theme.companyAccent, themingEnabled, chartFontScaleValue]);

  // Update theme configuration
  const setTheme = useCallback((config: Partial<ThemeConfig>) => {
    setThemeState(prev => {
      const next = { ...prev, ...config };
      saveTheme(next);
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      theme,
      resolvedTheme,
      isThemingEnabled: themingEnabled,
      chartFontScaleValue,
      setTheme,
    }),
    [theme, resolvedTheme, themingEnabled, chartFontScaleValue, setTheme]
  );
}
