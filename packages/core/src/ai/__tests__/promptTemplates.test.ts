import { describe, it, expect } from 'vitest';
import {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
} from '../promptTemplates';
import type { AIContext } from '../types';

describe('buildNarrationSystemPrompt', () => {
  it('returns a system prompt string', () => {
    const prompt = buildNarrationSystemPrompt();
    expect(prompt).toContain('quality');
    expect(prompt).toContain('VariScout');
    expect(typeof prompt).toBe('string');
  });
});

describe('buildSummaryPrompt', () => {
  it('builds prompt with stats', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      stats: { mean: 10.5, stdDev: 0.5, samples: 100, cpk: 1.1, cp: 1.33, passRate: 98.5 },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Mean=10.50');
    expect(prompt).toContain('Cpk=1.10');
    expect(prompt).toContain('PassRate=98.5%');
  });

  it('includes process description', () => {
    const ctx: AIContext = {
      process: { description: 'Fill weight on Line 3' },
      filters: [],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Fill weight on Line 3');
  });

  it('includes filters', () => {
    const ctx: AIContext = {
      process: {},
      filters: [{ factor: 'Machine', values: ['A', 'B'], role: 'equipment' }],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Machine=A,B');
    expect(prompt).toContain('equipment');
  });

  it('includes violations', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      violations: { outOfControl: 5, aboveUSL: 2, belowLSL: 0 },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('5 out-of-control');
    expect(prompt).toContain('2 above USL');
  });

  it('includes findings summary', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      findings: { total: 3, byStatus: { observed: 1, analyzed: 2 }, keyDrivers: ['Head 3'] },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('3 total');
    expect(prompt).toContain('Head 3');
  });

  it('handles minimal context', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Summarize');
  });
});

describe('buildChartInsightSystemPrompt', () => {
  it('returns a system prompt for chart insights', () => {
    const prompt = buildChartInsightSystemPrompt();
    expect(prompt).toContain('120 characters');
    expect(prompt).toContain('one sentence');
  });
});

describe('buildChartInsightPrompt', () => {
  it('includes deterministic insight text', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'ichart',
      deterministicInsight: 'Process shift detected',
      ichart: { nelsonSequenceCount: 1, outOfControlCount: 3, totalPoints: 50 },
    });
    expect(prompt).toContain('Process shift detected');
    expect(prompt).toContain('ichart');
    expect(prompt).toContain('50 points');
  });

  it('includes process description', () => {
    const ctx: AIContext = { process: { description: 'Fill weight on Line 3' }, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'stats',
      deterministicInsight: 'Cpk 0.85',
      stats: { cpk: 0.85, cpkTarget: 1.33 },
    });
    expect(prompt).toContain('Fill weight on Line 3');
    expect(prompt).toContain('Cpk');
  });

  it('includes boxplot data with factor role', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'boxplot',
      deterministicInsight: 'Drill Machine A',
      boxplot: {
        currentFactor: 'Machine',
        factorRole: 'equipment',
        topCategories: [{ name: 'A', variationPct: 47 }],
        nextDrillFactor: 'Shift',
      },
    });
    expect(prompt).toContain('Machine');
    expect(prompt).toContain('equipment');
    expect(prompt).toContain('Shift');
  });

  it('includes pareto data', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'pareto',
      deterministicInsight: 'Top 2 explain 73%',
      pareto: {
        topCategories: [
          { name: 'Head 3', variationPct: 45 },
          { name: 'Head 1', variationPct: 28 },
        ],
        cumulativeTop2Pct: 73,
      },
    });
    expect(prompt).toContain('73%');
    expect(prompt).toContain('Head 3');
  });

  it('includes active filters', () => {
    const ctx: AIContext = {
      process: {},
      filters: [{ factor: 'Machine', values: ['A'] }],
    };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'ichart',
      deterministicInsight: 'Stable process',
    });
    expect(prompt).toContain('Machine=A');
  });
});
