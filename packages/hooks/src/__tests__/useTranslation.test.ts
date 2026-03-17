import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-locale');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-locale');
  });

  it('returns English strings by default (no data-locale attribute)', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('stats.mean')).toBe('Mean');
    expect(result.current.locale).toBe('en');
  });

  it('returns German strings when data-locale is de', () => {
    document.documentElement.setAttribute('data-locale', 'de');
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('stats.mean')).toBe('Mittelwert');
    expect(result.current.locale).toBe('de');
  });

  it('returns Japanese strings when data-locale is ja', () => {
    document.documentElement.setAttribute('data-locale', 'ja');
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('stats.mean')).toBe('平均');
    expect(result.current.locale).toBe('ja');
  });

  it('falls back to English for unknown locale attribute', () => {
    document.documentElement.setAttribute('data-locale', 'xx');
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('stats.mean')).toBe('Mean');
    expect(result.current.locale).toBe('en');
  });

  it('updates when data-locale attribute changes', async () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.locale).toBe('en');

    // Change locale via DOM attribute (simulates useLocaleState behavior)
    await act(async () => {
      document.documentElement.setAttribute('data-locale', 'fr');
      // MutationObserver fires asynchronously
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.locale).toBe('fr');
    expect(result.current.t('stats.mean')).toBe('Moyenne');
  });

  it('formatNumber uses current locale', () => {
    document.documentElement.setAttribute('data-locale', 'de');
    const { result } = renderHook(() => useTranslation());
    const formatted = result.current.formatNumber(1.33, 2);
    expect(formatted).toBe('1,33');
  });

  it('formatStat uses current locale', () => {
    document.documentElement.setAttribute('data-locale', 'en');
    const { result } = renderHook(() => useTranslation());
    expect(result.current.formatStat(1.33, 2)).toBe('1.33');
  });

  it('formatPct uses current locale', () => {
    document.documentElement.setAttribute('data-locale', 'en');
    const { result } = renderHook(() => useTranslation());
    const formatted = result.current.formatPct(0.955, 1);
    expect(formatted).toBe('95.5%');
  });
});
