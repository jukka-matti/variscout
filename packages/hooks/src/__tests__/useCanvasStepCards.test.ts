import { describe, expect, it } from 'vitest';
import type { DataRow, SpecLimits, StepCapabilityStamp } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import {
  NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD,
  SPARKLINE_LTTB_THRESHOLD,
} from '@variscout/core/canvas';
import {
  CANVAS_LENS_REGISTRY,
  buildCanvasStepCards,
  coerceCanvasLens,
  enabledCanvasLenses,
} from '../useCanvasStepCards';

const baseMap = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [
    { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Temperature' },
    { id: 'fill', name: 'Fill', order: 1 },
    { id: 'pack', name: 'Pack', order: 2 },
  ],
  tributaries: [],
  assignments: {
    Machine: 'mix',
    Pressure: 'fill',
    Operator: 'fill',
  },
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
  ...overrides,
});

const rows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
  Temperature: i < 20 ? 99 + (i % 3) : 101 + (i % 4),
  Pressure: 48 + (i % 5),
  Machine: i % 2 === 0 ? 'A' : 'B',
  Operator: i % 3 === 0 ? 'Jill' : 'Kai',
}));

describe('canvas lens registry', () => {
  it('enables default, capability, and defect while leaving future lenses registered', () => {
    expect(enabledCanvasLenses().map(lens => lens.id)).toEqual(['default', 'capability', 'defect']);
    expect(CANVAS_LENS_REGISTRY.performance.enabled).toBe(false);
    expect(CANVAS_LENS_REGISTRY.yamazumi.enabled).toBe(false);
  });

  it('coerces disabled or unknown lens ids back to default', () => {
    expect(coerceCanvasLens('capability')).toBe('capability');
    expect(coerceCanvasLens('performance')).toBe('default');
    expect(coerceCanvasLens('unknown')).toBe('default');
  });
});

describe('buildCanvasStepCards drift integration', () => {
  const measureSpecs: Record<string, SpecLimits> = {
    Temperature: { lsl: 95, usl: 105, target: 100, characteristicType: 'nominal' },
  };

  it('leaves drift undefined when priorStepStats is absent', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs,
    });

    expect(cards[0].drift).toBeUndefined();
  });

  it('leaves drift undefined when priorStepStats has no matching step', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs,
      priorStepStats: new Map(),
    });

    expect(cards[0].drift).toBeUndefined();
  });

  it('stamps drift when priorStepStats contains a comparable prior stat', () => {
    const tightRows: DataRow[] = Array.from({ length: 30 }, (_, i) => ({
      Temperature: 100 + (i % 2 === 0 ? 0.5 : -0.5),
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));
    const priorStepStats = new Map<string, StepCapabilityStamp>([
      ['mix', { stepId: 'mix', n: 30, mean: 110, cpk: 0.3 }],
    ]);

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: tightRows,
      measureSpecs,
      priorStepStats,
    });

    expect(cards[0].drift).toBeDefined();
    expect(cards[0].drift?.metric).toBe('cpk');
  });
});

describe('buildCanvasStepCards numeric render hint + time-series points', () => {
  it('exports the numeric time-series distinct-count threshold', () => {
    expect(NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD).toBe(30);
  });

  it('exports the sparkline LTTB threshold', () => {
    expect(SPARKLINE_LTTB_THRESHOLD).toBe(100);
  });

  it('marks numeric cards with 30 or fewer distinct values as histogram', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
    });

    expect(cards[0].metricKind).toBe('numeric');
    expect(cards[0].numericRenderHint).toBe('histogram');
    expect(cards[0].timeSeriesPoints).toBeUndefined();
  });

  it('marks numeric cards with more than 30 distinct values as time-series', () => {
    const wideRows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
      Temperature: 100 + i * 0.1,
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });

    expect(cards[0].numericRenderHint).toBe('time-series');
    expect(cards[0].timeSeriesPoints).toHaveLength(40);
  });

  it('orders time-series points by parser-detected time when all metric rows parse', () => {
    const wideRows: DataRow[] = [
      { Timestamp: '2026-01-03T00:00:00Z', Temperature: 102.3 },
      { Timestamp: '2026-01-01T00:00:00Z', Temperature: 100.1 },
      { Timestamp: '2026-01-02T00:00:00Z', Temperature: 101.2 },
      ...Array.from({ length: 35 }, (_, i) => ({
        Timestamp: new Date(Date.UTC(2026, 1, i + 1)).toISOString(),
        Temperature: 103 + i * 0.1,
      })),
    ];

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });

    expect(cards[0].timeSeriesPoints?.[0]?.y).toBeCloseTo(100.1, 5);
    expect(cards[0].timeSeriesPoints?.[1]?.y).toBeCloseTo(101.2, 5);
    expect(cards[0].timeSeriesPoints?.[2]?.y).toBeCloseTo(102.3, 5);
  });

  it('falls back to row-index x values when no time column is detected', () => {
    const wideRows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
      Temperature: 100 + i * 0.1,
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });

    expect(cards[0].timeSeriesPoints?.[0]).toEqual({ x: 0, y: 100 });
    expect(cards[0].timeSeriesPoints?.[39]).toEqual({ x: 39, y: 103.9 });
  });

  it('falls back to row-index x values when any metric row has an unparseable time', () => {
    const wideRows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
      Timestamp: i === 0 ? 'not-a-date' : `2026-01-${String(i).padStart(2, '0')}T00:00:00Z`,
      Temperature: 100 + i * 0.1,
    }));

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });

    expect(cards[0].timeSeriesPoints?.[0]).toEqual({ x: 0, y: 100 });
    expect(cards[0].timeSeriesPoints?.[1]).toEqual({ x: 1, y: 100.1 });
  });

  it('downs samples above 100 points via LTTB', () => {
    const wideRows: DataRow[] = Array.from({ length: 250 }, (_, i) => ({
      Temperature: 100 + Math.sin(i / 5) * 5 + i / 1000,
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));

    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });

    expect(cards[0].timeSeriesPoints!.length).toBeLessThanOrEqual(SPARKLINE_LTTB_THRESHOLD);
    expect(cards[0].timeSeriesPoints!.length).toBeGreaterThanOrEqual(98);
  });

  it('does not assign a numeric render hint for non-numeric cards', () => {
    const cards = buildCanvasStepCards({
      map: {
        ...baseMap(),
        assignments: { Operator: 'pack' },
      },
      rows,
      measureSpecs: {},
    });
    const packCard = cards.find(card => card.stepId === 'pack')!;

    expect(packCard.metricKind).toBe('categorical');
    expect(packCard.numericRenderHint).toBeUndefined();
  });
});

describe('buildCanvasStepCards', () => {
  it('uses node.ctqColumn before assigned columns when deriving the metric column', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(cards[0]).toMatchObject({
      stepId: 'mix',
      stepName: 'Mix',
      metricColumn: 'Temperature',
      metricKind: 'numeric',
      assignedColumns: ['Machine'],
    });
  });

  it('falls back to the first numeric assigned column before categorical assigned columns', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(cards[1]).toMatchObject({
      stepId: 'fill',
      metricColumn: 'Pressure',
      metricKind: 'numeric',
      assignedColumns: ['Pressure', 'Operator'],
    });
  });

  it('uses a categorical assigned column when no numeric metric exists', () => {
    const cards = buildCanvasStepCards({
      map: {
        ...baseMap(),
        assignments: { Operator: 'pack' },
      },
      rows,
      measureSpecs: {},
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(cards[2]).toMatchObject({
      stepId: 'pack',
      metricColumn: 'Operator',
      metricKind: 'categorical',
      distribution: [
        { label: 'Kai', count: 26 },
        { label: 'Jill', count: 14 },
      ],
    });
  });

  it('renders no-spec fallback as mean, sigma, and sample count with add-specs affordance', () => {
    const [card] = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(card.capability).toMatchObject({
      state: 'no-specs',
      canAddSpecs: true,
      n: 40,
    });
    expect(card.stats?.mean).toBeGreaterThan(0);
    expect(card.stats?.stdDev).toBeGreaterThan(0);
  });

  it('suppresses Cpk for n below 10 even when specs are present', () => {
    const [card] = buildCanvasStepCards({
      map: baseMap(),
      rows: rows.slice(0, 9),
      measureSpecs: { Temperature: { lsl: 90, usl: 110, cpkTarget: 1.33 } },
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(card.capability).toMatchObject({
      state: 'suppressed',
      confidence: 'insufficient',
      n: 9,
    });
    expect(card.capability.cpk).toBeUndefined();
  });

  it('badges Cpk as review for 10 to 29 samples and grades trusted samples', () => {
    const specs: Record<string, SpecLimits> = {
      Temperature: { lsl: 90, usl: 110, cpkTarget: 1.33 },
    };
    const [reviewCard] = buildCanvasStepCards({
      map: baseMap(),
      rows: rows.slice(0, 20),
      measureSpecs: specs,
      capabilityNodes: [],
      errorSteps: [],
    });
    const [trustedCard] = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: specs,
      capabilityNodes: [],
      errorSteps: [],
    });

    expect(reviewCard.capability.state).toBe('review');
    expect(reviewCard.capability.confidence).toBe('review');
    expect(reviewCard.capability.cpk).toBeDefined();
    expect(trustedCard.capability.state).toBe('graded');
    expect(trustedCard.capability.confidence).toBe('trust');
    expect(trustedCard.capability.grade).toMatch(/green|amber|red/);
  });

  it('projects capability and defect lens metrics onto matching cards', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: { Temperature: { lsl: 90, usl: 110, cpkTarget: 1.33 } },
      capabilityNodes: [
        {
          nodeId: 'mix',
          label: 'Mix',
          targetCpk: 1.67,
          result: { nodeId: 'mix', metrics: [], summary: { n: 40, meanCpk: 1.5 } },
        },
      ],
      errorSteps: [{ nodeId: 'mix', label: 'Mix', errorCount: 7 }],
    });

    expect(cards[0].capabilityNode?.targetCpk).toBe(1.67);
    expect(cards[0].defectCount).toBe(7);
  });
});
