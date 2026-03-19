import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getChromeColors, getDocumentTheme, chartColors, chromeColors } from '../colors';
import { useChartTheme } from '../useChartTheme';

describe('getDocumentTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('returns "dark" when data-theme is "dark"', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(getDocumentTheme()).toBe('dark');
  });

  it('returns "light" when data-theme is "light"', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    expect(getDocumentTheme()).toBe('light');
  });

  it('returns "dark" when no data-theme attribute', () => {
    expect(getDocumentTheme()).toBe('dark');
  });
});

describe('getChromeColors', () => {
  it('returns dark chrome colors for dark theme', () => {
    const result = getChromeColors(true);
    expect(result.tooltipBg).toBe(chromeColors.tooltipBg);
  });

  it('returns light chrome colors for light theme', () => {
    const result = getChromeColors(false);
    expect(result.tooltipBg).not.toBe(chromeColors.tooltipBg);
    // Light theme has white tooltip bg
    expect(result.tooltipBg).toBe('#ffffff');
  });

  it('dark and light produce different palettes', () => {
    const dark = getChromeColors(true);
    const light = getChromeColors(false);
    expect(dark.labelPrimary).not.toBe(light.labelPrimary);
  });
});

describe('useChartTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-chart-scale');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-chart-scale');
  });

  it('returns default values (dark theme, scale 1)', () => {
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.isDark).toBe(true);
    expect(result.current.fontScale).toBe(1);
  });

  it('responds to data-theme attribute change', async () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.isDark).toBe(true);

    document.documentElement.setAttribute('data-theme', 'light');

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });
  });

  it('responds to data-chart-scale attribute change', async () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.fontScale).toBe(1);

    document.documentElement.setAttribute('data-chart-scale', '1.5');

    await waitFor(() => {
      expect(result.current.fontScale).toBe(1.5);
    });
  });

  it('returns appropriate chrome and data colors', () => {
    const { result } = renderHook(() => useChartTheme());
    // Dark technical mode
    expect(result.current.chrome.tooltipBg).toBe(chromeColors.tooltipBg);
    expect(result.current.colors.pass).toBe(chartColors.pass);
  });
});
