import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  getChromeColors,
  getChartColors,
  getDocumentTheme,
  chartColors,
  executiveColors,
  chromeColors,
} from '../colors';
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
  it('returns dark chrome colors for dark + technical', () => {
    const result = getChromeColors(true, 'technical');
    expect(result.tooltipBg).toBe(chromeColors.tooltipBg);
  });

  it('returns light chrome colors for light + technical', () => {
    const result = getChromeColors(false, 'technical');
    expect(result.tooltipBg).not.toBe(chromeColors.tooltipBg);
    // Light theme has white tooltip bg
    expect(result.tooltipBg).toBe('#ffffff');
  });

  it('returns executive chrome for executive mode (any theme)', () => {
    const dark = getChromeColors(true, 'executive');
    const light = getChromeColors(false, 'executive');
    // Executive mode always returns the same chrome
    expect(dark).toEqual(light);
  });

  it('dark and light technical produce different palettes', () => {
    const dark = getChromeColors(true, 'technical');
    const light = getChromeColors(false, 'technical');
    expect(dark.labelPrimary).not.toBe(light.labelPrimary);
  });
});

describe('getChartColors', () => {
  it('returns chartColors for technical mode', () => {
    const result = getChartColors('technical');
    expect(result.pass).toBe(chartColors.pass);
    expect(result.mean).toBe(chartColors.mean);
  });

  it('returns executiveColors for executive mode', () => {
    const result = getChartColors('executive');
    expect(result.pass).toBe(executiveColors.pass);
    expect(result.mean).toBe(executiveColors.mean);
  });

  it('technical and executive mean colors differ', () => {
    const tech = getChartColors('technical');
    const exec = getChartColors('executive');
    expect(tech.mean).not.toBe(exec.mean);
  });
});

describe('useChartTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-chart-scale');
    document.documentElement.removeAttribute('data-chart-mode');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-chart-scale');
    document.documentElement.removeAttribute('data-chart-mode');
  });

  it('returns default values (dark theme, technical mode, scale 1)', () => {
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.isDark).toBe(true);
    expect(result.current.mode).toBe('technical');
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

  it('responds to data-chart-mode attribute change', async () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.mode).toBe('technical');

    document.documentElement.setAttribute('data-chart-mode', 'executive');

    await waitFor(() => {
      expect(result.current.mode).toBe('executive');
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
