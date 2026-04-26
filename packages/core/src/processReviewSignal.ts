import {
  calculateStats,
  getEtaSquared,
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
} from './stats';
import type { DataCellValue, DataRow, SpecLimits } from './types';
import { toNumericValue } from './types';

export interface HubReviewTopFocus {
  factor: string;
  value?: string | number | boolean;
  variationPct: number;
}

export interface HubReviewCapability {
  cp?: number;
  cpk?: number;
  cpkTarget?: number;
  outOfSpecPercentage: number;
}

export interface HubReviewChangeSignals {
  total: number;
  outOfControlCount: number;
  nelsonRule2Count: number;
  nelsonRule3Count: number;
}

export interface HubReviewSignal {
  rowCount: number;
  outcome: string;
  dataFilename?: string;
  computedAt: string;
  topFocus?: HubReviewTopFocus;
  capability?: HubReviewCapability;
  changeSignals: HubReviewChangeSignals;
  latestTimeValue?: string | number | boolean;
}

export interface BuildHubReviewSignalInput {
  rawData: DataRow[];
  outcome?: string | null;
  factors?: string[];
  specs?: SpecLimits;
  cpkTarget?: number;
  timeColumn?: string | null;
  dataFilename?: string | null;
  computedAt?: string;
}

function toReviewValue(value: DataCellValue): string | number | boolean | undefined {
  return value === null || value === undefined || value === '' ? undefined : value;
}

function findTopFocusValue(
  data: DataRow[],
  factor: string,
  outcome: string
): string | number | boolean | undefined {
  const values = data
    .map(row => toNumericValue(row[outcome]))
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;

  const overallMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const grouped = new Map<string, { raw: string | number | boolean; values: number[] }>();

  for (const row of data) {
    const rawFactor = toReviewValue(row[factor]);
    const outcomeValue = toNumericValue(row[outcome]);
    if (rawFactor === undefined || outcomeValue === undefined) continue;

    const key = String(rawFactor);
    const existing = grouped.get(key);
    if (existing) {
      existing.values.push(outcomeValue);
    } else {
      grouped.set(key, { raw: rawFactor, values: [outcomeValue] });
    }
  }

  let topValue: string | number | boolean | undefined;
  let topScore = 0;
  let topMean = -Infinity;

  for (const group of grouped.values()) {
    const groupMean = group.values.reduce((sum, value) => sum + value, 0) / group.values.length;
    const score = Math.abs(groupMean - overallMean) * group.values.length;
    if (score > topScore || (score === topScore && groupMean > topMean)) {
      topScore = score;
      topMean = groupMean;
      topValue = group.raw;
    }
  }

  return topValue;
}

function buildTopFocus(
  data: DataRow[],
  factors: string[],
  outcome: string
): HubReviewTopFocus | undefined {
  let topFocus: HubReviewTopFocus | undefined;

  for (const factor of factors) {
    if (!factor || factor === outcome) continue;
    const etaSquared = getEtaSquared(data, factor, outcome);
    if (!Number.isFinite(etaSquared) || etaSquared <= 0) continue;

    const variationPct = etaSquared * 100;
    if (!topFocus || variationPct > topFocus.variationPct) {
      topFocus = {
        factor,
        value: findTopFocusValue(data, factor, outcome),
        variationPct,
      };
    }
  }

  return topFocus;
}

function latestValue(
  data: DataRow[],
  column?: string | null
): string | number | boolean | undefined {
  if (!column) return undefined;

  for (let index = data.length - 1; index >= 0; index--) {
    const value = toReviewValue(data[index]?.[column]);
    if (value !== undefined) return value;
  }

  return undefined;
}

export function buildHubReviewSignal(input: BuildHubReviewSignalInput): HubReviewSignal | null {
  const { rawData, outcome } = input;
  if (!outcome || rawData.length === 0) return null;

  const values = rawData
    .map(row => toNumericValue(row[outcome]))
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) return null;

  const stats = calculateStats(values, input.specs?.usl, input.specs?.lsl);
  const outOfControlCount = values.filter(value => value > stats.ucl || value < stats.lcl).length;
  const nelsonRule2Count = getNelsonRule2Sequences(values, stats.mean).length;
  const nelsonRule3Count = getNelsonRule3Sequences(values).length;
  const hasSpecs = input.specs?.usl !== undefined || input.specs?.lsl !== undefined;

  return {
    rowCount: rawData.length,
    outcome,
    dataFilename: input.dataFilename ?? undefined,
    computedAt: input.computedAt ?? new Date().toISOString(),
    topFocus: buildTopFocus(rawData, input.factors ?? [], outcome),
    capability: hasSpecs
      ? {
          cp: stats.cp,
          cpk: stats.cpk,
          cpkTarget: input.cpkTarget,
          outOfSpecPercentage: stats.outOfSpecPercentage,
        }
      : undefined,
    changeSignals: {
      total: outOfControlCount + nelsonRule2Count + nelsonRule3Count,
      outOfControlCount,
      nelsonRule2Count,
      nelsonRule3Count,
    },
    latestTimeValue: latestValue(rawData, input.timeColumn),
  };
}
