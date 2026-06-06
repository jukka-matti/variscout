import { calculateStats, type DataRow, type FindingSource, type SpecLimits } from '@variscout/core';
import { usePreferencesStore } from '@variscout/stores';

export type CaptureEntryKind =
  | 'pin'
  | 'brush'
  | 'point'
  | 'probability-band'
  | 'engine-signal'
  | 'inflection-binning';

export interface CaptureDraft {
  entryKind: CaptureEntryKind;
  source: FindingSource;
  activeFilters: Record<string, (string | number)[]>;
  proposedFactorName?: string;
  conditionLabel: string;
  evidenceLabel: string;
  note: string;
}

export interface BrushCaptureDraftInput {
  rows: DataRow[];
  outcome: string;
  selectedIndices: Set<number>;
  activeFilters: Record<string, (string | number)[]>;
  specs?: SpecLimits;
  existingColumnNames?: string[];
}

export interface CategoryPointCaptureDraftInput {
  chart: 'boxplot' | 'pareto';
  factor: string;
  categoryKey: string | number;
  outcome: string;
  rows: DataRow[];
  activeFilters: Record<string, (string | number)[]>;
}

export interface ProbabilityBandCaptureDraftInput {
  outcome: string;
  minValue: number;
  maxValue: number;
  rows: DataRow[];
  activeFilters: Record<string, (string | number)[]>;
  anchorX: number;
  specs?: SpecLimits;
  existingColumnNames?: string[];
}

export interface EngineSignalCaptureDraftInput {
  rows: DataRow[];
  outcome: string;
  signalLabel: string;
  changepointIndex: number;
  activeFilters: Record<string, (string | number)[]>;
  specs?: SpecLimits;
  existingColumnNames?: string[];
}

function selectedBounds(selectedIndices: Set<number>): { startIdx: number; endIdx: number } {
  const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
  return { startIdx: sorted[0] ?? 0, endIdx: sorted[sorted.length - 1] ?? 0 };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'n/a';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatActiveFilters(activeFilters: Record<string, (string | number)[]>): string {
  return Object.entries(activeFilters)
    .filter(([, values]) => values.length > 0)
    .map(([column, values]) => `${column} = ${values.join(', ')}`)
    .join(' x ');
}

function evidenceContrastLabel(
  rows: DataRow[],
  outcome: string,
  selectedIndices: Set<number>,
  specs?: SpecLimits
): string {
  const selectedValues: number[] = [];
  const complementValues: number[] = [];

  rows.forEach((row, index) => {
    const value = Number(row[outcome]);
    if (!Number.isFinite(value)) return;
    if (selectedIndices.has(index)) {
      selectedValues.push(value);
    } else {
      complementValues.push(value);
    }
  });

  const selectedStats = selectedValues.length
    ? calculateStats(selectedValues, specs?.usl, specs?.lsl)
    : null;
  const complementStats = complementValues.length
    ? calculateStats(complementValues, specs?.usl, specs?.lsl)
    : null;

  const parts = [
    `mean ${formatNumber(selectedStats?.mean ?? Number.NaN)} vs ${formatNumber(
      complementStats?.mean ?? Number.NaN
    )}`,
    `n=${selectedValues.length}`,
  ];

  if (selectedStats?.cpk !== undefined || complementStats?.cpk !== undefined) {
    parts.push(
      `Cpk ${formatNumber(selectedStats?.cpk ?? Number.NaN)} vs ${formatNumber(
        complementStats?.cpk ?? Number.NaN
      )}`
    );
  }

  return parts.join(' · ');
}

function selectedIndicesWhere(
  rows: DataRow[],
  predicate: (row: DataRow, index: number) => boolean
): Set<number> {
  const selected = new Set<number>();
  rows.forEach((row, index) => {
    if (predicate(row, index)) selected.add(index);
  });
  return selected;
}

export function applyDerivedFactorToFilters(
  activeFilters: Record<string, (string | number)[]>,
  factorName: string
): Record<string, (string | number)[]> {
  return { ...activeFilters, [factorName]: ['in'] };
}

export function resolveDerivedFactorName(
  proposedName: string,
  existingColumnNames: string[]
): string {
  const trimmed = proposedName.trim();
  const baseName = trimmed.length > 0 ? trimmed : 'captured range';
  const existing = new Set(existingColumnNames);
  if (!existing.has(baseName)) return baseName;

  let suffix = 2;
  let candidate = `${baseName} ${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${baseName} ${suffix}`;
  }
  return candidate;
}

export function buildBrushDerivedColumn(
  rows: DataRow[],
  selectedIndices: Set<number>,
  factorName: string
): DataRow[] {
  return rows.map((row, index) => ({
    ...row,
    [factorName]: selectedIndices.has(index) ? 'in' : 'out',
  }));
}

export function buildValueBandDerivedColumn(
  rows: DataRow[],
  outcome: string,
  minValue: number,
  maxValue: number,
  factorName: string
): DataRow[] {
  const lo = Math.min(minValue, maxValue);
  const hi = Math.max(minValue, maxValue);
  return rows.map(row => {
    const value = Number(row[outcome]);
    return {
      ...row,
      [factorName]: Number.isFinite(value) && value >= lo && value <= hi ? 'in' : 'out',
    };
  });
}

export function buildChangepointDerivedColumn(
  rows: DataRow[],
  changepointIndex: number,
  factorName: string
): DataRow[] {
  return rows.map((row, index) => ({
    ...row,
    [factorName]: index >= changepointIndex ? 'after' : 'before',
  }));
}

export function buildBrushCaptureDraft({
  rows,
  outcome,
  selectedIndices,
  activeFilters,
  specs,
  existingColumnNames,
}: BrushCaptureDraftInput): CaptureDraft {
  const { startIdx, endIdx } = selectedBounds(selectedIndices);
  const proposedFactorName = resolveDerivedFactorName(
    `obs ${startIdx + 1}-${endIdx + 1}`,
    existingColumnNames ?? []
  );
  const filterLabel = formatActiveFilters(activeFilters);
  const conditionLabel = [filterLabel, proposedFactorName].filter(Boolean).join(' x ');
  const anchorIndex = Math.round((startIdx + endIdx) / 2);
  const anchorRow = rows[anchorIndex];
  const anchorY = Number(anchorRow?.[outcome]);

  const source: FindingSource = {
    chart: 'ichart',
    anchorX: anchorIndex,
    anchorY: Number.isFinite(anchorY) ? anchorY : 0,
    brushedRange: { startIdx, endIdx },
    timeLens: usePreferencesStore.getState().timeLens,
  };

  return {
    entryKind: 'brush',
    source,
    activeFilters,
    proposedFactorName,
    conditionLabel,
    evidenceLabel: evidenceContrastLabel(rows, outcome, selectedIndices, specs),
    note: '',
  };
}

export function buildEngineSignalCaptureDraft({
  rows,
  outcome,
  signalLabel,
  changepointIndex,
  activeFilters,
  specs,
  existingColumnNames,
}: EngineSignalCaptureDraftInput): CaptureDraft {
  const clampedIndex = Math.max(0, Math.min(rows.length - 1, changepointIndex));
  const selectedIndices = selectedIndicesWhere(rows, (_row, index) => index >= clampedIndex);
  const proposedFactorName = resolveDerivedFactorName(
    `signal after obs ${clampedIndex + 1}`,
    existingColumnNames ?? []
  );
  const filterLabel = formatActiveFilters(activeFilters);
  const anchorY = Number(rows[clampedIndex]?.[outcome]);

  return {
    entryKind: 'engine-signal',
    source: {
      chart: 'ichart',
      anchorX: clampedIndex,
      anchorY: Number.isFinite(anchorY) ? anchorY : 0,
      timeLens: usePreferencesStore.getState().timeLens,
    },
    activeFilters,
    proposedFactorName,
    conditionLabel: [filterLabel, proposedFactorName].filter(Boolean).join(' x '),
    evidenceLabel: `${signalLabel} · ${evidenceContrastLabel(
      rows,
      outcome,
      selectedIndices,
      specs
    )}`,
    note: '',
  };
}

export function buildCategoryPointCaptureDraft({
  chart,
  factor,
  categoryKey,
  outcome,
  rows,
  activeFilters,
}: CategoryPointCaptureDraftInput): CaptureDraft {
  const selectedValues = new Map<string, string | number>();
  const selectedIndices = selectedIndicesWhere(rows, row => {
    const value = row[factor];
    if (String(value) !== String(categoryKey)) return false;
    if (typeof value === 'string' || typeof value === 'number') {
      selectedValues.set(`${typeof value}:${String(value)}`, value);
    }
    return true;
  });
  const filterValues =
    selectedValues.size > 0 ? Array.from(selectedValues.values()) : [categoryKey];
  const nextFilters = { ...activeFilters, [factor]: filterValues };
  const source: FindingSource = {
    chart,
    category: String(categoryKey),
    timeLens: usePreferencesStore.getState().timeLens,
  };

  return {
    entryKind: 'point',
    source,
    activeFilters: nextFilters,
    conditionLabel: formatActiveFilters(nextFilters),
    evidenceLabel: evidenceContrastLabel(rows, outcome, selectedIndices),
    note: '',
  };
}

export function buildProbabilityBandCaptureDraft({
  outcome,
  minValue,
  maxValue,
  rows,
  activeFilters,
  anchorX,
  specs,
  existingColumnNames,
}: ProbabilityBandCaptureDraftInput): CaptureDraft {
  const lo = Math.min(minValue, maxValue);
  const hi = Math.max(minValue, maxValue);
  const selectedIndices = selectedIndicesWhere(rows, row => {
    const value = Number(row[outcome]);
    return Number.isFinite(value) && value >= lo && value <= hi;
  });
  const proposedFactorName = resolveDerivedFactorName(
    `${outcome} ${formatNumber(lo)}-${formatNumber(hi)}`,
    existingColumnNames ?? []
  );
  const filterLabel = formatActiveFilters(activeFilters);

  return {
    entryKind: 'probability-band',
    source: {
      chart: 'probability',
      anchorX,
      anchorY: lo,
      anchorYMax: hi,
      timeLens: usePreferencesStore.getState().timeLens,
    },
    activeFilters,
    proposedFactorName,
    conditionLabel: [filterLabel, proposedFactorName].filter(Boolean).join(' x '),
    evidenceLabel: evidenceContrastLabel(rows, outcome, selectedIndices, specs),
    note: '',
  };
}
