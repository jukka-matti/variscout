import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale } from '@variscout/core';
import { detectLocale, LOCALES, preloadLocale } from '@variscout/core/i18n';

export interface UseLocaleStateOptions {
  /** Whether locale selection is enabled (false = auto-detect only, true = user-selectable) */
  localeEnabled: boolean;
}

export interface UseLocaleStateReturn {
  locale: Locale;
  isLocaleEnabled: boolean;
  setLocale: (locale: Locale) => void;
}

const LOCALE_STORAGE_KEY = 'variscout_locale';
const RTL_LOCALES = new Set<string>(['ar', 'he']);

function loadStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors
  }
}

function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  return detectLocale(navigator.language);
}

/**
 * Shared locale state hook for PWA and Azure apps.
 *
 * Follows the same pattern as useThemeState:
 * - Stores locale in localStorage
 * - Sets data-locale attribute on document element
 * - Sets document lang attribute
 * - Auto-detects browser locale for initial default
 */
export function useLocaleState({ localeEnabled }: UseLocaleStateOptions): UseLocaleStateReturn {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = loadStoredLocale();
    if (stored) return stored;
    return getBrowserLocale();
  });

  // Preload locale catalog, then apply to document
  useEffect(() => {
    let cancelled = false;
    preloadLocale(locale).then(() => {
      if (!cancelled) {
        const root = document.documentElement;
        root.setAttribute('data-locale', locale);
        root.lang = locale;
        root.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
  }, []);

  return useMemo(
    () => ({
      locale,
      isLocaleEnabled: localeEnabled,
      setLocale,
    }),
    [locale, localeEnabled, setLocale]
  );
}
