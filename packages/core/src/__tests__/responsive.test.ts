import { describe, it, expect } from 'vitest';
import {
  getResponsiveMargins,
  getResponsiveFonts,
  getScaledFonts,
  getResponsiveTickCount,
  getBreakpoints,
} from '../responsive';

describe('getResponsiveMargins', () => {
  describe('mobile (<400)', () => {
    it('returns reduced margins for ichart', () => {
      const margins = getResponsiveMargins(350, 'ichart');
      expect(margins.top).toBeLessThanOrEqual(20);
      expect(margins.left).toBeGreaterThanOrEqual(35);
    });

    it('returns reduced margins for boxplot', () => {
      const margins = getResponsiveMargins(300, 'boxplot');
      expect(margins.top).toBeLessThanOrEqual(20);
    });
  });

  describe('tablet (400–768)', () => {
    it('returns scaled margins', () => {
      const margins = getResponsiveMargins(500, 'ichart');
      // Tablet margins should be between mobile and desktop
      expect(margins.top).toBeGreaterThan(15);
      expect(margins.top).toBeLessThan(40);
    });

    it('scales right margin for ichart', () => {
      const margins = getResponsiveMargins(600, 'ichart');
      // ichart base right is 85, tablet is ~0.7x = ~60
      expect(margins.right).toBeCloseTo(60, -1);
    });
  });

  describe('desktop (≥768)', () => {
    it('returns base margins for ichart', () => {
      const margins = getResponsiveMargins(800, 'ichart');
      expect(margins).toEqual({ top: 40, right: 85, bottom: 60, left: 70 });
    });

    it('returns base margins for boxplot', () => {
      const margins = getResponsiveMargins(800, 'boxplot');
      expect(margins).toEqual({ top: 20, right: 20, bottom: 60, left: 70 });
    });
  });

  it('adds additionalBottomSpace to bottom only', () => {
    const without = getResponsiveMargins(800, 'ichart', 0);
    const with20 = getResponsiveMargins(800, 'ichart', 20);
    expect(with20.bottom - without.bottom).toBe(20);
    expect(with20.top).toBe(without.top);
    expect(with20.left).toBe(without.left);
    expect(with20.right).toBe(without.right);
  });

  it('ichart has larger right margin than boxplot on desktop', () => {
    const ichart = getResponsiveMargins(800, 'ichart');
    const boxplot = getResponsiveMargins(800, 'boxplot');
    expect(ichart.right).toBeGreaterThan(boxplot.right);
  });

  it('defaults to ichart when no chartType specified', () => {
    const margins = getResponsiveMargins(800);
    expect(margins.right).toBe(85); // ichart base right
  });
});

describe('getResponsiveFonts', () => {
  it('returns mobile fonts for small widths', () => {
    const fonts = getResponsiveFonts(350);
    expect(fonts.tickLabel).toBe(8);
    expect(fonts.axisLabel).toBe(9);
  });

  it('returns tablet fonts for medium widths', () => {
    const fonts = getResponsiveFonts(500);
    expect(fonts.tickLabel).toBe(9);
    expect(fonts.axisLabel).toBe(10);
  });

  it('returns desktop fonts for large widths', () => {
    const fonts = getResponsiveFonts(800);
    expect(fonts.tickLabel).toBe(11);
    expect(fonts.axisLabel).toBe(13);
  });

  it('font sizes increase monotonically from mobile to desktop', () => {
    const mobile = getResponsiveFonts(300);
    const tablet = getResponsiveFonts(500);
    const desktop = getResponsiveFonts(800);

    expect(mobile.tickLabel).toBeLessThan(tablet.tickLabel);
    expect(tablet.tickLabel).toBeLessThan(desktop.tickLabel);
    expect(mobile.axisLabel).toBeLessThan(tablet.axisLabel);
    expect(tablet.axisLabel).toBeLessThan(desktop.axisLabel);
  });
});

describe('getScaledFonts', () => {
  it('returns base fonts when scale = 1', () => {
    const base = getResponsiveFonts(800);
    const scaled = getScaledFonts(800, 1);
    expect(scaled).toEqual(base);
  });

  it('doubles all values at scale = 2', () => {
    const base = getResponsiveFonts(800);
    const scaled = getScaledFonts(800, 2);
    expect(scaled.tickLabel).toBe(Math.round(base.tickLabel * 2));
    expect(scaled.axisLabel).toBe(Math.round(base.axisLabel * 2));
    expect(scaled.statLabel).toBe(Math.round(base.statLabel * 2));
  });

  it('halves all values at scale = 0.5', () => {
    const base = getResponsiveFonts(800);
    const scaled = getScaledFonts(800, 0.5);
    expect(scaled.tickLabel).toBe(Math.round(base.tickLabel * 0.5));
    expect(scaled.axisLabel).toBe(Math.round(base.axisLabel * 0.5));
  });
});

describe('getResponsiveTickCount', () => {
  describe('x-axis', () => {
    it('returns 3 for narrow (<200)', () => {
      expect(getResponsiveTickCount(150, 'x')).toBe(3);
    });

    it('returns 5 for medium (200–400)', () => {
      expect(getResponsiveTickCount(300, 'x')).toBe(5);
    });

    it('returns 7 for wide (400–600)', () => {
      expect(getResponsiveTickCount(500, 'x')).toBe(7);
    });

    it('returns 10 for very wide (≥600)', () => {
      expect(getResponsiveTickCount(800, 'x')).toBe(10);
    });
  });

  describe('y-axis', () => {
    it('returns 3 for short (<150)', () => {
      expect(getResponsiveTickCount(100, 'y')).toBe(3);
    });

    it('returns 5 for medium (150–250)', () => {
      expect(getResponsiveTickCount(200, 'y')).toBe(5);
    });

    it('returns 7 for tall (≥250)', () => {
      expect(getResponsiveTickCount(300, 'y')).toBe(7);
    });
  });

  it('defaults to x-axis', () => {
    expect(getResponsiveTickCount(500)).toBe(7);
  });
});

describe('getBreakpoints', () => {
  it('detects small mobile (< 320)', () => {
    const bp = getBreakpoints(300);
    expect(bp.isSmallMobile).toBe(true);
    expect(bp.isMobile).toBe(true);
    expect(bp.isTablet).toBe(false);
    expect(bp.isDesktop).toBe(false);
  });

  it('detects mobile (320–400)', () => {
    const bp = getBreakpoints(350);
    expect(bp.isSmallMobile).toBe(false);
    expect(bp.isMobile).toBe(true);
    expect(bp.isTablet).toBe(false);
  });

  it('detects tablet (400–768)', () => {
    const bp = getBreakpoints(500);
    expect(bp.isMobile).toBe(false);
    expect(bp.isTablet).toBe(true);
    expect(bp.isDesktop).toBe(false);
  });

  it('detects desktop (≥768)', () => {
    const bp = getBreakpoints(800);
    expect(bp.isMobile).toBe(false);
    expect(bp.isTablet).toBe(false);
    expect(bp.isDesktop).toBe(true);
  });

  it('boundary: 320 is not small mobile', () => {
    expect(getBreakpoints(320).isSmallMobile).toBe(false);
  });

  it('boundary: 400 is tablet, not mobile', () => {
    const bp = getBreakpoints(400);
    expect(bp.isMobile).toBe(false);
    expect(bp.isTablet).toBe(true);
  });

  it('boundary: 768 is desktop, not tablet', () => {
    const bp = getBreakpoints(768);
    expect(bp.isTablet).toBe(false);
    expect(bp.isDesktop).toBe(true);
  });
});
