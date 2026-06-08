import { describe, expect, it } from 'vitest';
import type { DataRow } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import { createTestStepTiming } from '../../../test-utils/stepTiming';
import { deriveConnectedStepTime } from '../deriveConnectedStepTime';

function mapWithSteps(): ProcessMap {
  return {
    version: 1,
    nodes: [
      { id: 'fill', name: 'Fill', order: 1 },
      { id: 'mix', name: 'Mix', order: 0 },
      { id: 'seal', name: 'Seal', order: 2 },
    ],
    tributaries: [],
    arrows: [],
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z',
  };
}

const pairedRows: DataRow[] = [
  {
    mix_start: '2026-06-08T08:00:00Z',
    mix_end: '2026-06-08T08:05:00Z',
    fill_start: '2026-06-08T08:05:00Z',
    fill_end: '2026-06-08T08:35:00Z',
  },
  {
    mix_start: '2026-06-08T08:10:00Z',
    mix_end: '2026-06-08T08:15:00Z',
    fill_start: '2026-06-08T09:00:00Z',
    fill_end: '2026-06-08T09:30:00Z',
  },
  {
    mix_start: '2026-06-08T08:20:00Z',
    mix_end: '2026-06-08T08:25:00Z',
    fill_start: '2026-06-08T10:00:00Z',
    fill_end: '2026-06-08T10:30:00Z',
  },
];

describe('deriveConnectedStepTime', () => {
  it('orders steps by process-map order', () => {
    const model = deriveConnectedStepTime({
      map: mapWithSteps(),
      rows: [],
      stepTimings: [],
    });

    expect(model.steps.map(step => step.stepId)).toEqual(['mix', 'fill', 'seal']);
  });

  it('derives paired duration boxplots and marks the lowest output rate as the constraint', () => {
    const model = deriveConnectedStepTime({
      map: mapWithSteps(),
      rows: pairedRows,
      stepTimings: [
        createTestStepTiming({
          stepId: 'mix',
          startColumn: 'mix_start',
          endColumn: 'mix_end',
        }),
        createTestStepTiming({
          stepId: 'fill',
          startColumn: 'fill_start',
          endColumn: 'fill_end',
        }),
      ],
    });

    expect(model.hasTimeData).toBe(true);
    expect(model.steps.find(step => step.stepId === 'mix')?.durationsMs).toEqual([
      300000, 300000, 300000,
    ]);
    expect(model.steps.find(step => step.stepId === 'fill')?.durationBoxplot).toMatchObject({
      min: 1800000,
      median: 1800000,
      max: 1800000,
    });
    expect(model.steps.find(step => step.stepId === 'mix')?.outputRate?.averageRatePerHour).toBe(3);
    expect(model.steps.find(step => step.stepId === 'fill')?.outputRate?.averageRatePerHour).toBe(
      1
    );
    expect(model.steps.filter(step => step.isConstraint).map(step => step.stepId)).toEqual([
      'fill',
    ]);
  });

  it('derives duration-binding distributions without inventing output-rate buckets', () => {
    const model = deriveConnectedStepTime({
      map: mapWithSteps(),
      rows: [
        { seal_duration: 1200 },
        { seal_duration: 1800 },
        { seal_duration: 2400 },
        { seal_duration: null },
      ],
      stepTimings: [
        createTestStepTiming({
          kind: 'duration',
          stepId: 'seal',
          durationColumn: 'seal_duration',
        }),
      ],
    });

    const seal = model.steps.find(step => step.stepId === 'seal');
    expect(model.hasTimeData).toBe(true);
    expect(seal?.durationsMs).toEqual([1200, 1800, 2400]);
    expect(seal?.outputRate).toBeUndefined();
    expect(model.steps.some(step => step.isConstraint)).toBe(false);
  });

  it('reports no time data when bindings contain no finite durations', () => {
    const model = deriveConnectedStepTime({
      map: mapWithSteps(),
      rows: [{ mix_start: null, mix_end: null }],
      stepTimings: [
        createTestStepTiming({
          stepId: 'mix',
          startColumn: 'mix_start',
          endColumn: 'mix_end',
        }),
      ],
    });

    expect(model.hasTimeData).toBe(false);
    expect(model.steps.find(step => step.stepId === 'mix')?.durationBoxplot).toBeNull();
  });

  it('does not expose capability or ranking language in UI-facing fields', () => {
    const model = deriveConnectedStepTime({
      map: mapWithSteps(),
      rows: pairedRows,
      stepTimings: [
        createTestStepTiming({
          stepId: 'mix',
          startColumn: 'mix_start',
          endColumn: 'mix_end',
        }),
      ],
    });
    const serialized = JSON.stringify(model).toLowerCase();

    expect(serialized).not.toContain('worst');
    expect(serialized).not.toContain('capability');
    expect(serialized).not.toContain('rank');
  });
});
