import { describe, it, expect } from 'vitest';
import { buildNarrationSystemPrompt, buildSummaryPrompt } from '../promptTemplates';
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
