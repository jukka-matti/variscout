import React, { createContext, useContext, type ReactNode } from 'react';
import { useLocaleState, type UseLocaleStateReturn } from '@variscout/hooks';

const LocaleContext = createContext<UseLocaleStateReturn | undefined>(undefined);

/**
 * Hook to access locale context
 */
export function useLocale(): UseLocaleStateReturn {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * PWA Locale provider — auto-detect only (free tier, no settings UI)
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  const value = useLocaleState({ localeEnabled: false });
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
