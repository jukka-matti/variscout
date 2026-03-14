import { describe, it, expect } from 'vitest';
import { buildAIContext } from '../buildAIContext';
import type { AIStatsInput } from '../buildAIContext';
import type { Finding } from '../../types';
import type { ProcessContext } from '../types';

const mockStats: AIStatsInput = {
  mean: 10.5,
  stdDev: 0.5,
  count: 100,
  cp: 1.33,
  cpk: 1.1,
  passRate: 98.5,
};

describe('buildAIContext', () => {
  it('builds minimal context with no options', () => {
    const ctx = buildAIContext({});
    expect(ctx.process).toEqual({});
    expect(ctx.filters).toEqual([]);
    expect(ctx.glossaryFragment).toBeTruthy();
  });

  it('includes stats when provided', () => {
    const ctx = buildAIContext({ stats: mockStats });
    expect(ctx.stats).toBeDefined();
    expect(ctx.stats!.mean).toBe(10.5);
    expect(ctx.stats!.cpk).toBe(1.1);
    expect(ctx.stats!.samples).toBe(100);
  });

  it('includes filters with roles', () => {
    const ctx = buildAIContext({
      filters: { Machine: ['A', 'B'], Shift: ['Night'] },
      factorRoles: { Machine: 'equipment', Shift: 'temporal' },
    });
    expect(ctx.filters).toHaveLength(2);
    expect(ctx.filters[0].role).toBe('equipment');
    expect(ctx.filters[1].role).toBe('temporal');
  });

  it('includes violations when provided', () => {
    const ctx = buildAIContext({
      violations: { outOfControl: 3, aboveUSL: 1, belowLSL: 0 },
    });
    expect(ctx.violations).toEqual({ outOfControl: 3, aboveUSL: 1, belowLSL: 0 });
  });

  it('passes through Nelson rule counts in violations', () => {
    const ctx = buildAIContext({
      violations: {
        outOfControl: 2,
        aboveUSL: 0,
        belowLSL: 1,
        nelsonRule2Count: 3,
        nelsonRule3Count: 1,
      },
    });
    expect(ctx.violations).toEqual({
      outOfControl: 2,
      aboveUSL: 0,
      belowLSL: 1,
      nelsonRule2Count: 3,
      nelsonRule3Count: 1,
    });
  });

  it('includes findings summary', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Head 3 drift',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'analyzed',
        tag: 'key-driver',
        comments: [],
        statusChangedAt: 1000,
      },
      {
        id: 'f-2',
        text: 'Shift B spread',
        createdAt: 2000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'observed',
        comments: [],
        statusChangedAt: 2000,
      },
    ];
    const ctx = buildAIContext({ findings });
    expect(ctx.findings).toBeDefined();
    expect(ctx.findings!.total).toBe(2);
    expect(ctx.findings!.keyDrivers).toContain('Head 3 drift');
  });

  it('includes process context', () => {
    const process: ProcessContext = {
      description: 'Fill weight measurement on Line 3',
      product: 'Yogurt cups',
    };
    const ctx = buildAIContext({ process });
    expect(ctx.process.description).toBe('Fill weight measurement on Line 3');
  });

  it('includes investigation glossary when findings present', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Test',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'observed',
        comments: [],
        statusChangedAt: 1000,
      },
    ];
    const ctx = buildAIContext({ findings });
    // investigation category should be included when findings are present
    expect(ctx.glossaryFragment).toBeTruthy();
  });

  it('respects maxGlossaryTerms', () => {
    const ctx = buildAIContext({ maxGlossaryTerms: 5 });
    const termCount = (ctx.glossaryFragment?.match(/^- \*\*/gm) || []).length;
    expect(termCount).toBeLessThanOrEqual(5);
  });

  it('derives passRate from outOfSpecPercentage when passRate not given', () => {
    const stats: AIStatsInput = {
      mean: 10.0,
      stdDev: 0.3,
      count: 50,
      outOfSpecPercentage: 5,
    };
    const ctx = buildAIContext({ stats });
    expect(ctx.stats!.passRate).toBe(95);
  });
});
