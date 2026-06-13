import { describe, it, expect } from 'vitest';
import { resolveMode, getStrategy } from '../analysisStrategy';
import type { ResolvedMode } from '../analysisStrategy';
import type { ParetoYMetricId } from '../pareto';

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

  it('ignores standardIChartMetric for non-standard modes', () => {
    expect(resolveMode('performance', { standardIChartMetric: 'capability' })).toBe('performance');
  });
});

describe('getStrategy', () => {
  const allModes: ResolvedMode[] = ['standard', 'capability', 'performance'];

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
});

describe('AnalysisModeStrategy.paretoYOptions', () => {
  // Helper to extract ordered IDs from paretoYOptions
  const ids = (mode: ResolvedMode): ParetoYMetricId[] =>
    getStrategy(mode).paretoYOptions?.map(o => o.id) ?? [];

  describe('ordered ID lists per mode', () => {
    it('defect: count → time → cost', () => {
      expect(ids('defect')).toEqual(['count', 'time', 'cost']);
    });

    it('capability: percent-out-of-spec → cpk-gap → mean-minus-target', () => {
      expect(ids('capability')).toEqual(['percent-out-of-spec', 'cpk-gap', 'mean-minus-target']);
    });

    it('performance: cpk → percent-out-of-spec', () => {
      expect(ids('performance')).toEqual(['cpk', 'percent-out-of-spec']);
    });

    it('standard: count only', () => {
      expect(ids('standard')).toEqual(['count']);
    });
  });

  describe('first option is the mode default', () => {
    it('defect default is count', () => {
      expect(getStrategy('defect').paretoYOptions?.[0].id).toBe('count');
    });

    it('capability default is percent-out-of-spec', () => {
      expect(getStrategy('capability').paretoYOptions?.[0].id).toBe('percent-out-of-spec');
    });

    it('performance default is cpk', () => {
      expect(getStrategy('performance').paretoYOptions?.[0].id).toBe('cpk');
    });

    it('standard default is count', () => {
      expect(getStrategy('standard').paretoYOptions?.[0].id).toBe('count');
    });
  });

  describe('option counts match D11 spec', () => {
    it.each<[ResolvedMode, number]>([
      ['defect', 3],
      ['capability', 3],
      ['performance', 2],
      ['standard', 1],
    ])('%s has %i option(s)', (mode, expectedCount) => {
      expect(getStrategy(mode).paretoYOptions).toHaveLength(expectedCount);
    });
  });

  it('standard has exactly one option (picker hidden in UI)', () => {
    expect(getStrategy('standard').paretoYOptions).toHaveLength(1);
    expect(getStrategy('standard').paretoYOptions?.[0].id).toBe('count');
  });

  it('all options reference valid ParetoYMetric objects (have id + label)', () => {
    const allModes: ResolvedMode[] = ['standard', 'capability', 'performance', 'defect'];
    for (const mode of allModes) {
      const opts = getStrategy(mode).paretoYOptions ?? [];
      for (const opt of opts) {
        expect(typeof opt.id).toBe('string');
        expect(typeof opt.label).toBe('string');
        expect(opt.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('ER-5b: defect strategy Pareto slot contract', () => {
  // ER-5b hard constraint: exactly 4 chart slots, Pareto in slot1–3.
  // "Pareto promotion" = Pareto is a primary slot by data-shape right,
  // not optional or in slot4. Changing slot count breaks Dashboard layout.
  const defect = getStrategy('defect');

  it('defect strategy has Pareto in a primary slot (slot1–slot3)', () => {
    const slots = defect.chartSlots;
    const primarySlots = [slots.slot1, slots.slot2, slots.slot3];
    expect(primarySlots).toContain('pareto');
  });

  it('defect strategy has exactly 4 chart slots (no 5th slot)', () => {
    const slots = defect.chartSlots;
    // The ChartSlots interface defines exactly slot1–slot4.
    const slotKeys = Object.keys(slots);
    expect(slotKeys).toHaveLength(4);
    expect(slotKeys).toEqual(['slot1', 'slot2', 'slot3', 'slot4']);
  });

  it('defect strategy slot layout is ichart > boxplot > pareto > defect-summary', () => {
    const { slot1, slot2, slot3, slot4 } = defect.chartSlots;
    expect(slot1).toBe('ichart');
    expect(slot2).toBe('boxplot');
    expect(slot3).toBe('pareto');
    expect(slot4).toBe('defect-summary');
  });
});
