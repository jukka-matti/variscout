/**
 * Tests for useThemeState hook
 *
 * Validates theme persistence, system preference detection,
 * document attribute application, and density preset values.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeState, DENSITY_CONFIG } from '../useThemeState';

// Mock matchMedia to control system preference
let matchMediaMatches = false;
let matchMediaListeners: Array<(e: { matches: boolean }) => void> = [];

beforeEach(() => {
  localStorage.clear();
  matchMediaMatches = false;
  matchMediaListeners = [];

  // Reset document attributes and styles
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.fontSize = '';
  document.documentElement.style.removeProperty('--density-line-height');

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

  it('density defaults to M and returns correct preset for each value', () => {
    const { result } = renderHook(() => useThemeState({ themingEnabled: true }));

    // Default (no density set) should be 'M'
    expect(result.current.density).toBe('M');

    act(() => {
      result.current.setTheme({ density: 'S' });
    });
    expect(result.current.density).toBe('S');

    act(() => {
      result.current.setTheme({ density: 'XL' });
    });
    expect(result.current.density).toBe('XL');
  });

  it('sets data-theme attribute on document.documentElement', () => {
    renderHook(() => useThemeState({ themingEnabled: true }));

    // Default system mode with light system preference
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets root font size and line height CSS variable from density preset', () => {
    localStorage.setItem('variscout_theme', JSON.stringify({ mode: 'dark', density: 'L' }));

    renderHook(() => useThemeState({ themingEnabled: true }));

    expect(document.documentElement.style.fontSize).toBe(DENSITY_CONFIG.L.rootFontSize + 'px');
    expect(document.documentElement.style.getPropertyValue('--density-line-height')).toBe(
      String(DENSITY_CONFIG.L.lineHeight)
    );
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
