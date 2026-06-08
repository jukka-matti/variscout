import { describe, expect, it } from 'vitest';
import { deriveConnectedStepCapability } from '../deriveConnectedStepCapability';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ProcessMap } from '@variscout/core/frame';
import type { CapabilityBoxplotNode } from '@variscout/charts';
import type { NodeCapabilityResult } from '@variscout/core/stats';

function mapWithSteps(): ProcessMap {
  return {
    version: 1,
    nodes: [
      { id: 'fill', name: 'Fill', order: 1, ctqColumn: 'Fill_Weight' },
      { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Mix_Temp' },
      { id: 'seal', name: 'Seal', order: 2, ctqColumn: 'Seal_Time' },
    ],
    tributaries: [],
    arrows: [{ id: 'mix-fill', fromStepId: 'mix', toStepId: 'fill' }],
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z',
  };
}

function stepCard(
  overrides: Partial<CanvasStepCardModel> & { stepId: string }
): CanvasStepCardModel {
  const { stepId, ...rest } = overrides;
  return {
    stepId,
    stepName: stepId,
    assignedColumns: [],
    metricColumn: 'Measure',
    metricKind: 'numeric',
    values: [],
    distribution: [],
    capability: { state: 'no-specs', n: 0, canAddSpecs: true },
    ...rest,
  };
}

function capabilityNode(opts: {
  nodeId: string;
  label: string;
  cpks: number[];
  targetCpk?: number;
  confidence?: 'trust' | 'review' | 'insufficient';
  scalarCpk?: number;
}): CapabilityBoxplotNode {
  const confidence = opts.confidence ?? 'trust';
  const result: NodeCapabilityResult = {
    nodeId: opts.nodeId,
    cpk: opts.scalarCpk,
    cp: undefined,
    n: opts.cpks.length * 10,
    sampleConfidence: confidence,
    source: 'column',
    perContextResults: opts.cpks.map((cpk, index) => ({
      contextTuple: { product: `P${index}` },
      cpk,
      n: 10,
      sampleConfidence: confidence,
    })),
  };
  return { nodeId: opts.nodeId, label: opts.label, targetCpk: opts.targetCpk, result };
}

describe('deriveConnectedStepCapability', () => {
  it('orders steps by process-map order instead of capability-node input order', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'capability',
      stepCards: [],
      capabilityNodes: [
        capabilityNode({ nodeId: 'fill', label: 'Fill', cpks: [0.9] }),
        capabilityNode({ nodeId: 'mix', label: 'Mix', cpks: [1.5] }),
      ],
      errorSteps: [],
    });
    expect(model.steps.map(step => step.stepId)).toEqual(['mix', 'fill', 'seal']);
  });

  it('uses per-context Cpk values even when mixed specs leave scalar cpk undefined', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'capability',
      stepCards: [],
      capabilityNodes: [
        capabilityNode({ nodeId: 'mix', label: 'Mix', cpks: [1.45, 0.82], targetCpk: 1.33 }),
      ],
      errorSteps: [],
    });
    expect(model.steps[0]?.capability.values).toEqual([1.45, 0.82]);
    expect(model.steps[0]?.flag).toBe('watch');
  });

  it('derives five-number boxplot statistics from each step Cpk distribution', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'capability',
      stepCards: [],
      capabilityNodes: [
        capabilityNode({ nodeId: 'mix', label: 'Mix', cpks: [0.8, 1.0, 1.2, 1.4, 1.6] }),
      ],
      errorSteps: [],
    });

    expect(model.steps[0]?.capability.boxplot).toMatchObject({
      min: 0.8,
      q1: 1,
      median: 1.2,
      q3: 1.4,
      max: 1.6,
    });
  });

  it('keeps raw values while using two-sided specs as the harmonized spec window', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'values',
      stepCards: [
        stepCard({
          stepId: 'mix',
          values: [60, 65, 70],
          specs: { lsl: 60, usl: 70, target: 65 },
        }),
      ],
      capabilityNodes: [],
      errorSteps: [],
    });
    expect(model.steps[0]?.values.raw).toEqual([60, 65, 70]);
    expect(model.steps[0]?.values.baselineKind).toBe('spec-window');
    expect(model.steps[0]?.values.scaled).toEqual([0, 0.5, 1]);
  });

  it('uses zero baseline for one-sided ratio-style specs', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'values',
      stepCards: [
        stepCard({
          stepId: 'fill',
          values: [0, 2, 4],
          specs: { usl: 4, target: 0 },
        }),
      ],
      capabilityNodes: [],
      errorSteps: [],
    });
    expect(model.steps[1]?.values.baselineKind).toBe('zero');
    expect(model.steps[1]?.values.scaled).toEqual([0, 0.5, 1]);
  });

  it('uses zero baseline for time values', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'values',
      valueRolesByStepId: { seal: 'time' },
      stepCards: [
        stepCard({
          stepId: 'seal',
          metricColumn: 'Seal_Time',
          values: [0, 30, 60],
          specs: { lsl: 25, usl: 45 },
        }),
      ],
      capabilityNodes: [],
      errorSteps: [],
    });
    expect(model.steps[2]?.values.baselineKind).toBe('zero');
    expect(model.steps[2]?.values.scaled).toEqual([0, 0.5, 1]);
  });

  it('does not expose ranking fields', () => {
    const model = deriveConnectedStepCapability({
      map: mapWithSteps(),
      mode: 'capability',
      stepCards: [],
      capabilityNodes: [capabilityNode({ nodeId: 'fill', label: 'Fill', cpks: [0.72] })],
      errorSteps: [],
    });
    const serialized = JSON.stringify(model).toLowerCase();
    expect(serialized).not.toContain('rank');
    expect(serialized).not.toContain('worst');
  });
});
