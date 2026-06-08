import {
  calculateBoxplotStats,
  computeBottleneck,
  computeOutputRate,
  parseTimeValue,
  type DataRow,
  type OutputRateResult,
  type StepTimingBinding,
} from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type { BoxplotGroupData } from '@variscout/core/stats';

const STEP_COLUMN = '__variscoutStepId';
const TIME_COLUMN = '__variscoutStepCompletedAt';

export interface ConnectedStepTimeStep {
  stepId: string;
  label: string;
  order: number;
  durationsMs: number[];
  durationBoxplot: BoxplotGroupData | null;
  outputRate?: OutputRateResult;
  isConstraint: boolean;
}

export interface ConnectedStepTimeModel {
  hasTimeData: boolean;
  steps: ConnectedStepTimeStep[];
}

export interface DeriveConnectedStepTimeInput {
  map: ProcessMap;
  rows: readonly DataRow[];
  stepTimings: readonly StepTimingBinding[];
}

function finiteDuration(value: number): number | null {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function durationValues(binding: StepTimingBinding, rows: readonly DataRow[]): number[] {
  const values: number[] = [];
  for (const row of rows) {
    if (binding.kind === 'paired') {
      const start = parseTimeValue(row[binding.startColumn]);
      const end = parseTimeValue(row[binding.endColumn]);
      if (start === null || end === null) continue;
      const duration = finiteDuration(end.getTime() - start.getTime());
      if (duration !== null) values.push(duration);
    } else {
      const raw = row[binding.durationColumn];
      const duration = typeof raw === 'number' ? finiteDuration(raw) : null;
      if (duration !== null) values.push(duration);
    }
  }
  return values;
}

function completionRows(binding: StepTimingBinding, rows: readonly DataRow[]): DataRow[] {
  if (binding.kind !== 'paired') return [];

  const out: DataRow[] = [];
  for (const row of rows) {
    const completedAt = parseTimeValue(row[binding.endColumn]);
    if (completedAt === null) continue;
    out.push({
      [STEP_COLUMN]: binding.stepId,
      [TIME_COLUMN]: completedAt.toISOString(),
    });
  }
  return out;
}

function boxplot(label: string, values: readonly number[]): BoxplotGroupData | null {
  if (values.length === 0) return null;
  return calculateBoxplotStats({ group: label, values: [...values] });
}

export function deriveConnectedStepTime({
  map,
  rows,
  stepTimings,
}: DeriveConnectedStepTimeInput): ConnectedStepTimeModel {
  const timingsByStep = new Map(stepTimings.map(binding => [binding.stepId, binding]));
  const completionRowsByStep = new Map<string, DataRow[]>();

  const steps = [...map.nodes]
    .sort((a, b) => a.order - b.order)
    .map(step => {
      const binding = timingsByStep.get(step.id);
      const durationsMs = binding ? durationValues(binding, rows) : [];
      const completions = binding ? completionRows(binding, rows) : [];
      if (completions.length > 0) completionRowsByStep.set(step.id, completions);

      return {
        stepId: step.id,
        label: step.name,
        order: step.order,
        durationsMs,
        durationBoxplot: boxplot(step.name, durationsMs),
        outputRate:
          completions.length > 0
            ? computeOutputRate(
                completions,
                TIME_COLUMN,
                { nodeId: step.id, stepColumn: STEP_COLUMN },
                'hour'
              )
            : undefined,
        isConstraint: false,
      };
    });

  const bottleneck = computeBottleneck(
    steps
      .filter(step => step.outputRate !== undefined)
      .map(step => ({
        nodeId: step.stepId,
        averageRatePerHour: step.outputRate!.averageRatePerHour,
      }))
  ).find(result => result.isBottleneck);

  return {
    hasTimeData: steps.some(step => step.durationsMs.length > 0),
    steps: steps.map(step => ({
      ...step,
      isConstraint: step.stepId === bottleneck?.nodeId,
    })),
  };
}
