import { describe, it, expect } from 'vitest';
import { buildAIContext, detectInvestigationPhase } from '../buildAIContext';
import type { AIStatsInput } from '../buildAIContext';
import { type Finding } from '../../findings';
import type { ProcessContext } from '../types';
import { DEFAULT_TIME_LENS } from '../../stats';

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
        {
          id: 'c1',
          name: 'Equipment',
          factorNames: ['Machine'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
        {
          id: 'c2',
          name: 'Temporal',
          factorNames: ['Shift'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
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
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        tag: 'key-driver',
        comments: [],
        statusChangedAt: 1000,
      },
      {
        id: 'f-2',
        text: 'Shift B spread',
        createdAt: 2000,
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
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
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'investigating',
        comments: [],
        statusChangedAt: 1000,
        source: { chart: 'coscout', messageId: 'msg-1', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: 'f-2',
        text: 'Temperature adjustment ineffective',
        createdAt: 2000,
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2000,
        source: { chart: 'coscout', messageId: 'msg-2', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: 'f-3',
        text: 'Manual observation from boxplot',
        createdAt: 3000,
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'observed',
        comments: [],
        statusChangedAt: 3000,
        source: { chart: 'boxplot', category: 'Head 3', timeLens: DEFAULT_TIME_LENS },
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
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
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
        deletedAt: null,
        investigationId: 'inv-test-001',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
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
        {
          id: 'c1',
          name: 'Equipment',
          factorNames: ['Machine'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
        {
          id: 'c2',
          name: 'Temporal',
          factorNames: ['Shift', 'Day'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
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
        {
          id: 'c1',
          name: 'Equipment',
          factorNames: ['Machine'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
        {
          id: 'c2',
          name: 'Temporal',
          factorNames: ['Shift'],
          createdAt: 1714000000000,
          deletedAt: null,
        },
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

  it('passes through factorType and optimum on variationContributions', () => {
    const ctx = buildAIContext({
      variationContributions: [
        {
          factor: 'Temperature',
          etaSquared: 0.45,
          factorType: 'continuous',
          relationship: 'quadratic',
          optimum: 72,
        },
        { factor: 'Machine', etaSquared: 0.12, factorType: 'categorical' },
        { factor: 'Shift', etaSquared: 0.05 },
      ],
    });
    expect(ctx.variationContributions![0].factorType).toBe('continuous');
    expect(ctx.variationContributions![0].relationship).toBe('quadratic');
    expect(ctx.variationContributions![0].optimum).toBe(72);
    expect(ctx.variationContributions![1].factorType).toBe('categorical');
    expect(ctx.variationContributions![1].optimum).toBeUndefined();
    expect(ctx.variationContributions![2].factorType).toBeUndefined();
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
        category: { name: 'Machine A', mean: 10.2, etaSquaredPct: 45 },
      },
    });
    expect(ctx.focusContext).toBeDefined();
    expect(ctx.focusContext!.chartType).toBe('boxplot');
    expect(ctx.focusContext!.category!.name).toBe('Machine A');
  });

  it('includes teamContributors when count > 0', () => {
    const ctx = buildAIContext({
      teamContributors: { count: 3, questionAreas: ['Machine', 'Shift'] },
    });
    expect(ctx.teamContributors).toBeDefined();
    expect(ctx.teamContributors!.count).toBe(3);
  });

  it('omits teamContributors when count is 0', () => {
    const ctx = buildAIContext({
      teamContributors: { count: 0, questionAreas: [] },
    });
    expect(ctx.teamContributors).toBeUndefined();
  });

  it('includes selectedFinding in investigation context', () => {
    const ctx = buildAIContext({
      process: { issueStatement: 'Cpk below target' },
      selectedFinding: {
        text: 'Head 3 drift',
        question: 'Worn nozzle',
      },
    });
    expect(ctx.investigation?.selectedFinding).toBeDefined();
    expect(ctx.investigation!.selectedFinding!.text).toBe('Head 3 drift');
    expect(ctx.investigation!.selectedFinding!.question).toBe('Worn nozzle');
  });

  it('detects investigation phase from findings (ADR-085: Question tree retired)', () => {
    // Phase derives from finding statuses — analyzed/improving/resolved = matured
    const f1 = makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'analyzed' });
    const f2 = makeFinding({ id: 'f2', createdAt: 1714000000000, status: 'analyzed' });
    const f3 = makeFinding({ id: 'f3', createdAt: 1714000000000, status: 'observed' });
    const ctx = buildAIContext({
      process: { issueStatement: 'Test' },
      findings: [f1, f2, f3],
    });
    // 2 matured > 1 open → converging
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

/**
 * detectInvestigationPhase tests — ADR-085: now takes Finding[] only.
 * Phase detection derives from finding status maturity (no Question tree).
 *
 * Mapping:
 *   - no findings → 'initial'
 *   - only observed/investigating → 'diverging'
 *   - matured (analyzed/improving/resolved) > open (observed/investigating) → 'converging'
 *   - matured > 0 && open > 0 → 'validating'
 *   - any improving/resolved with actions → 'improving'
 */
describe('detectInvestigationPhase', () => {
  it('returns initial when no findings', () => {
    expect(detectInvestigationPhase([])).toBe('initial');
  });

  it('returns diverging when findings are all observed/investigating', () => {
    const findings: Finding[] = [
      makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'observed' }),
      makeFinding({ id: 'f2', createdAt: 1714000000000, status: 'investigating' }),
    ];
    expect(detectInvestigationPhase(findings)).toBe('diverging');
  });

  it('returns converging when majority of findings are matured', () => {
    const findings: Finding[] = [
      makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'analyzed' }),
      makeFinding({ id: 'f2', createdAt: 1714000000000, status: 'analyzed' }),
      makeFinding({ id: 'f3', createdAt: 1714000000000, status: 'observed' }),
    ];
    // 2 matured > 1 open → converging
    expect(detectInvestigationPhase(findings)).toBe('converging');
  });

  it('returns improving when an improving finding has actions', () => {
    const findings: Finding[] = [
      {
        id: 'f1',
        text: 'Drift in machine B',
        createdAt: 1714000000000,
        deletedAt: null,
        investigationId: 'general-unassigned',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data' as const,
        status: 'improving' as const,
        comments: [],
        statusChangedAt: 1714000000000,
        actions: [{ id: 'a1', text: 'Fix it', createdAt: 1714000000000, deletedAt: null }],
      },
    ];
    expect(detectInvestigationPhase(findings)).toBe('improving');
  });

  it('returns validating when there are both matured and open findings', () => {
    const findings: Finding[] = [
      makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'analyzed' }),
      makeFinding({ id: 'f2', createdAt: 1714000000000, status: 'observed' }),
    ];
    // 1 matured, 1 open → validating (not strictly more matured)
    expect(detectInvestigationPhase(findings)).toBe('validating');
  });

  it('returns converging when all findings are matured', () => {
    const findings: Finding[] = [
      makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'analyzed' }),
      makeFinding({ id: 'f2', createdAt: 1714000000000, status: 'resolved' }),
    ];
    expect(detectInvestigationPhase(findings)).toBe('converging');
  });

  it('does not return improving with no actions even if status is improving', () => {
    const findings: Finding[] = [
      makeFinding({ id: 'f1', createdAt: 1714000000000, status: 'improving', actions: [] }),
    ];
    // No actions → falls through to converging (matured > 0, open = 0)
    const phase = detectInvestigationPhase(findings);
    expect(phase).not.toBe('improving');
    expect(phase).toBe('converging');
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

// ---------------------------------------------------------------------------
// Helpers for ADR-060 tests
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> & { id: string; createdAt: number }): Finding {
  return {
    text: 'Test finding',
    status: 'observed',
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    comments: [],
    statusChangedAt: overrides.createdAt,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ADR-060 Pillar 1 tests
// ---------------------------------------------------------------------------

describe('ADR-060 Pillar 1', () => {
  // Task 2: problemStatement
  describe('Task 2: problemStatement', () => {
    it('wraps a string problemStatement as { fullText }', () => {
      const ctx = buildAIContext({
        process: { problemStatement: 'Reduce cycle time by 20% in shift B' },
      });
      expect(ctx.investigation?.problemStatement?.fullText).toBe(
        'Reduce cycle time by 20% in shift B'
      );
    });

    it('does not set problemStatement when not provided', () => {
      const ctx = buildAIContext({ process: { issueStatement: 'Something' } });
      expect(ctx.investigation?.problemStatement).toBeUndefined();
    });

    it('sets investigation context even when only problemStatement is present', () => {
      const ctx = buildAIContext({
        process: { problemStatement: 'Measure X is drifting' },
      });
      expect(ctx.investigation).toBeDefined();
      expect(ctx.investigation?.problemStatement?.fullText).toBe('Measure X is drifting');
    });

    it('includes current understanding and problem condition while preserving legacy fields', () => {
      const problemCondition = {
        metric: 'cpk' as const,
        currentValue: 0.87,
        targetValue: 1.33,
        targetDirection: 'maximize' as const,
        status: 'below-target' as const,
        summary: 'Cpk is 0.87 against target 1.33.',
      };
      const currentUnderstanding = {
        summary:
          'Issue / concern: Fill weight is too high.\nProblem condition: Cpk is 0.87 against target 1.33.',
        issueConcern: 'Fill weight is too high.',
        problemCondition,
      };

      const ctx = buildAIContext({
        process: {
          issueStatement: 'Fill weight is too high.',
          problemStatement: 'Mean fill weight is high on Line 3 night shift.',
          problemCondition,
          currentUnderstanding,
        },
      });

      expect(ctx.investigation?.issueStatement).toBe('Fill weight is too high.');
      expect(ctx.investigation?.problemStatement?.fullText).toBe(
        'Mean fill weight is high on Line 3 night shift.'
      );
      expect(ctx.investigation?.problemCondition).toEqual(problemCondition);
      expect(ctx.investigation?.currentUnderstanding).toEqual(currentUnderstanding);
    });

    it('creates investigation context when only problem condition is present', () => {
      const problemCondition = {
        metric: 'yield' as const,
        currentValue: 92,
        targetValue: 98,
        targetDirection: 'maximize' as const,
        status: 'below-target' as const,
        summary: 'Yield is 92 against target 98.',
      };

      const ctx = buildAIContext({
        process: { problemCondition },
      });

      expect(ctx.investigation?.problemCondition).toEqual(problemCondition);
    });
  });

  // Task 3: topFindings
  describe('Task 3: topFindings', () => {
    it('takes top 5 findings sorted by createdAt descending', () => {
      const findings: Finding[] = Array.from({ length: 8 }, (_, i) =>
        makeFinding({ id: `f${i}`, createdAt: i * 1000, text: `Finding ${i}` })
      );

      const ctx = buildAIContext({ findings });
      expect(ctx.findings?.topFindings).toHaveLength(5);
      expect(ctx.findings?.topFindings![0].id).toBe('f7');
      expect(ctx.findings?.topFindings![4].id).toBe('f3');
    });

    it('includes commentCount based on comments array length', () => {
      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        comments: [
          {
            id: 'c1',
            text: 'Comment 1',
            createdAt: 1,
            parentId: 'f1',
            parentKind: 'finding' as const,
            deletedAt: null,
          },
          {
            id: 'c2',
            text: 'Comment 2',
            createdAt: 2,
            parentId: 'f1',
            parentKind: 'finding' as const,
            deletedAt: null,
          },
        ],
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.topFindings![0].commentCount).toBe(2);
    });

    it('computes cpkDelta from outcome cpkAfter - cpkBefore', () => {
      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        status: 'resolved',
        outcome: { effective: 'yes', cpkBefore: 0.8, cpkAfter: 1.4, verifiedAt: Date.now() },
      });

      const ctx = buildAIContext({ findings: [finding] });
      const top = ctx.findings?.topFindings![0];
      expect(top?.outcome?.effective).toBe('yes');
      expect(top?.outcome?.cpkDelta).toBeCloseTo(0.6);
    });

    it('omits cpkDelta when cpkBefore or cpkAfter is missing', () => {
      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        status: 'resolved',
        outcome: { effective: 'partial', verifiedAt: Date.now() },
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.topFindings![0].outcome?.cpkDelta).toBeUndefined();
    });

    it('omits outcome when not present on finding', () => {
      const finding = makeFinding({ id: 'f1', createdAt: 1000 });
      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.topFindings![0].outcome).toBeUndefined();
    });

    it('returns all findings when fewer than 5', () => {
      const findings = [
        makeFinding({ id: 'f1', createdAt: 1000 }),
        makeFinding({ id: 'f2', createdAt: 2000 }),
      ];
      const ctx = buildAIContext({ findings });
      expect(ctx.findings?.topFindings).toHaveLength(2);
    });
  });

  // Task 4: overdueActions
  describe('Task 4: overdueActions', () => {
    it('extracts overdue actions sorted by most overdue first', () => {
      const now = Date.now();
      const msPerDay = 86400000;

      const findings: Finding[] = [
        makeFinding({
          id: 'f1',
          createdAt: 1000,
          actions: [
            {
              id: 'a1',
              text: 'Fix the bearing',
              dueDate: new Date(now - 5 * msPerDay).toISOString().slice(0, 10),
              createdAt: 1000,
              deletedAt: null,
            },
          ],
        }),
        makeFinding({
          id: 'f2',
          createdAt: 2000,
          actions: [
            {
              id: 'a2',
              text: 'Retrain operators',
              dueDate: new Date(now - 10 * msPerDay).toISOString().slice(0, 10),
              createdAt: 1000,
              deletedAt: null,
            },
            {
              id: 'a3',
              text: 'Inspect tooling',
              dueDate: new Date(now - 2 * msPerDay).toISOString().slice(0, 10),
              createdAt: 1000,
              deletedAt: null,
            },
          ],
        }),
      ];

      const ctx = buildAIContext({ findings });
      const overdue = ctx.findings?.overdueActions ?? [];
      expect(overdue).toHaveLength(3);
      expect(overdue[0].text).toBe('Retrain operators');
      expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(9);
      expect(overdue[1].text).toBe('Fix the bearing');
      expect(overdue[2].text).toBe('Inspect tooling');
      expect(overdue[0].findingId).toBe('f2');
      expect(overdue[1].findingId).toBe('f1');
    });

    it('caps overdueActions at top 3', () => {
      const now = Date.now();
      const msPerDay = 86400000;

      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        actions: Array.from({ length: 5 }, (_, i) => ({
          id: `a${i}`,
          text: `Action ${i}`,
          dueDate: new Date(now - (i + 1) * msPerDay).toISOString().slice(0, 10),
          createdAt: 1000,
          deletedAt: null as null,
        })),
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.overdueActions).toHaveLength(3);
    });

    it('excludes completed actions', () => {
      const now = Date.now();
      const msPerDay = 86400000;

      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        actions: [
          {
            id: 'a1',
            text: 'Completed action',
            dueDate: new Date(now - 5 * msPerDay).toISOString().slice(0, 10),
            completedAt: now - msPerDay,
            createdAt: 1000,
            deletedAt: null,
          },
        ],
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.overdueActions ?? []).toHaveLength(0);
    });

    it('excludes future due dates', () => {
      const now = Date.now();
      const msPerDay = 86400000;

      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        actions: [
          {
            id: 'a1',
            text: 'Future action',
            dueDate: new Date(now + 5 * msPerDay).toISOString().slice(0, 10),
            createdAt: 1000,
            deletedAt: null,
          },
        ],
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.overdueActions ?? []).toHaveLength(0);
    });

    it('includes assignee displayName', () => {
      const now = Date.now();
      const msPerDay = 86400000;

      const finding = makeFinding({
        id: 'f1',
        createdAt: 1000,
        actions: [
          {
            id: 'a1',
            text: 'Calibrate gauge',
            dueDate: new Date(now - 3 * msPerDay).toISOString().slice(0, 10),
            assignee: { upn: 'jane@example.com', displayName: 'Jane Smith' },
            createdAt: 1000,
            deletedAt: null,
          },
        ],
      });

      const ctx = buildAIContext({ findings: [finding] });
      expect(ctx.findings?.overdueActions![0].assignee).toBe('Jane Smith');
    });
  });

  it('should include evidenceMapTopology when provided', () => {
    const context = buildAIContext({
      evidenceMapTopology: {
        factorNodes: [
          {
            factor: 'Machine',
            rSquaredAdj: 0.34,
            explored: true,
            findingCount: 1,
          },
          {
            factor: 'Shift',
            rSquaredAdj: 0.22,
            explored: false,
            findingCount: 0,
          },
        ],
        relationships: [
          { factorA: 'Machine', factorB: 'Shift', type: 'interactive', strength: 0.04 },
        ],
        convergencePoints: [],
      },
    });

    expect(context.investigation?.evidenceMapTopology).toBeDefined();
    expect(context.investigation?.evidenceMapTopology?.factorNodes).toHaveLength(2);
    expect(context.investigation?.evidenceMapTopology?.relationships).toHaveLength(1);
  });
});
