import { describe, expect, it } from 'vitest';
import type { DataRow, SpecLimits } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
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
