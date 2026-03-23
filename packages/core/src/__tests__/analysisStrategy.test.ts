import { describe, it, expect } from 'vitest';
import { resolveMode, getStrategy } from '../analysisStrategy';
import type { ResolvedMode } from '../analysisStrategy';

describe('resolveMode', () => {
  it('returns standard for default state', () => {
    expect(resolveMode('standard')).toBe('standard');
  });

  it('returns capability when standardIChartMetric is capability', () => {
    expect(resolveMode('standard', { standardIChartMetric: 'capability' })).toBe('capability');
  });

  it('returns performance for performance mode', () => {
    expect(resolveMode('performance')).toBe('performance');
  });

  it('returns yamazumi for yamazumi mode', () => {
    expect(resolveMode('yamazumi')).toBe('yamazumi');
  });

  it('ignores standardIChartMetric for non-standard modes', () => {
    expect(resolveMode('performance', { standardIChartMetric: 'capability' })).toBe('performance');
    expect(resolveMode('yamazumi', { standardIChartMetric: 'capability' })).toBe('yamazumi');
  });
});

describe('getStrategy', () => {
  const allModes: ResolvedMode[] = ['standard', 'capability', 'performance', 'yamazumi'];

  it.each(allModes)('returns strategy for %s', mode => {
    const strategy = getStrategy(mode);
    expect(strategy).toBeDefined();
    expect(strategy.chartSlots).toBeDefined();
    expect(strategy.chartSlots.slot1).toBeDefined();
    expect(strategy.chartSlots.slot2).toBeDefined();
    expect(strategy.chartSlots.slot3).toBeDefined();
    expect(strategy.chartSlots.slot4).toBeDefined();
    expect(strategy.kpiComponent).toBe(mode);
    expect(typeof strategy.metricLabel).toBe('function');
  });

  it('standard metricLabel returns Cpk when hasSpecs', () => {
    expect(getStrategy('standard').metricLabel(true)).toBe('Cpk');
  });

  it('standard metricLabel returns σ when no specs', () => {
    expect(getStrategy('standard').metricLabel(false)).toBe('σ');
  });

  it('capability metricLabel returns Mean Cpk', () => {
    expect(getStrategy('capability').metricLabel(true)).toBe('Mean Cpk');
  });

  it('performance metricLabel returns Worst Channel Cpk', () => {
    expect(getStrategy('performance').metricLabel(true)).toBe('Worst Channel Cpk');
  });

  it('yamazumi metricLabel returns VA Ratio', () => {
    expect(getStrategy('yamazumi').metricLabel(true)).toBe('VA Ratio');
  });

  it('yamazumi formatMetricValue formats as percentage', () => {
    const fmt = getStrategy('yamazumi').formatMetricValue;
    expect(fmt).toBeDefined();
    expect(fmt!(0.85)).toBe('85%');
  });
});
