import { describe, it, expect } from 'vitest';
import { buildAIContext, detectInvestigationPhase } from '../buildAIContext';
import type { AIStatsInput } from '../buildAIContext';
import { createHypothesis, type Finding } from '../../findings';
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

  it('includes filters with categories', () => {
    const ctx = buildAIContext({
      filters: { Machine: ['A', 'B'], Shift: ['Night'] },
      categories: [
        { id: 'c1', name: 'Equipment', factorNames: ['Machine'] },
        { id: 'c2', name: 'Temporal', factorNames: ['Shift'] },
      ],
    });
    expect(ctx.filters).toHaveLength(2);
    expect(ctx.filters[0].category).toBe('Equipment');
    expect(ctx.filters[1].category).toBe('Temporal');
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

  it('populates hypothesisTree with root hypotheses and children', () => {
    const root = createHypothesis('Root cause', 'Machine');
    const child = createHypothesis('Sub cause', 'Shift', undefined, root.id, 'gemba');
    const ctx = buildAIContext({
      process: { problemStatement: 'Cpk below target' },
      hypotheses: [root, child],
    });
    expect(ctx.investigation?.hypothesisTree).toHaveLength(1);
    expect(ctx.investigation?.hypothesisTree?.[0].children).toHaveLength(1);
    expect(ctx.investigation?.hypothesisTree?.[0].children?.[0].validationType).toBe('gemba');
  });

  it('detects investigation phase', () => {
    const root = createHypothesis('Root');
    root.status = 'supported';
    const child = createHypothesis('Child', undefined, undefined, root.id);
    child.status = 'supported';
    const ctx = buildAIContext({
      process: { problemStatement: 'Test' },
      hypotheses: [root, child],
    });
    expect(ctx.investigation?.phase).toBe('converging');
  });
});

describe('detectInvestigationPhase', () => {
  it('returns initial when no hypotheses', () => {
    expect(detectInvestigationPhase([])).toBe('initial');
  });

  it('returns initial for root-only untested hypotheses', () => {
    const h = createHypothesis('Test');
    expect(detectInvestigationPhase([h])).toBe('initial');
  });

  it('returns diverging when children exist and mostly untested', () => {
    const root = createHypothesis('Root');
    const c1 = createHypothesis('C1', undefined, undefined, root.id);
    const c2 = createHypothesis('C2', undefined, undefined, root.id);
    expect(detectInvestigationPhase([root, c1, c2])).toBe('diverging');
  });

  it('returns converging when most are tested', () => {
    const root = createHypothesis('Root');
    root.status = 'supported';
    const child = createHypothesis('Child', undefined, undefined, root.id);
    child.status = 'contradicted';
    expect(detectInvestigationPhase([root, child])).toBe('converging');
  });

  it('returns acting when findings have actions', () => {
    const h = createHypothesis('Test');
    h.status = 'supported';
    const findings = [
      {
        id: 'f1',
        text: 'finding',
        createdAt: 0,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'improving' as const,
        comments: [],
        statusChangedAt: 0,
        actions: [{ id: 'a1', text: 'Fix it', createdAt: 0 }],
      },
    ];
    expect(detectInvestigationPhase([h], findings)).toBe('acting');
  });
});
