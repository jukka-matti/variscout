import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getChromeColors, getDocumentTheme, chartColors, chromeColors } from '../colors';
import { useChartTheme, getDocumentFontScale } from '../useChartTheme';

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

describe('getDocumentFontScale', () => {
  afterEach(() => {
    document.documentElement.style.fontSize = '';
  });

  it('returns 1 when no custom font-size is set', () => {
    // jsdom default font-size is 16px
    expect(getDocumentFontScale()).toBe(1);
  });

  it('returns correct scale for larger font-size', () => {
    document.documentElement.style.fontSize = '20px';
    // 20 / 16 = 1.25
    expect(getDocumentFontScale()).toBe(1.25);
  });

  it('returns correct scale for smaller font-size', () => {
    document.documentElement.style.fontSize = '14px';
    // 14 / 16 = 0.875
    expect(getDocumentFontScale()).toBe(0.875);
  });
});

describe('useChartTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.fontSize = '';
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.fontSize = '';
  });

  it('returns default values (dark theme)', () => {
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('responds to data-theme attribute change', async () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.isDark).toBe(true);

    document.documentElement.setAttribute('data-theme', 'light');

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });
  });

  it('returns appropriate chrome and data colors', () => {
    const { result } = renderHook(() => useChartTheme());
    // Dark technical mode
    expect(result.current.chrome.tooltipBg).toBe(chromeColors.tooltipBg);
    expect(result.current.colors.pass).toBe(chartColors.pass);
  });
});
