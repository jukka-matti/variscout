import { useCallback } from 'react';
import { validateData } from '@variscout/core';
import type { ManualEntryConfig } from '../components/data/ManualEntry';

interface UseDataMergeOptions {
  appendMode: boolean;
  existingConfig: ManualEntryConfig | undefined;
  rawData: Record<string, any>[];
  setRawData: (data: Record<string, any>[]) => void;
  setDataFilename: (name: string) => void;
  setOutcome: (outcome: string) => void;
  setFactors: (factors: string[]) => void;
  setSpecs: (specs: { usl?: number; lsl?: number }) => void;
  setDataQualityReport: (report: any) => void;
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
  const mergeData = useCallback((existing: any[], incoming: any[]): any[] => {
    const allColumns = new Set<string>();
    [...existing, ...incoming].forEach(row => Object.keys(row).forEach(k => allColumns.add(k)));

    return [...existing, ...incoming].map(row =>
      Object.fromEntries([...allColumns].map(col => [col, row[col] ?? null]))
    );
  }, []);

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
    (data: any[], config: ManualEntryConfig) => {
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
