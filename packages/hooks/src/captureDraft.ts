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

export function applyDerivedFactorToFilters(
  activeFilters: Record<string, (string | number)[]>,
  factorName: string
): Record<string, (string | number)[]> {
  return { ...activeFilters, [factorName]: ['in'] };
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

export function buildBrushCaptureDraft({
  rows,
  outcome,
  selectedIndices,
  activeFilters,
  specs,
}: BrushCaptureDraftInput): CaptureDraft {
  const { startIdx, endIdx } = selectedBounds(selectedIndices);
  const proposedFactorName = `obs ${startIdx + 1}-${endIdx + 1}`;
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
