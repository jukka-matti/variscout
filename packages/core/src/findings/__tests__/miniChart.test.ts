import { describe, it, expect } from 'vitest';
import { deriveIPReportMiniChartType, deriveMiniChartConfig } from '../miniChart';
import type { Hypothesis } from '../types';
import type { ImprovementProject } from '../../improvementProject';

const hub = (condition: Hypothesis['condition']): Hypothesis =>
  ({
    id: 'h1',
    name: 'test',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'proposed',
    investigationId: 'inv-1',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    condition,
  }) as Hypothesis;

describe('deriveMiniChartConfig', () => {
  it('returns i-chart for numeric leaf factor', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'TEMP', op: 'gt', value: 95 }),
      { TEMP: 'numeric' },
      'thickness'
    );
    expect(cfg).toEqual({ kind: 'i-chart', factor: 'TEMP', outcome: 'thickness' });
  });

  it('returns i-chart for date leaf factor (time-ordered)', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'shift_start', op: 'gte', value: 0 }),
      { shift_start: 'date' },
      'thickness'
    );
    expect(cfg).toEqual({ kind: 'i-chart', factor: 'shift_start', outcome: 'thickness' });
  });

  it('returns boxplot for categorical leaf factor when outcome present', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
      { SUPPLIER: 'categorical' },
      'thickness'
    );
    expect(cfg).toEqual({ kind: 'boxplot', factor: 'SUPPLIER', outcome: 'thickness' });
  });

  it('returns placeholder for categorical leaf when outcome missing', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' }),
      { SUPPLIER: 'categorical' },
      undefined
    );
    expect(cfg).toEqual({ kind: 'placeholder', factor: 'SUPPLIER', reason: 'no-outcome' });
  });

  it('returns placeholder for text factor', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'NOTES', op: 'eq', value: 'x' }),
      { NOTES: 'text' },
      'thickness'
    );
    expect(cfg).toEqual({ kind: 'placeholder', factor: 'NOTES', reason: 'unsupported-type' });
  });

  it('returns placeholder when condition is undefined', () => {
    const cfg = deriveMiniChartConfig(hub(undefined), {}, 'thickness');
    expect(cfg).toEqual({ kind: 'placeholder', reason: 'no-condition' });
  });

  it('returns placeholder reason no-factor for empty AND children', () => {
    const cfg = deriveMiniChartConfig(hub({ kind: 'and', children: [] }), {}, 'thickness');
    expect(cfg).toEqual({ kind: 'placeholder', reason: 'no-factor' });
  });

  it('descends into AND branch and uses first leaf column', () => {
    const cfg = deriveMiniChartConfig(
      hub({
        kind: 'and',
        children: [
          { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' },
          { kind: 'leaf', column: 'TEMP', op: 'gt', value: 95 },
        ],
      }),
      { SUPPLIER: 'categorical', TEMP: 'numeric' },
      'thickness'
    );
    expect(cfg.factor).toBe('SUPPLIER');
    expect(cfg.kind).toBe('boxplot');
  });

  it('returns placeholder when factor column is unknown', () => {
    const cfg = deriveMiniChartConfig(
      hub({ kind: 'leaf', column: 'GHOST', op: 'eq', value: 'x' }),
      {},
      'thickness'
    );
    expect(cfg).toEqual({ kind: 'placeholder', factor: 'GHOST', reason: 'unknown-column' });
  });
});

const ip = (overrides: Partial<ImprovementProject> = {}): ImprovementProject =>
  ({
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'active',
    metadata: { title: 'Fill Cpk lift', investigationId: 'inv-1' },
    goal: {
      outcomeGoal: { outcomeSpecId: 'fill', target: 1.33 },
      factorControls: [],
    },
    sections: {
      background: {},
      investigationLineage: { hypothesisIds: ['h1'], findingIds: [] },
      approach: {},
      outcomeReference: {},
    },
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    ...overrides,
  }) as ImprovementProject;

describe('deriveIPReportMiniChartType', () => {
  it('maps linked factor controls to a factor I-chart with target band', () => {
    const chartType = deriveIPReportMiniChartType({
      ip: ip({
        goal: {
          outcomeGoal: { outcomeSpecId: 'fill', target: 1.33 },
          factorControls: [
            { factor: 'nozzle.temp', targetCondition: '95±2°C', linkedHypothesisId: 'h1' },
          ],
        },
      }),
      hypothesis: hub({ kind: 'leaf', column: 'supplier', op: 'eq', value: 'A' }),
      linkedFindings: [],
      outcome: 'fill',
    });

    expect(chartType).toBe('ichart-factor-target-band');
  });

  it('maps subgroup classification hypotheses to a subgroup boxplot', () => {
    const chartType = deriveIPReportMiniChartType({
      ip: ip(),
      hypothesis: hub({ kind: 'leaf', column: 'supplier', op: 'eq', value: 'A' }),
      linkedFindings: [],
      outcome: 'fill',
    });

    expect(chartType).toBe('boxplot-by-subgroup');
  });

  it('maps linked mechanism findings to a capability histogram', () => {
    const chartType = deriveIPReportMiniChartType({
      ip: ip({
        goal: {
          outcomeGoal: { outcomeSpecId: 'fill', target: 1.33 },
          mechanismGoals: [{ description: 'Nozzle wear', linkedFindingIds: ['f1'] }],
        },
      }),
      hypothesis: hub(undefined),
      linkedFindings: [
        {
          id: 'f1',
          text: 'Nozzle wear narrows capability.',
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'data',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 0,
          investigationId: 'inv-1',
          createdAt: 0,
          deletedAt: null,
        },
      ],
      outcome: 'fill',
    });

    expect(chartType).toBe('capability-histogram');
  });

  it('prioritizes linked mechanism findings over generic subgroup conditions', () => {
    const chartType = deriveIPReportMiniChartType({
      ip: ip({
        goal: {
          outcomeGoal: { outcomeSpecId: 'fill', target: 1.33 },
          mechanismGoals: [{ description: 'Nozzle wear', linkedFindingIds: ['f1'] }],
        },
      }),
      hypothesis: hub({ kind: 'leaf', column: 'supplier', op: 'eq', value: 'A' }),
      linkedFindings: [
        {
          id: 'f1',
          text: 'Nozzle wear narrows capability.',
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'data',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 0,
          investigationId: 'inv-1',
          createdAt: 0,
          deletedAt: null,
        },
      ],
      outcome: 'fill',
    });

    expect(chartType).toBe('capability-histogram');
  });

  it('falls back to an outcome I-chart with target band', () => {
    const chartType = deriveIPReportMiniChartType({
      ip: ip(),
      hypothesis: hub(undefined),
      linkedFindings: [],
      outcome: 'fill',
    });

    expect(chartType).toBe('ichart-outcome-target-band');
  });
});
