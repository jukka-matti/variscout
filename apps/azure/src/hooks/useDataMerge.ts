import { useCallback } from 'react';
import { validateData } from '@variscout/core';
import type { DataRow, DataQualityReport } from '@variscout/core';
import type { ManualEntryConfig } from '../components/data/ManualEntry';

/**
 * Detect whether incoming pasted/uploaded data should be appended as rows
 * or merged as new columns.
 *
 * - ALL incoming column names exist in current data → append rows
 * - ANY incoming column is new → add columns
 */
export function detectMergeStrategy(
  existingColumns: string[],
  incomingColumns: string[]
): 'rows' | 'columns' {
  const existingSet = new Set(existingColumns);
  const newColumns = incomingColumns.filter(c => !existingSet.has(c));
  return newColumns.length === 0 ? 'rows' : 'columns';
}

/**
 * Append rows, filling missing columns with null so all rows have the same shape.
 */
export function mergeRows(existing: DataRow[], incoming: DataRow[]): DataRow[] {
  const allColumns = new Set<string>();
  [...existing, ...incoming].forEach(row => Object.keys(row).forEach(k => allColumns.add(k)));
  return [...existing, ...incoming].map(row =>
    Object.fromEntries([...allColumns].map(col => [col, row[col] ?? null]))
  );
}

/**
 * Merge new columns into existing data by row index.
 * - Skips columns that already exist in the existing data.
 * - If row counts differ, the shorter side is padded with null.
 */
export function mergeColumns(
  existing: DataRow[],
  incoming: DataRow[]
): { data: DataRow[]; addedColumns: string[] } {
  const existingCols = new Set(existing.length > 0 ? Object.keys(existing[0]) : []);
  const incomingCols = incoming.length > 0 ? Object.keys(incoming[0]) : [];
  const addedColumns = incomingCols.filter(c => !existingCols.has(c));

  if (addedColumns.length === 0) {
    return { data: existing, addedColumns: [] };
  }

  const maxLen = Math.max(existing.length, incoming.length);
  const merged: DataRow[] = [];

  for (let i = 0; i < maxLen; i++) {
    const existRow = existing[i] ?? {};
    const incRow = incoming[i] ?? {};

    // Start from existing columns (with null fill if existing is shorter)
    const row: DataRow = {};
    for (const col of existingCols) {
      row[col] = existRow[col] ?? null;
    }
    // Add only truly new columns
    for (const col of addedColumns) {
      row[col] = incRow[col] ?? null;
    }
    merged.push(row);
  }

  return { data: merged, addedColumns };
}

interface UseDataMergeOptions {
  appendMode: boolean;
  existingConfig: ManualEntryConfig | undefined;
  rawData: DataRow[];
  setRawData: (data: DataRow[]) => void;
  setDataFilename: (name: string) => void;
  setOutcome: (outcome: string) => void;
  setFactors: (factors: string[]) => void;
  setSpecs: (specs: { usl?: number; lsl?: number }) => void;
  setDataQualityReport: (report: DataQualityReport) => void;
  setMeasureColumns: (cols: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setPerformanceMode: (enabled: boolean) => void;
  onDone: () => void;
}

/**
 * Handles append-mode data merging and the handleManualDataAnalyze callback.
 */
export function useDataMerge({
  appendMode,
  existingConfig,
  rawData,
  setRawData,
  setDataFilename,
  setOutcome,
  setFactors,
  setSpecs,
  setDataQualityReport,
  setMeasureColumns,
  setMeasureLabel,
  setPerformanceMode,
  onDone,
}: UseDataMergeOptions) {
  const mergeData = useCallback(
    (existing: DataRow[], incoming: DataRow[]): DataRow[] => mergeRows(existing, incoming),
    []
  );

  const mergeConfig = useCallback(
    (existing: ManualEntryConfig, incoming: ManualEntryConfig): ManualEntryConfig => {
      if (existing.isPerformanceMode && incoming.isPerformanceMode) {
        const allMeasureColumns = Array.from(
          new Set([...(existing.measureColumns || []), ...(incoming.measureColumns || [])])
        );
        return {
          ...incoming,
          measureColumns: allMeasureColumns,
          outcome: allMeasureColumns[0],
        };
      }

      const allFactors = Array.from(new Set([...existing.factors, ...incoming.factors]));
      return { ...incoming, factors: allFactors };
    },
    []
  );

  const handleManualDataAnalyze = useCallback(
    (data: DataRow[], config: ManualEntryConfig) => {
      let finalData = data;
      let finalConfig = config;

      if (appendMode && existingConfig && rawData.length > 0) {
        finalData = mergeData(rawData, data);
        finalConfig = mergeConfig(existingConfig, config);
        setDataFilename('Manual Entry (combined)');
      } else {
        setDataFilename('Manual Entry');
      }

      setRawData(finalData);
      setOutcome(finalConfig.outcome);
      setFactors(finalConfig.factors);
      if (finalConfig.specs) {
        setSpecs(finalConfig.specs);
      }

      const report = validateData(finalData, finalConfig.outcome);
      setDataQualityReport(report);

      if (
        finalConfig.isPerformanceMode &&
        finalConfig.measureColumns &&
        finalConfig.measureColumns.length >= 3
      ) {
        setMeasureColumns(finalConfig.measureColumns);
        setMeasureLabel(finalConfig.measureLabel || 'Channel');
        setPerformanceMode(true);
      }

      onDone();
    },
    [
      appendMode,
      existingConfig,
      rawData,
      mergeData,
      mergeConfig,
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setPerformanceMode,
      onDone,
    ]
  );

  return { mergeData, mergeConfig, handleManualDataAnalyze };
}
