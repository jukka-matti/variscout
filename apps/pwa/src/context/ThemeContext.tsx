import React, { createContext, useContext, type ReactNode } from 'react';
import { useThemeState, type UseThemeStateReturn } from '@variscout/hooks';

export type { ThemeMode, ChartFontScale, ThemeConfig } from '@variscout/hooks';
export { CHART_FONT_SCALES } from '@variscout/hooks';

const ThemeContext = createContext<UseThemeStateReturn | undefined>(undefined);

/**
 * Hook to access theme context
 */
export function useTheme(): UseThemeStateReturn {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * PWA Theme provider — theming disabled (free tier, always dark)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const value = useThemeState({ themingEnabled: false });
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
