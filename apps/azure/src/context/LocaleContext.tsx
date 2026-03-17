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
 * Azure Locale provider — user-selectable (paid product, settings UI)
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  const value = useLocaleState({ localeEnabled: true });
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
