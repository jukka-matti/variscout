import * as d3 from 'd3-array';
import type { DataRow, SpecLimits } from './types';
import { toNumericValue } from './types';
import { calculateMovingRangeSigma } from './stats/basic';
import { safeDivide } from './stats/safeMath';

export type ProcessMomentBoundary =
  | { type: 'column-value'; column: string; value: string | number | boolean }
  | { type: 'stage'; column: string; stage: string | number | boolean }
  | { type: 'factor-level'; factor: string; level: string | number | boolean }
  | { type: 'manual-range'; startIndex: number; endIndex: number };

export interface ProcessMomentDefinition {
  id: string;
  name: string;
  outcomeColumn: string;
  boundary: ProcessMomentBoundary;
  specs?: SpecLimits;
  cpkTarget?: number;
  comparableStage?: string;
}

export type ProcessMomentStatus = 'green' | 'amber' | 'red' | 'insufficient';
export type ProcessMomentInsufficientReason =
  | 'n-below-5'
  | 'missing-specs'
  | 'zero-sigma'
  | 'invalid-outcome-values';

export interface ProcessMomentResult {
  id: string;
  name: string;
  outcomeColumn: string;
  boundary: ProcessMomentBoundary;
  n: number;
  mean?: number;
  sigmaWithin?: number;
  cp?: number;
  cpk?: number;
  cpkTarget: number;
  status: ProcessMomentStatus;
  insufficientReason?: ProcessMomentInsufficientReason;
  comparableStage?: string;
}

export interface ComparableProcessMomentSummary {
  comparableStage: string;
  momentCount: number;
  sufficientCount: number;
  averageCp?: number;
  averageCpk?: number;
  minCpk?: number;
  status: ProcessMomentStatus;
}

export interface ProcessMomentFindingClue {
  branchId: string;
  finding: {
    text: string;
    validationStatus: 'supports' | 'contradicts' | 'inconclusive';
    processMomentId: string;
  };
}

function formatMomentNumber(value: number): string {
  if (!Number.isFinite(value)) return 'unknown';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function rowMatchesBoundary(row: DataRow, index: number, boundary: ProcessMomentBoundary): boolean {
  if (boundary.type === 'manual-range') {
    return index >= boundary.startIndex && index <= boundary.endIndex;
  }
  if (boundary.type === 'stage') {
    return row[boundary.column] === boundary.stage;
  }
  if (boundary.type === 'factor-level') {
    return row[boundary.factor] === boundary.level;
  }
  return row[boundary.column] === boundary.value;
}

function hasSpecs(specs: SpecLimits | undefined): boolean {
  return Number.isFinite(specs?.lsl) || Number.isFinite(specs?.usl);
}

function statusForCpk(cpk: number, target: number): ProcessMomentStatus {
  if (cpk >= target) return 'green';
  if (cpk >= target * 0.75) return 'amber';
  return 'red';
}

export function computeProcessMoments(
  rows: DataRow[],
  definitions: ProcessMomentDefinition[]
): ProcessMomentResult[] {
  return definitions.map(definition => {
    const momentRows = rows.filter((row, index) =>
      rowMatchesBoundary(row, index, definition.boundary)
    );
    const values = momentRows
      .map(row => toNumericValue(row[definition.outcomeColumn]))
      .filter((value): value is number => value !== undefined);
    const cpkTarget = definition.cpkTarget ?? 1.33;
    const base = {
      id: definition.id,
      name: definition.name,
      outcomeColumn: definition.outcomeColumn,
      boundary: definition.boundary,
      n: values.length,
      cpkTarget,
      comparableStage: definition.comparableStage,
    };

    if (!hasSpecs(definition.specs)) {
      return {
        ...base,
        status: 'insufficient' as const,
        insufficientReason: 'missing-specs' as const,
      };
    }
    if (momentRows.length > 0 && values.length === 0) {
      return {
        ...base,
        status: 'insufficient' as const,
        insufficientReason: 'invalid-outcome-values' as const,
      };
    }
    if (values.length < 5) {
      return { ...base, status: 'insufficient' as const, insufficientReason: 'n-below-5' as const };
    }

    const mean = d3.mean(values) ?? 0;
    const { sigmaWithin } = calculateMovingRangeSigma(values);
    if (sigmaWithin === 0) {
      return {
        ...base,
        mean,
        sigmaWithin,
        status: 'insufficient' as const,
        insufficientReason: 'zero-sigma' as const,
      };
    }

    const { lsl, usl } = definition.specs ?? {};
    let cp: number | undefined;
    let cpk: number | undefined;
    if (usl !== undefined && lsl !== undefined) {
      cp = safeDivide(usl - lsl, 6 * sigmaWithin);
      const cpkUpper = safeDivide(usl - mean, 3 * sigmaWithin);
      const cpkLower = safeDivide(mean - lsl, 3 * sigmaWithin);
      if (cpkUpper !== undefined && cpkLower !== undefined) {
        cpk = Math.min(cpkUpper, cpkLower);
      }
    } else if (usl !== undefined) {
      cpk = safeDivide(usl - mean, 3 * sigmaWithin);
    } else if (lsl !== undefined) {
      cpk = safeDivide(mean - lsl, 3 * sigmaWithin);
    }

    if (cpk === undefined || !Number.isFinite(cpk)) {
      return {
        ...base,
        mean,
        sigmaWithin,
        cp,
        status: 'insufficient' as const,
        insufficientReason: 'missing-specs' as const,
      };
    }

    return {
      ...base,
      mean,
      sigmaWithin,
      cp,
      cpk,
      status: statusForCpk(cpk, cpkTarget),
    };
  });
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summaryStatus(results: ProcessMomentResult[]): ProcessMomentStatus {
  const sufficient = results.filter(result => result.status !== 'insufficient');
  if (sufficient.length === 0) return 'insufficient';
  if (sufficient.some(result => result.status === 'red')) return 'red';
  if (sufficient.some(result => result.status === 'amber')) return 'amber';
  return 'green';
}

export function summarizeComparableProcessMoments(
  results: ProcessMomentResult[]
): ComparableProcessMomentSummary[] {
  const groups = new Map<string, ProcessMomentResult[]>();
  for (const result of results) {
    if (!result.comparableStage) continue;
    groups.set(result.comparableStage, [...(groups.get(result.comparableStage) ?? []), result]);
  }

  return [...groups.entries()].map(([comparableStage, group]) => {
    const cpValues = group
      .map(result => result.cp)
      .filter((value): value is number => value !== undefined);
    const cpkValues = group
      .map(result => result.cpk)
      .filter((value): value is number => value !== undefined);
    return {
      comparableStage,
      momentCount: group.length,
      sufficientCount: group.filter(result => result.status !== 'insufficient').length,
      averageCp: average(cpValues),
      averageCpk: average(cpkValues),
      minCpk: cpkValues.length > 0 ? Math.min(...cpkValues) : undefined,
      status: summaryStatus(group),
    };
  });
}

export function buildProcessMomentFindingClue(
  result: ProcessMomentResult,
  branchId: string
): ProcessMomentFindingClue | null {
  if (result.status !== 'red' && result.status !== 'amber') return null;
  const cpkText =
    result.cpk === undefined ? 'insufficient capability' : `Cpk ${formatMomentNumber(result.cpk)}`;
  return {
    branchId,
    finding: {
      text: `${result.name} moment has ${cpkText} below target ${formatMomentNumber(result.cpkTarget)}.`,
      validationStatus: 'supports',
      processMomentId: result.id,
    },
  };
}
