import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useLicenseStatus } from '../hooks/useLicenseStatus';

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
  companyAccent?: string; // hex color for company branding
  chartFontScale?: ChartFontScale; // chart text size preset
}

interface ThemeContextType {
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Resolved theme after system preference evaluation */
  resolvedTheme: 'light' | 'dark';
  /** Whether theming features are enabled (Licensed edition only) */
  isThemingEnabled: boolean;
  /** Current chart font scale multiplier */
  chartFontScaleValue: number;
  /** Update theme configuration */
  setTheme: (config: Partial<ThemeConfig>) => void;
}

const THEME_STORAGE_KEY = 'variscout_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Load theme from localStorage
 */
function loadStoredTheme(): ThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { mode: 'dark' }; // Default to dark
}

/**
 * Save theme to localStorage
 */
function saveTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Ignore storage errors
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider component
 * Manages theme state and applies theme to document
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(loadStoredTheme);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('dark');

  // Check if theming is enabled (requires PWA + valid license)
  const { canUseLicensedFeatures } = useLicenseStatus();
  const themingEnabled = canUseLicensedFeatures;

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
    // If theming is not enabled, always return dark
    if (!themingEnabled) {
      return 'dark';
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

    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', resolvedTheme);

    // Set data-chart-scale attribute for chart font scaling
    root.setAttribute('data-chart-scale', String(chartFontScaleValue));

    // Apply company accent color if set
    if (themingEnabled && theme.companyAccent) {
      // Convert hex to RGB for CSS variable
      const hex = theme.companyAccent.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--accent', `${r} ${g} ${b}`);
    } else {
      // Reset to default accent
      root.style.removeProperty('--accent');
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

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isThemingEnabled: themingEnabled,
      chartFontScaleValue,
      setTheme,
    }),
    [theme, resolvedTheme, themingEnabled, chartFontScaleValue, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
