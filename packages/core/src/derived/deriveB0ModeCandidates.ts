import type { DefectTransformResult } from '../defect/transform';
import { computeDefectRates } from '../defect/transform';
import type { DefectMapping } from '../defect/types';
import { detectColumns, rankYCandidates } from '../parser';
import type { ColumnAnalysis } from '../parser/types';
import type { AnalysisMode, DataRow } from '../types';

const DEFECT_COUNT_COLUMN = 'DefectCount';
const DEFECT_RATE_COLUMN = 'DefectRate';

export interface DeriveB0ModeCandidatesInput {
  rows: readonly DataRow[];
  analysisMode?: AnalysisMode;
  defectMapping?: DefectMapping | null;
  measureColumns?: readonly string[];
  selectedOutcome?: string | null;
}

export interface B0ModeCandidates {
  rows: readonly DataRow[];
  columnAnalysis: readonly ColumnAnalysis[];
  runOrderColumn: string | null;
  yColumns: readonly ColumnAnalysis[];
  xColumns: readonly ColumnAnalysis[];
  defaultOutcomeColumn: string | null;
  defectResult?: DefectTransformResult;
}

export function deriveB0ModeCandidates(input: DeriveB0ModeCandidatesInput): B0ModeCandidates {
  if (input.rows.length === 0) {
    return emptyCandidates(input.rows);
  }

  if (input.analysisMode === 'defect' && input.defectMapping) {
    return deriveDefectCandidates(input.rows, input.defectMapping, input.selectedOutcome);
  }

  return deriveOrdinaryCandidates(input);
}

function deriveDefectCandidates(
  rows: readonly DataRow[],
  defectMapping: DefectMapping,
  selectedOutcome: string | null | undefined
): B0ModeCandidates {
  const defectResult = computeDefectRates([...rows], defectMapping);
  const detected = detectColumns([...defectResult.data]);
  const derivedMetrics = defectMetricColumns(detected.columnAnalysis, defectResult.outcomeColumn);
  const derivedMetricNames = new Set(derivedMetrics.map(column => column.name));
  const defaultOutcomeColumn =
    selectedOutcome && derivedMetricNames.has(selectedOutcome)
      ? selectedOutcome
      : defectResult.outcomeColumn;

  return {
    rows: defectResult.data,
    columnAnalysis: detected.columnAnalysis,
    runOrderColumn: detected.timeColumn,
    yColumns: derivedMetrics,
    xColumns: xColumnsFromAnalysis(detected.columnAnalysis, {
      excludeColumns: derivedMetricNames,
      runOrderColumn: detected.timeColumn,
    }),
    defaultOutcomeColumn,
    defectResult,
  };
}

function deriveOrdinaryCandidates(input: DeriveB0ModeCandidatesInput): B0ModeCandidates {
  const detected = detectColumns([...input.rows]);
  const excludedMeasureColumns =
    input.analysisMode === 'performance' ? new Set(input.measureColumns ?? []) : new Set<string>();
  const candidateAnalysis = detected.columnAnalysis.filter(
    column => !excludedMeasureColumns.has(column.name)
  );
  const ranked = rankYCandidates(candidateAnalysis);
  const rankedYColumns = ranked.map(({ column }) => column);
  const numericColumnsByName = new Map(
    detected.columnAnalysis
      .filter(column => column.type === 'numeric')
      .map(column => [column.name, column])
  );
  const selectedOutcome =
    input.selectedOutcome && numericColumnsByName.has(input.selectedOutcome)
      ? input.selectedOutcome
      : null;
  const selectedOutcomeColumn = selectedOutcome ? numericColumnsByName.get(selectedOutcome) : null;
  const yColumns =
    selectedOutcomeColumn && !rankedYColumns.some(column => column.name === selectedOutcome)
      ? [selectedOutcomeColumn, ...rankedYColumns]
      : rankedYColumns;
  const defaultOutcomeColumn = selectedOutcome ?? detected.outcome ?? yColumns[0]?.name ?? null;

  return {
    rows: input.rows,
    columnAnalysis: detected.columnAnalysis,
    runOrderColumn: detected.timeColumn,
    yColumns,
    xColumns: xColumnsFromAnalysis(candidateAnalysis, {
      excludeColumns: new Set(defaultOutcomeColumn ? [defaultOutcomeColumn] : []),
      runOrderColumn: detected.timeColumn,
    }),
    defaultOutcomeColumn,
  };
}

function defectMetricColumns(
  columnAnalysis: readonly ColumnAnalysis[],
  defaultOutcomeColumn: string
): ColumnAnalysis[] {
  const byName = new Map(columnAnalysis.map(column => [column.name, column]));
  const order =
    defaultOutcomeColumn === DEFECT_RATE_COLUMN
      ? [DEFECT_RATE_COLUMN, DEFECT_COUNT_COLUMN]
      : [DEFECT_COUNT_COLUMN, DEFECT_RATE_COLUMN];

  return order
    .map(name => byName.get(name))
    .filter(
      (column): column is ColumnAnalysis => column !== undefined && column.type === 'numeric'
    );
}

function xColumnsFromAnalysis(
  columnAnalysis: readonly ColumnAnalysis[],
  options: { excludeColumns: ReadonlySet<string>; runOrderColumn: string | null }
): ColumnAnalysis[] {
  return columnAnalysis.filter(
    column =>
      !options.excludeColumns.has(column.name) &&
      column.name !== options.runOrderColumn &&
      (column.type === 'numeric' || column.type === 'categorical')
  );
}

function emptyCandidates(rows: readonly DataRow[]): B0ModeCandidates {
  return {
    rows,
    columnAnalysis: [],
    runOrderColumn: null,
    yColumns: [],
    xColumns: [],
    defaultOutcomeColumn: null,
  };
}
