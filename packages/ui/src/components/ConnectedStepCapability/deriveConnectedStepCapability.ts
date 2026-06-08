import type { CapabilityBoxplotNode, StepErrorParetoStep } from '@variscout/charts';
import type { CanvasStepCardModel } from '@variscout/hooks';
import { calculateBoxplotStats, type BoxplotGroupData } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

export type ConnectedStepCapabilityMode = 'capability' | 'values';
export type ConnectedStepFlag = 'none' | 'no-data' | 'no-specs' | 'review' | 'capable' | 'watch';
export type ConnectedValueBaselineKind = 'spec-window' | 'zero';
export type ConnectedStepValueRole = 'measure' | 'time';

export interface ConnectedStepCapabilityValueModel {
  raw: number[];
  scaled: number[];
  boxplot: BoxplotGroupData | null;
  baselineKind: ConnectedValueBaselineKind;
  lower: number;
  upper: number;
  specLower?: number;
  specUpper?: number;
  target?: number;
}

export interface ConnectedStepCapabilityCpkModel {
  values: number[];
  boxplot: BoxplotGroupData | null;
  target?: number;
}

export interface ConnectedStepCapabilityStep {
  stepId: string;
  label: string;
  order: number;
  metricColumn?: string;
  flag: ConnectedStepFlag;
  capability: ConnectedStepCapabilityCpkModel;
  values: ConnectedStepCapabilityValueModel;
  errorCount: number;
  hasBranchLinks: boolean;
}

export interface ConnectedStepCapabilityModel {
  mode: ConnectedStepCapabilityMode;
  hasBranching: boolean;
  steps: ConnectedStepCapabilityStep[];
  errorSteps: ReadonlyArray<StepErrorParetoStep>;
}

export interface DeriveConnectedStepCapabilityInput {
  map: ProcessMap;
  mode: ConnectedStepCapabilityMode;
  stepCards: ReadonlyArray<CanvasStepCardModel>;
  capabilityNodes: ReadonlyArray<CapabilityBoxplotNode>;
  errorSteps: ReadonlyArray<StepErrorParetoStep>;
  valueRolesByStepId?: Readonly<Record<string, ConnectedStepValueRole>>;
}

function finiteNumbers(values: ReadonlyArray<unknown>): number[] {
  return values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );
}

function capabilityValues(node: CapabilityBoxplotNode | undefined): number[] {
  return finiteNumbers((node?.result.perContextResults ?? []).map(result => result.cpk));
}

function capabilityBoxplot(label: string, values: readonly number[]): BoxplotGroupData | null {
  if (values.length === 0) return null;
  return calculateBoxplotStats({ group: label, values: [...values] });
}

function roundScaled(value: number): number {
  return Number(value.toFixed(6));
}

function valueModel(
  card: CanvasStepCardModel | undefined,
  valueRole: ConnectedStepValueRole
): ConnectedStepCapabilityValueModel {
  const raw = finiteNumbers(card?.values ?? []);
  const specs = card?.specs;
  const hasTwoSidedSpecs =
    valueRole !== 'time' && specs?.lsl !== undefined && specs?.usl !== undefined;

  if (hasTwoSidedSpecs) {
    const lower = specs.lsl!;
    const upper = specs.usl!;
    const span = Math.max(upper - lower, 1);
    return {
      raw,
      scaled: raw.map(value => roundScaled((value - lower) / span)),
      boxplot: capabilityBoxplot(card?.stepName ?? card?.metricColumn ?? 'Values', raw),
      baselineKind: 'spec-window',
      lower,
      upper,
      specLower: lower,
      specUpper: upper,
      target: specs.target,
    };
  }

  const finite = raw.length > 0 ? raw : [0];
  const candidates = [...finite, specs?.usl, specs?.lsl, specs?.target].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );
  const upper = Math.max(...candidates.map(value => Math.abs(value)), 1);
  return {
    raw,
    scaled: raw.map(value => roundScaled(value / upper)),
    boxplot: capabilityBoxplot(card?.stepName ?? card?.metricColumn ?? 'Values', raw),
    baselineKind: 'zero',
    lower: 0,
    upper,
    specLower: specs?.lsl,
    specUpper: specs?.usl,
    target: specs?.target,
  };
}

function flagFor({
  card,
  node,
  values,
}: {
  card: CanvasStepCardModel | undefined;
  node: CapabilityBoxplotNode | undefined;
  values: readonly number[];
}): ConnectedStepFlag {
  if (!card && !node) return 'no-data';
  if (values.length === 0) {
    return card?.specs || node ? 'no-data' : 'no-specs';
  }
  if (node?.result.sampleConfidence !== undefined && node.result.sampleConfidence !== 'trust') {
    return 'review';
  }
  const target = node?.targetCpk ?? card?.capability.target ?? 1.33;
  return Math.min(...values) >= target ? 'capable' : 'watch';
}

export function deriveConnectedStepCapability({
  map,
  mode,
  stepCards,
  capabilityNodes,
  errorSteps,
  valueRolesByStepId = {},
}: DeriveConnectedStepCapabilityInput): ConnectedStepCapabilityModel {
  const cardsByStep = new Map(stepCards.map(card => [card.stepId, card]));
  const nodesByStep = new Map(capabilityNodes.map(node => [node.nodeId, node]));
  const errorsByStep = new Map(errorSteps.map(step => [step.nodeId, step.errorCount]));
  const branchStepIds = new Set<string>();
  for (const arrow of map.arrows ?? []) {
    branchStepIds.add(arrow.fromStepId);
    branchStepIds.add(arrow.toStepId);
  }
  for (const tributary of map.tributaries) {
    branchStepIds.add(tributary.stepId);
  }

  const hasBranching = (map.arrows?.length ?? 0) > 0 || map.tributaries.length > 0;
  const steps = [...map.nodes]
    .sort((a, b) => a.order - b.order)
    .map(step => {
      const card = cardsByStep.get(step.id);
      const node = nodesByStep.get(step.id);
      const cpkValues = capabilityValues(node);
      return {
        stepId: step.id,
        label: step.name,
        order: step.order,
        metricColumn: card?.metricColumn ?? step.ctqColumn,
        flag: flagFor({ card, node, values: cpkValues }),
        capability: {
          values: cpkValues,
          boxplot: capabilityBoxplot(step.name, cpkValues),
          target: node?.targetCpk ?? card?.capability.target,
        },
        values: valueModel(card, valueRolesByStepId[step.id] ?? 'measure'),
        errorCount: errorsByStep.get(step.id) ?? 0,
        hasBranchLinks: branchStepIds.has(step.id),
      };
    });

  return {
    mode,
    hasBranching,
    steps,
    errorSteps,
  };
}
