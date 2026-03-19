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
  it('defaults to system mode when no stored value', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.theme.mode).toBe('system');
    // matchMediaMatches is false (light preference), so resolvedTheme = light
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('defaults to system mode and resolves dark when system prefers dark', () => {
    matchMediaMatches = true;
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.theme.mode).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('resolvedTheme follows system preference when themingEnabled is false', () => {
    // System prefers light (matchMediaMatches = false)
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'dark' }));

    const { result } = renderHook(() => useThemeState({ themingEnabled: false }));

    // Stored mode is 'dark' but when theming is disabled, system preference wins
    expect(result.current.theme.mode).toBe('dark');
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('resolvedTheme follows system dark preference when themingEnabled is false', () => {
    matchMediaMatches = true;
    const { result } = renderHook(() => useThemeState({ themingEnabled: false }));

    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('setTheme persists to localStorage', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    act(() => {
      result.current.setTheme({ mode: 'light' });
    });

    const stored = JSON.parse(localStorage.getItem('variscout_theme')!);
    expect(stored.mode).toBe('light');
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

    // Default system mode with light system preference
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
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

  it('preserves existing user choice from localStorage', () => {
    // User who previously chose dark explicitly should still get dark
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'dark' }));

    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    expect(result.current.theme.mode).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });
});
