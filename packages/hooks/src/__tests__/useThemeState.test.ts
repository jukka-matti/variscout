/**
 * Tests for useThemeState hook
 *
 * Validates theme persistence, system preference detection,
 * document attribute application, and chart font scale values.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeState, CHART_FONT_SCALES } from '../useThemeState';

// Mock matchMedia to control system preference
let matchMediaMatches = false;
let matchMediaListeners: Array<(e: { matches: boolean }) => void> = [];

beforeEach(() => {
  localStorage.clear();
  matchMediaMatches = false;
  matchMediaListeners = [];

  // Reset document attributes
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-chart-scale');
  document.documentElement.style.removeProperty('--accent');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matchMediaMatches,
      media: query,
      addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
        matchMediaListeners.push(handler);
      },
      removeEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
        matchMediaListeners = matchMediaListeners.filter(h => h !== handler);
      },
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('useThemeState', () => {
  it('defaults to dark theme when no stored value', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.theme.mode).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('resolvedTheme is dark when themingEnabled is false regardless of mode', () => {
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'light' }));

    const { result } = renderHook(() => useThemeState({ themingEnabled: false }));

    // Even though stored mode is 'light', resolved should be 'dark' when theming is disabled
    expect(result.current.theme.mode).toBe('light');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('setTheme persists to localStorage', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    act(() => {
      result.current.setTheme({ mode: 'light', companyAccent: '#ff5500' });
    });

    const stored = JSON.parse(localStorage.getItem('variscout_theme')!);
    expect(stored.mode).toBe('light');
    expect(stored.companyAccent).toBe('#ff5500');
  });

  it('chartFontScaleValue returns correct values for each preset', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    // Default (no chartFontScale set) should be 'normal' = 1.0
    expect(result.current.chartFontScaleValue).toBe(CHART_FONT_SCALES.normal);

    act(() => {
      result.current.setTheme({ chartFontScale: 'compact' });
    });
    expect(result.current.chartFontScaleValue).toBe(CHART_FONT_SCALES.compact);
    expect(result.current.chartFontScaleValue).toBe(0.85);

    act(() => {
      result.current.setTheme({ chartFontScale: 'large' });
    });
    expect(result.current.chartFontScaleValue).toBe(CHART_FONT_SCALES.large);
    expect(result.current.chartFontScaleValue).toBe(1.15);
  });

  it('sets data-theme attribute on document.documentElement', () => {
    renderHook(() => useThemeState({ themingEnabled: true }));

    // Default dark mode
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-chart-scale attribute on document.documentElement', () => {
    localStorage.setItem(
      'variscout_theme',
      JSON.stringify({ mode: 'dark', chartFontScale: 'large' })
    );

    renderHook(() => useThemeState({ themingEnabled: true }));

    expect(document.documentElement.getAttribute('data-chart-scale')).toBe('1.15');
  });

  it('resolves to light when mode is light and themingEnabled is true', () => {
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'light' }));

    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('resolves to dark when mode is dark and themingEnabled is true', () => {
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'dark' }));

    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
