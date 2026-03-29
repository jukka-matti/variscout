import { useState, useEffect, useCallback, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

/** Display density presets */
export type DensityPreset = 'S' | 'M' | 'L' | 'XL';

/** Configuration for each density preset */
export const DENSITY_CONFIG: Record<
  DensityPreset,
  {
    rootFontSize: number;
    scale: number;
    lineHeight: number;
  }
> = {
  S: { rootFontSize: 14, scale: 0.875, lineHeight: 1.35 },
  M: { rootFontSize: 16, scale: 1.0, lineHeight: 1.5 },
  L: { rootFontSize: 18, scale: 1.125, lineHeight: 1.5 },
  XL: { rootFontSize: 21, scale: 1.3125, lineHeight: 1.6 },
};

export interface ThemeConfig {
  mode: ThemeMode;
  density?: DensityPreset;
}

export interface UseThemeStateOptions {
  /** Whether theming features (theme switching) are enabled */
  themingEnabled: boolean;
}

export interface UseThemeStateReturn {
  theme: ThemeConfig;
  resolvedTheme: 'light' | 'dark';
  isThemingEnabled: boolean;
  density: DensityPreset;
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
 * Manages theme config, system preference detection, and document attribute application.
 * The `themingEnabled` option controls whether theme switching is active
 * (false in free PWA, true in Azure).
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- subscribing to matchMedia change events
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

  // Resolve density preset
  const density = theme.density ?? 'M';

  // Apply theme and density to document
  useEffect(() => {
    const root = document.documentElement;
    const config = DENSITY_CONFIG[density];

    root.setAttribute('data-theme', resolvedTheme);
    root.style.fontSize = config.rootFontSize + 'px';
    root.style.setProperty('--density-line-height', String(config.lineHeight));
  }, [resolvedTheme, density]);

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
      density,
      setTheme,
    }),
    [theme, resolvedTheme, themingEnabled, density, setTheme]
  );
}
