/**
 * Tests for responsive chart hooks:
 *   useResponsiveChartMargins, useResponsiveChartFonts,
 *   useResponsiveTickCount, useResponsiveBreakpoints
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
  useResponsiveBreakpoints,
} from '../useResponsiveChartMargins';

describe('useResponsiveChartMargins', () => {
  it('returns object with top, right, bottom, left', () => {
    const { result } = renderHook(() => useResponsiveChartMargins(800));

    expect(result.current).toHaveProperty('top');
    expect(result.current).toHaveProperty('right');
    expect(result.current).toHaveProperty('bottom');
    expect(result.current).toHaveProperty('left');
    expect(typeof result.current.top).toBe('number');
    expect(typeof result.current.right).toBe('number');
    expect(typeof result.current.bottom).toBe('number');
    expect(typeof result.current.left).toBe('number');
  });

  it('returns different margins for mobile vs desktop widths', () => {
    const { result: mobile } = renderHook(() => useResponsiveChartMargins(350));
    const { result: desktop } = renderHook(() => useResponsiveChartMargins(900));

    // Desktop ichart has right=85; mobile is max(15, 350*0.05)=18
    // They should differ meaningfully
    expect(desktop.current.right).toBeGreaterThan(mobile.current.right);
  });
});

describe('useResponsiveChartFonts', () => {
  it('returns object with font size properties', () => {
    const { result } = renderHook(() => useResponsiveChartFonts(800));

    expect(result.current).toHaveProperty('tickLabel');
    expect(result.current).toHaveProperty('axisLabel');
    expect(result.current).toHaveProperty('statLabel');
    expect(result.current).toHaveProperty('tooltipText');
    expect(result.current).toHaveProperty('brandingText');
    // All values should be positive numbers
    Object.values(result.current).forEach(size => {
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });
  });
});

describe('useResponsiveTickCount', () => {
  it('returns a number', () => {
    const { result } = renderHook(() => useResponsiveTickCount(500));
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThan(0);
  });

  it('larger size gives more ticks', () => {
    const { result: small } = renderHook(() => useResponsiveTickCount(150));
    const { result: large } = renderHook(() => useResponsiveTickCount(700));

    expect(large.current).toBeGreaterThan(small.current);
  });
});

describe('useResponsiveBreakpoints', () => {
  it('returns boolean flags', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints(500));

    expect(typeof result.current.isMobile).toBe('boolean');
    expect(typeof result.current.isTablet).toBe('boolean');
    expect(typeof result.current.isDesktop).toBe('boolean');
    expect(typeof result.current.isSmallMobile).toBe('boolean');
  });

  it('small width triggers isMobile=true', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints(300));

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('large width triggers isDesktop=true', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints(1024));

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isSmallMobile).toBe(false);
  });
});
