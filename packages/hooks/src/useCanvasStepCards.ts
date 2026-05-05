import { useMemo } from 'react';
import { calculateStats, type DataRow, type SpecLimits, type StatsResult } from '@variscout/core';
import { gradeCpk, type CpkGrade } from '@variscout/core/capability';
import { sampleConfidenceFor } from '@variscout/core/stats';
import type { ProcessMap } from '@variscout/core/frame';

export type CanvasLensId = 'default' | 'capability' | 'defect' | 'performance' | 'yamazumi';

export interface CanvasLensDefinition {
  id: CanvasLensId;
  label: string;
  enabled: boolean;
  description: string;
}

export const CANVAS_LENS_REGISTRY: Record<CanvasLensId, CanvasLensDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    enabled: true,
    description: 'Step metrics, specs, and current card state.',
  },
  capability: {
    id: 'capability',
    label: 'Capability',
    enabled: true,
    description: 'Capability, Cpk trust, and step health.',
  },
  defect: {
    id: 'defect',
    label: 'Defect',
    enabled: true,
    description: 'Defect counts projected onto process steps.',
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    enabled: false,
    description: 'Future within-step channel lens.',
  },
  yamazumi: {
    id: 'yamazumi',
    label: 'Yamazumi',
    enabled: false,
    description: 'Future time-study lens.',
  },
};

export function enabledCanvasLenses(): CanvasLensDefinition[] {
  return Object.values(CANVAS_LENS_REGISTRY).filter(lens => lens.enabled);
}

export function coerceCanvasLens(value: unknown): CanvasLensId {
  if (typeof value !== 'string') return 'default';
  const lens = CANVAS_LENS_REGISTRY[value as CanvasLensId];
  return lens?.enabled ? lens.id : 'default';
}

export interface CanvasStepCategory {
  label: string;
  count: number;
}

export type CanvasStepMetricKind = 'numeric' | 'categorical' | 'empty';
export type CanvasStepCapabilityState =
  | 'no-specs'
  | 'partial-specs'
  | 'suppressed'
  | 'review'
  | 'graded'
  | 'unavailable';

export interface CanvasStepCapability {
  state: CanvasStepCapabilityState;
  n: number;
  confidence?: ReturnType<typeof sampleConfidenceFor>;
  cpk?: number;
  target?: number;
  grade?: CpkGrade;
  canAddSpecs: boolean;
}

export interface CanvasStepCardModel {
  stepId: string;
  stepName: string;
  parentStepId?: string | null;
  assignedColumns: string[];
  metricColumn?: string;
  metricKind: CanvasStepMetricKind;
  values: number[];
  distribution: CanvasStepCategory[];
  stats?: StatsResult;
  specs?: SpecLimits;
  capability: CanvasStepCapability;
  capabilityNode?: CanvasCapabilityNodeProjection;
  defectCount?: number;
}

export interface CanvasCapabilityNodeProjection {
  nodeId: string;
  label: string;
  targetCpk?: number;
  result?: unknown;
}

export interface CanvasStepErrorProjection {
  nodeId: string;
  label: string;
  errorCount: number;
}

export interface BuildCanvasStepCardsArgs {
  map: ProcessMap;
  rows: readonly DataRow[];
  measureSpecs: Record<string, SpecLimits>;
  capabilityNodes?: readonly CanvasCapabilityNodeProjection[];
  errorSteps?: readonly CanvasStepErrorProjection[];
}

export type UseCanvasStepCardsArgs = BuildCanvasStepCardsArgs;

function finiteNumberFromCell(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function valuesForColumn(rows: readonly DataRow[], column: string): number[] {
  const values: number[] = [];
  for (const row of rows) {
    const value = finiteNumberFromCell(row[column]);
    if (value !== null) values.push(value);
  }
  return values;
}

function distributionForColumn(rows: readonly DataRow[], column: string): CanvasStepCategory[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[column];
    if (raw === null || raw === undefined || raw === '') continue;
    const label = String(raw);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function columnsByStep(map: ProcessMap): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const push = (stepId: string, column: string) => {
    const current = out.get(stepId) ?? [];
    if (!current.includes(column)) current.push(column);
    out.set(stepId, current);
  };

  for (const [column, stepId] of Object.entries(map.assignments ?? {})) push(stepId, column);
  for (const tributary of map.tributaries) push(tributary.stepId, tributary.column);

  return out;
}

function metricColumnFor({
  ctqColumn,
  assignedColumns,
  rows,
}: {
  ctqColumn?: string;
  assignedColumns: readonly string[];
  rows: readonly DataRow[];
}): string | undefined {
  if (ctqColumn) return ctqColumn;
  return (
    assignedColumns.find(column => valuesForColumn(rows, column).length > 0) ?? assignedColumns[0]
  );
}

function capabilityFor({
  values,
  stats,
  specs,
}: {
  values: readonly number[];
  stats: StatsResult | undefined;
  specs: SpecLimits | undefined;
}): CanvasStepCapability {
  const n = values.length;
  const hasAnySpec =
    specs?.lsl !== undefined || specs?.usl !== undefined || specs?.target !== undefined;
  const hasCapabilityLimit = specs?.lsl !== undefined || specs?.usl !== undefined;

  if (!hasAnySpec) return { state: 'no-specs', n, canAddSpecs: true };
  if (!hasCapabilityLimit) return { state: 'partial-specs', n, canAddSpecs: true };

  const confidence = sampleConfidenceFor(n);
  if (confidence === 'insufficient') {
    return { state: 'suppressed', n, confidence, target: specs?.cpkTarget, canAddSpecs: false };
  }

  if (!stats?.cpk || !Number.isFinite(stats.cpk)) {
    return { state: 'unavailable', n, confidence, target: specs?.cpkTarget, canAddSpecs: false };
  }

  const target = specs?.cpkTarget ?? 1.33;
  return {
    state: confidence === 'review' ? 'review' : 'graded',
    n,
    confidence,
    cpk: stats.cpk,
    target,
    grade: gradeCpk(stats.cpk, target),
    canAddSpecs: false,
  };
}

export function buildCanvasStepCards({
  map,
  rows,
  measureSpecs,
  capabilityNodes = [],
  errorSteps = [],
}: BuildCanvasStepCardsArgs): CanvasStepCardModel[] {
  const assignedByStep = columnsByStep(map);

  return [...map.nodes]
    .sort((a, b) => a.order - b.order)
    .map(node => {
      const assignedColumns = assignedByStep.get(node.id) ?? [];
      const metricColumn = metricColumnFor({ ctqColumn: node.ctqColumn, assignedColumns, rows });
      const values = metricColumn ? valuesForColumn(rows, metricColumn) : [];
      const metricKind: CanvasStepMetricKind =
        metricColumn === undefined ? 'empty' : values.length > 0 ? 'numeric' : 'categorical';
      const specs = metricColumn ? measureSpecs[metricColumn] : undefined;
      const stats =
        metricKind === 'numeric' ? calculateStats(values, specs?.usl, specs?.lsl) : undefined;
      const distribution =
        metricKind === 'categorical' && metricColumn
          ? distributionForColumn(rows, metricColumn)
          : [];
      const capabilityNode = capabilityNodes.find(entry => entry.nodeId === node.id);
      const defectCount = errorSteps.find(entry => entry.nodeId === node.id)?.errorCount;

      return {
        stepId: node.id,
        stepName: node.name,
        parentStepId: node.parentStepId,
        assignedColumns,
        metricColumn,
        metricKind,
        values,
        distribution,
        stats,
        specs,
        capability: capabilityFor({ values, stats, specs }),
        capabilityNode,
        defectCount,
      };
    });
}

export interface UseCanvasStepCardsResult {
  cards: CanvasStepCardModel[];
}

export function useCanvasStepCards(args: UseCanvasStepCardsArgs): UseCanvasStepCardsResult {
  const cards = useMemo(
    () => buildCanvasStepCards(args),
    [args.map, args.rows, args.measureSpecs, args.capabilityNodes, args.errorSteps]
  );

  return { cards };
}
