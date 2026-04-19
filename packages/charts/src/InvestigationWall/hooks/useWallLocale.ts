/**
 * useWallLocale — read the document's current locale attribute.
 *
 * Wall components render inside SVG and don't have the full chart-theme
 * machinery, so they use this focused helper. Falls back to 'en' when the
 * attribute is missing or holds an unsupported value.
 */

import type { Locale } from '@variscout/core';
import { LOCALES } from '@variscout/core/i18n';

/**
 * Return the current locale from `document.documentElement[data-locale]`.
 * Matches the pattern used by `useChartTheme` but without the reactive
 * subscription — Wall primitives re-render when props/store change.
 */
export function getDocumentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale && (LOCALES as readonly string[]).includes(locale)) {
    return locale as Locale;
  }
  return 'en';
}
