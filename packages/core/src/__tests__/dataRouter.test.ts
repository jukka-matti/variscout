import { describe, it, expect } from 'vitest';
import { getStrategy, resolveMode } from '../analysisStrategy';
import type { RouterArgs, ResolvedMode } from '../analysisStrategy';

const baseArgs: RouterArgs = {
  scope: 'b1',
  phase: 'investigation',
  window: { kind: 'cumulative' },
  context: {},
};

describe('AnalysisModeStrategy.dataRouter', () => {
  it('returns useFilteredData for standard mode in investigation phase', () => {
    const strategy = getStrategy(resolveMode('standard'));
    const result = strategy.dataRouter!(baseArgs);
    expect(result.hook).toBe('useFilteredData');
  });

  it('returns empty transforms for standard mode in investigation phase', () => {
    const strategy = getStrategy(resolveMode('standard'));
    const result = strategy.dataRouter!(baseArgs);
    expect(result.transforms).toEqual([]);
  });

  it('returns useProductionLineGlanceData for standard mode in hub phase', () => {
    const strategy = getStrategy(resolveMode('standard'));
    const result = strategy.dataRouter!({ ...baseArgs, phase: 'hub' });
    expect(result.hook).toBe('useProductionLineGlanceData');
  });

  it('returns calculateNodeCapability transform for standard mode in hub phase', () => {
    const strategy = getStrategy(resolveMode('standard'));
    const result = strategy.dataRouter!({ ...baseArgs, phase: 'hub' });
    expect(result.transforms).toContain('calculateNodeCapability');
  });

  it('returns useProductionLineGlanceData for capability mode in hub phase', () => {
    const strategy = getStrategy(resolveMode('standard', { standardIChartMetric: 'capability' }));
    const args: RouterArgs = {
      scope: 'b1',
      phase: 'hub',
      window: { kind: 'rolling', windowDays: 7 },
      context: {},
    };
    const result = strategy.dataRouter!(args);
    expect(result.hook).toBe('useProductionLineGlanceData');
  });

  it('returns node-capability transforms for capability mode in hub phase', () => {
    const strategy = getStrategy(resolveMode('standard', { standardIChartMetric: 'capability' }));
    const result = strategy.dataRouter!({ ...baseArgs, phase: 'hub' });
    expect(result.transforms).toContain('calculateNodeCapability');
    expect(result.transforms).toContain('computeOutputRate');
    expect(result.transforms).toContain('computeBottleneck');
  });

  it('returns calculateStats for capability mode in investigation phase', () => {
    const strategy = getStrategy(resolveMode('standard', { standardIChartMetric: 'capability' }));
    const result = strategy.dataRouter!(baseArgs);
    expect(result.transforms).toContain('calculateStats');
  });

  it('returns useFilteredData for yamazumi mode regardless of phase', () => {
    const strategy = getStrategy(resolveMode('yamazumi'));
    expect(strategy.dataRouter!({ ...baseArgs, phase: 'investigation' }).hook).toBe(
      'useFilteredData'
    );
    expect(strategy.dataRouter!({ ...baseArgs, phase: 'hub' }).hook).toBe('useFilteredData');
  });

  it('returns useFilteredData for defect mode', () => {
    const strategy = getStrategy(resolveMode('defect'));
    const result = strategy.dataRouter!(baseArgs);
    expect(result.hook).toBe('useFilteredData');
    expect(result.transforms).toContain('computeDefectRates');
  });

  it('every strategy defines a dataRouter', () => {
    const modes: ResolvedMode[] = ['standard', 'capability', 'performance', 'yamazumi', 'defect'];
    for (const m of modes) {
      const strategy = getStrategy(m);
      expect(strategy.dataRouter, `${m} strategy must have dataRouter`).toBeDefined();
    }
  });
});
