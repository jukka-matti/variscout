import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocaleState } from '../useLocaleState';
import { registerLocaleLoaders } from '@variscout/core/i18n';
import type { MessageCatalog } from '@variscout/core';

// Register Vite-based locale loaders for tests
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../../../core/src/i18n/messages/*.ts', {
    eager: false,
  })
);

describe('useLocaleState', () => {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-locale');
    document.documentElement.removeAttribute('lang');
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
  });

  it('defaults to browser locale when no stored value', () => {
    // navigator.language is 'en-US' in test environment
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));
    expect(result.current.locale).toBe('en');
  });

  it('reads stored locale from localStorage', () => {
    localStorage.setItem('variscout_locale', 'de');
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));
    expect(result.current.locale).toBe('de');
  });

  it('sets data-locale attribute on document element', async () => {
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));
    // preloadLocale resolves async, then sets DOM attribute
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-locale')).toBe(result.current.locale);
    });
  });

  it('sets lang attribute on document element', async () => {
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));
    await waitFor(() => {
      expect(document.documentElement.lang).toBe(result.current.locale);
    });
  });

  it('persists locale change to localStorage', () => {
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));

    act(() => {
      result.current.setLocale('fr');
    });

    expect(result.current.locale).toBe('fr');
    expect(localStorage.getItem('variscout_locale')).toBe('fr');
  });

  it('updates DOM attributes when locale changes', async () => {
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));

    act(() => {
      result.current.setLocale('de');
    });

    // preloadLocale resolves async, then sets DOM attribute
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-locale')).toBe('de');
      expect(document.documentElement.lang).toBe('de');
    });
  });

  it('exposes localeEnabled flag', () => {
    const { result: enabled } = renderHook(() => useLocaleState({ localeEnabled: true }));
    expect(enabled.current.isLocaleEnabled).toBe(true);

    const { result: disabled } = renderHook(() => useLocaleState({ localeEnabled: false }));
    expect(disabled.current.isLocaleEnabled).toBe(false);
  });

  it('ignores invalid stored locale values', () => {
    localStorage.setItem('variscout_locale', 'invalid');
    const { result } = renderHook(() => useLocaleState({ localeEnabled: true }));
    // Should fall back to browser detection
    expect(result.current.locale).toBe('en');
  });
});
