/**
 * useWallLocale — read the document's current locale attribute.
 *
 * Wall components render inside SVG and don't need the full chart-theme
 * machinery, so they use this focused helper. Falls back to 'en' when the
 * attribute is missing or holds an unsupported value.
 *
 * Two surfaces:
 * - `useWallLocale()` is a React hook that re-renders when `data-locale`
 *   changes on `documentElement` (matches `useChartTheme`'s MutationObserver
 *   pattern). Prefer this inside Wall components so locale toggles mid-session
 *   take effect immediately.
 * - `getDocumentLocale()` stays exported for non-React call sites (utility
 *   helpers, tests). Do not use it in render paths — the hook is what makes
 *   locale switches reactive.
 */

import { useEffect, useState } from 'react';
import type { Locale } from '@variscout/core';
import { LOCALES } from '@variscout/core/i18n';

/**
 * Return the current locale from `document.documentElement[data-locale]`.
 * Non-reactive — suitable for one-shot reads outside React render paths.
 */
export function getDocumentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale && (LOCALES as readonly string[]).includes(locale)) {
    return locale as Locale;
  }
  return 'en';
}

/**
 * Reactive counterpart to `getDocumentLocale`. Subscribes to `data-locale`
 * mutations on the document element and re-renders on change.
 */
export function useWallLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(getDocumentLocale);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- subscribing to DOM MutationObserver for attribute changes
    setLocale(getDocumentLocale());

    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => setLocale(getDocumentLocale()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-locale'],
    });
    return () => observer.disconnect();
  }, []);

  return locale;
}
