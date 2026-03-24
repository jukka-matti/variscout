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

  it('populates coscoutInsights from findings with source.chart === coscout', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Nozzle 3 shows 2x variation',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'investigating',
        comments: [],
        statusChangedAt: 1000,
        source: { chart: 'coscout', messageId: 'msg-1' },
      },
      {
        id: 'f-2',
        text: 'Temperature adjustment ineffective',
        createdAt: 2000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2000,
        source: { chart: 'coscout', messageId: 'msg-2' },
      },
      {
        id: 'f-3',
        text: 'Manual observation from boxplot',
        createdAt: 3000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'observed',
        comments: [],
        statusChangedAt: 3000,
        source: { chart: 'boxplot', category: 'Head 3' },
      },
    ];
    const ctx = buildAIContext({ findings });
    expect(ctx.findings!.coscoutInsights).toHaveLength(2);
    expect(ctx.findings!.coscoutInsights![0]).toEqual({
      text: 'Nozzle 3 shows 2x variation',
      status: 'investigating',
    });
    expect(ctx.findings!.coscoutInsights![1]).toEqual({
      text: 'Temperature adjustment ineffective',
      status: 'analyzed',
    });
  });

  it('omits coscoutInsights when no findings have coscout source', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Manual observation',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'observed',
        comments: [],
        statusChangedAt: 1000,
      },
    ];
    const ctx = buildAIContext({ findings });
    expect(ctx.findings!.coscoutInsights).toBeUndefined();
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

  it('respects maxGlossaryTerms for terminology section', () => {
    const ctx = buildAIContext({ maxGlossaryTerms: 5 });
    // Extract only the Terminology section (before Methodology Concepts)
    const terminologySection = ctx.glossaryFragment?.split('## Methodology Concepts')[0] ?? '';
    const termCount = (terminologySection.match(/^- \*\*/gm) || []).length;
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

  it('populates ideas from hypotheses', () => {
    const root = createHypothesis('Root cause', 'Machine');
    root.status = 'supported';
    root.ideas = [
      {
        id: 'idea-1',
        text: 'Simplify setup',
        timeframe: 'just-do',
        selected: true,
        projection: {
          baselineMean: 10,
          baselineSigma: 0.5,
          projectedMean: 9.5,
          projectedSigma: 0.4,
          meanDelta: -0.5,
          sigmaDelta: -0.1,
          simulationParams: { meanAdjustment: -0.5, variationReduction: 20 },
          createdAt: '2026-03-15T00:00:00Z',
        },
        createdAt: '2026-03-15T00:00:00Z',
      },
    ];
    const ctx = buildAIContext({
      process: { problemStatement: 'Test' },
      hypotheses: [root],
    });
    expect(ctx.investigation?.allHypotheses?.[0].ideas).toHaveLength(1);
    expect(ctx.investigation?.allHypotheses?.[0].ideas?.[0].text).toBe('Simplify setup');
    expect(ctx.investigation?.allHypotheses?.[0].ideas?.[0].selected).toBe(true);
    expect(ctx.investigation?.allHypotheses?.[0].ideas?.[0].projection).toBeDefined();
  });

  it('includes methodology concepts in glossary fragment', () => {
    const ctx = buildAIContext({});
    expect(ctx.glossaryFragment).toContain('Methodology Concepts');
    expect(ctx.glossaryFragment).toContain('Four Lenses');
  });

  it('includes activeChart when provided', () => {
    const ctx = buildAIContext({ activeChart: 'boxplot' });
    expect(ctx.activeChart).toBe('boxplot');
  });

  it('does not include activeChart when not provided', () => {
    const ctx = buildAIContext({});
    expect(ctx.activeChart).toBeUndefined();
  });

  it('derives factorRoles from categories', () => {
    const ctx = buildAIContext({
      categories: [
        { id: 'c1', name: 'Equipment', factorNames: ['Machine'] },
        { id: 'c2', name: 'Temporal', factorNames: ['Shift', 'Day'] },
      ],
    });
    expect(ctx.process.factorRoles).toEqual({
      Machine: 'Equipment',
      Shift: 'Temporal',
      Day: 'Temporal',
    });
  });

  it('does not add factorRoles without categories', () => {
    const ctx = buildAIContext({});
    expect(ctx.process.factorRoles).toBeUndefined();
  });

  it('does not add factorRoles with empty categories', () => {
    const ctx = buildAIContext({ categories: [] });
    expect(ctx.process.factorRoles).toBeUndefined();
  });

  it('includes variationContributions when provided', () => {
    const contributions = [
      { factor: 'Machine', etaSquared: 0.45 },
      { factor: 'Shift', etaSquared: 0.12 },
    ];
    const ctx = buildAIContext({ variationContributions: contributions });
    expect(ctx.variationContributions).toHaveLength(2);
    expect(ctx.variationContributions![0].factor).toBe('Machine');
    expect(ctx.variationContributions![0].etaSquared).toBe(0.45);
  });

  it('annotates variationContributions with category from categories', () => {
    const ctx = buildAIContext({
      variationContributions: [
        { factor: 'Machine', etaSquared: 0.45 },
        { factor: 'Shift', etaSquared: 0.12 },
        { factor: 'Batch', etaSquared: 0.05 },
      ],
      categories: [
        { id: 'c1', name: 'Equipment', factorNames: ['Machine'] },
        { id: 'c2', name: 'Temporal', factorNames: ['Shift'] },
      ],
    });
    expect(ctx.variationContributions![0].category).toBe('Equipment');
    expect(ctx.variationContributions![1].category).toBe('Temporal');
    expect(ctx.variationContributions![2].category).toBeUndefined();
  });

  it('does not include empty variationContributions', () => {
    const ctx = buildAIContext({ variationContributions: [] });
    expect(ctx.variationContributions).toBeUndefined();
  });

  it('includes drillPath when provided', () => {
    const ctx = buildAIContext({ drillPath: ['Machine', 'Shift'] });
    expect(ctx.drillPath).toEqual(['Machine', 'Shift']);
  });

  it('does not include empty drillPath', () => {
    const ctx = buildAIContext({ drillPath: [] });
    expect(ctx.drillPath).toBeUndefined();
  });

  it('includes focusContext when provided', () => {
    const ctx = buildAIContext({
      focusContext: {
        chartType: 'boxplot',
        category: { name: 'Machine A', mean: 10.2, contributionPct: 45 },
      },
    });
    expect(ctx.focusContext).toBeDefined();
    expect(ctx.focusContext!.chartType).toBe('boxplot');
    expect(ctx.focusContext!.category!.name).toBe('Machine A');
  });

  it('includes teamContributors when count > 0', () => {
    const ctx = buildAIContext({
      teamContributors: { count: 3, hypothesisAreas: ['Machine', 'Shift'] },
    });
    expect(ctx.teamContributors).toBeDefined();
    expect(ctx.teamContributors!.count).toBe(3);
  });

  it('omits teamContributors when count is 0', () => {
    const ctx = buildAIContext({
      teamContributors: { count: 0, hypothesisAreas: [] },
    });
    expect(ctx.teamContributors).toBeUndefined();
  });

  it('includes selectedFinding in investigation context', () => {
    const ctx = buildAIContext({
      process: { problemStatement: 'Cpk below target' },
      selectedFinding: {
        text: 'Head 3 drift',
        hypothesis: 'Worn nozzle',
      },
    });
    expect(ctx.investigation?.selectedFinding).toBeDefined();
    expect(ctx.investigation!.selectedFinding!.text).toBe('Head 3 drift');
    expect(ctx.investigation!.selectedFinding!.hypothesis).toBe('Worn nozzle');
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

  it('sets locale on context when provided', () => {
    const ctx = buildAIContext({ locale: 'de' });
    expect(ctx.locale).toBe('de');
  });

  it('does not set locale when not provided', () => {
    const ctx = buildAIContext({});
    expect(ctx.locale).toBeUndefined();
  });

  it('passes locale to glossary prompt for bilingual terms', () => {
    // Include stats with cpk to trigger capability glossary category (which has German translations)
    const ctx = buildAIContext({ locale: 'de', stats: mockStats });
    // German glossary should produce bilingual sub-lines for capability terms
    expect(ctx.glossaryFragment).toMatch(/DE: \*\*/);
  });

  it('does not produce bilingual terms for English locale', () => {
    const ctx = buildAIContext({ locale: 'en', stats: mockStats });
    expect(ctx.glossaryFragment).not.toMatch(/[A-Z]{2}: \*\*/);
  });
});

describe('buildAIContext stagedComparison', () => {
  const makeStageStats = (overrides: Record<string, number>) =>
    ({
      mean: 0,
      median: 0,
      stdDev: 0,
      sigmaWithin: 0,
      mrBar: 0,
      ucl: 0,
      lcl: 0,
      outOfSpecPercentage: 0,
      ...overrides,
    }) as import('../../types').StatsResult;

  const mockStagedComparison = {
    stages: [
      { name: 'Before', stats: makeStageStats({ mean: 10, stdDev: 0.5, cpk: 0.89 }), index: 0 },
      { name: 'After', stats: makeStageStats({ mean: 10.2, stdDev: 0.3, cpk: 1.32 }), index: 1 },
    ],
    deltas: {
      meanShift: 0.2,
      variationRatio: 0.6,
      cpkDelta: 0.43,
      passRateDelta: 5.0,
      outOfSpecReduction: 3.2,
    },
    colorCoding: {
      meanShift: 'amber' as const,
      variationRatio: 'green' as const,
      cpkDelta: 'green' as const,
      passRateDelta: 'green' as const,
      outOfSpecReduction: 'green' as const,
    },
  };

  it('includes stagedComparison when provided', () => {
    const ctx = buildAIContext({ stagedComparison: mockStagedComparison });
    expect(ctx.stagedComparison).toBeDefined();
    expect(ctx.stagedComparison!.stageNames).toEqual(['Before', 'After']);
    expect(ctx.stagedComparison!.deltas.cpkDelta).toBe(0.43);
    expect(ctx.stagedComparison!.cpkBefore).toBe(0.89);
    expect(ctx.stagedComparison!.cpkAfter).toBe(1.32);
  });

  it('omits stagedComparison when null', () => {
    const ctx = buildAIContext({ stagedComparison: null });
    expect(ctx.stagedComparison).toBeUndefined();
  });

  it('omits stagedComparison when not provided', () => {
    const ctx = buildAIContext({});
    expect(ctx.stagedComparison).toBeUndefined();
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
    expect(detectInvestigationPhase([h], findings)).toBe('improving');
  });

  it('returns validating when 1 root supported and 1 root untested (no children)', () => {
    const h1 = createHypothesis('Supported root');
    h1.status = 'supported';
    const h2 = createHypothesis('Untested root');
    // h2 is untested by default
    expect(detectInvestigationPhase([h1, h2])).toBe('validating');
  });

  it('returns validating at 50/50 boundary (2 tested + 2 untested, no children)', () => {
    const h1 = createHypothesis('Tested 1');
    h1.status = 'supported';
    const h2 = createHypothesis('Tested 2');
    h2.status = 'contradicted';
    const h3 = createHypothesis('Untested 1');
    const h4 = createHypothesis('Untested 2');
    // 2 tested vs 2 untested — not strictly more tested, so falls through to validating
    expect(detectInvestigationPhase([h1, h2, h3, h4])).toBe('validating');
  });

  it('does not return acting with empty findings array and supported hypotheses', () => {
    const h = createHypothesis('Test');
    h.status = 'supported';
    const phase = detectInvestigationPhase([h], []);
    expect(phase).not.toBe('improving');
    // With 1 tested (supported) and 0 untested → converging
    expect(phase).toBe('converging');
  });

  it('returns converging when all hypotheses are contradicted', () => {
    const h1 = createHypothesis('Hypothesis A');
    h1.status = 'contradicted';
    const h2 = createHypothesis('Hypothesis B');
    h2.status = 'contradicted';
    expect(detectInvestigationPhase([h1, h2])).toBe('converging');
  });
});

describe('buildAIContext capabilityStability', () => {
  it('populates capabilityStability when capabilityData is provided', () => {
    const ctx = buildAIContext({
      capabilityData: {
        subgroupResults: [
          { label: 'A', index: 0, n: 5, mean: 10, sigmaWithin: 0.5, cp: 1.5, cpk: 1.2 },
          { label: 'B', index: 1, n: 5, mean: 10.5, sigmaWithin: 0.6, cp: 1.4, cpk: 0.9 },
          { label: 'C', index: 2, n: 5, mean: 10.2, sigmaWithin: 0.4, cp: 1.6, cpk: 1.3 },
        ],
        cpkStats: { mean: 1.133, ucl: 1.5, lcl: 0.7 },
        cpStats: { mean: 1.5 },
        config: { method: 'column', column: 'Batch' },
      },
    });

    expect(ctx.capabilityStability).toBeDefined();
    const cs = ctx.capabilityStability!;
    expect(cs.method).toBe('column');
    expect(cs.column).toBe('Batch');
    expect(cs.subgroupCount).toBe(3);
    expect(cs.meanCpk).toBe(1.133);
    expect(cs.minCpk).toBeCloseTo(0.9);
    expect(cs.maxCpk).toBeCloseTo(1.3);
    expect(cs.cpkInControl).toBe(3); // all within 0.7-1.5
    expect(cs.cpkOutOfControl).toBe(0);
    expect(cs.meanCp).toBe(1.5);
    expect(cs.centeringLoss).toBeCloseTo(1.5 - 1.133, 3);
  });

  it('counts out-of-control subgroups correctly', () => {
    const ctx = buildAIContext({
      capabilityData: {
        subgroupResults: [
          { label: 'A', index: 0, n: 5, mean: 10, sigmaWithin: 0.5, cpk: 1.2 },
          { label: 'B', index: 1, n: 5, mean: 10, sigmaWithin: 0.5, cpk: 0.5 }, // below lcl
          { label: 'C', index: 2, n: 5, mean: 10, sigmaWithin: 0.5, cpk: 1.8 }, // above ucl
        ],
        cpkStats: { mean: 1.167, ucl: 1.5, lcl: 0.8 },
        cpStats: null,
        config: { method: 'fixed-size', size: 5 },
      },
    });

    const cs = ctx.capabilityStability!;
    expect(cs.cpkInControl).toBe(1);
    expect(cs.cpkOutOfControl).toBe(2);
    expect(cs.meanCp).toBeUndefined();
    expect(cs.centeringLoss).toBeUndefined();
    expect(cs.subgroupSize).toBe(5);
  });

  it('omits capabilityStability when no capabilityData provided', () => {
    const ctx = buildAIContext({});
    expect(ctx.capabilityStability).toBeUndefined();
  });

  it('omits capabilityStability when cpkStats is null', () => {
    const ctx = buildAIContext({
      capabilityData: {
        subgroupResults: [],
        cpkStats: null,
        cpStats: null,
        config: { method: 'fixed-size', size: 5 },
      },
    });
    expect(ctx.capabilityStability).toBeUndefined();
  });
});
