/**
 * Tests for chart color constants and theme utilities
 */

import { describe, it, expect } from 'vitest';
import { chartColors, chromeColors, operatorColors, getChromeColors } from '../colors';

describe('chartColors', () => {
  it('exports expected semantic colors', () => {
    expect(chartColors.pass).toBe('#22c55e');
    expect(chartColors.fail).toBe('#ef4444');
    expect(chartColors.warning).toBe('#f59e0b');
    expect(chartColors.mean).toBe('#3b82f6');
    expect(chartColors.spec).toBe('#f97316');
  });

  it('exports selection colors', () => {
    expect(chartColors.selected).toBe('#0ea5e9');
    expect(chartColors.selectedBorder).toBe('#0284c7');
  });

  it('exports regression colors', () => {
    expect(chartColors.linear).toBe('#3b82f6');
    expect(chartColors.quadratic).toBe('#8b5cf6');
  });

  it('exports cpPotential color for Cp series', () => {
    expect(chartColors.cpPotential).toBe('#8b5cf6');
  });
});

describe('chromeColors', () => {
  it('exports tooltip colors', () => {
    expect(chromeColors.tooltipBg).toBe('#1e293b');
    expect(chromeColors.tooltipBorder).toBe('#334155');
    expect(chromeColors.tooltipText).toBe('#f1f5f9');
  });

  it('exports label colors', () => {
    expect(chromeColors.labelPrimary).toBe('#cbd5e1');
    expect(chromeColors.labelSecondary).toBe('#94a3b8');
    expect(chromeColors.labelMuted).toBe('#64748b');
  });

  it('exports axis colors', () => {
    expect(chromeColors.axisPrimary).toBe('#94a3b8');
    expect(chromeColors.axisSecondary).toBe('#64748b');
  });
});

describe('operatorColors', () => {
  it('exports 8 colors', () => {
    expect(operatorColors).toHaveLength(8);
  });

  it('contains unique values', () => {
    const unique = new Set(operatorColors);
    expect(unique.size).toBe(8);
  });
});

describe('getChromeColors', () => {
  it('returns dark theme values when isDark is true', () => {
    const colors = getChromeColors(true);
    expect(colors.tooltipBg).toBe('#1e293b');
    expect(colors.gridLine).toBe('#1e293b');
    expect(colors.labelPrimary).toBe('#cbd5e1');
  });

  it('returns light theme values when isDark is false', () => {
    const colors = getChromeColors(false);
    expect(colors.tooltipBg).toBe('#ffffff');
    expect(colors.gridLine).toBe('#f1f5f9');
    expect(colors.labelPrimary).toBe('#334155');
  });

  it('defaults to dark theme when no argument passed', () => {
    const colors = getChromeColors();
    expect(colors).toEqual(getChromeColors(true));
  });

  it('returns all expected keys', () => {
    const dark = getChromeColors(true);
    const light = getChromeColors(false);

    const expectedKeys = [
      'tooltipBg',
      'gridLine',
      'barBackground',
      'tooltipBorder',
      'labelPrimary',
      'labelSecondary',
      'labelMuted',
      'tooltipText',
      'axisPrimary',
      'axisSecondary',
      'whisker',
      'dataLine',
      'stageDivider',
      'pointStroke',
      'boxDefault',
      'boxBorder',
      'ciband',
    ];

    expectedKeys.forEach(key => {
      expect(dark).toHaveProperty(key);
      expect(light).toHaveProperty(key);
    });
  });
});
