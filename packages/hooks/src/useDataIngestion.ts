/**
 * useDataIngestion - Shared data ingestion hook for file uploads
 *
 * This hook extracts common data upload/ingestion logic from PWA and Azure apps.
 * Uses dependency injection pattern - accepts DataActions instead of calling useData().
 *
 * Usage:
 * ```tsx
 * const { handleFileUpload, clearData } = useDataIngestion(actions, {
 *   onWideFormatDetected: (result) => setShowModal(true),
 * });
 * ```
 */

import { useCallback } from 'react';
import {
  parseCSV,
  parseExcel,
  detectColumns,
  validateData,
  parseParetoFile,
  detectWideFormat,
  augmentWithTimeColumns,
  hasTimeComponent,
  type WideFormatDetection,
  type DataQualityReport,
  type ParetoRow,
  type DataRow,
  type TimeExtractionConfig,
} from '@variscout/core';

// Performance thresholds
const ROW_WARNING_THRESHOLD = 5000;
const ROW_HARD_LIMIT = 50000;

/**
 * Minimal interface for the actions needed by useDataIngestion
 * Subset of DataActions from useDataState
 */
export interface DataIngestionActions {
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  setGrades: (grades: { max: number; label: string; color: string }[]) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setParetoMode: (mode: 'derived' | 'separate') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;
  setPerformanceMode: (enabled: boolean) => void;
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
}

export interface TimeExtractionPrompt {
  timeColumn: string;
  hasTimeComponent: boolean;
}

export interface UseDataIngestionOptions {
  /** Callback when wide-format (multi-measure) data is detected */
  onWideFormatDetected?: (result: WideFormatDetection) => void;
  /** Callback when time column is detected */
  onTimeColumnDetected?: (prompt: TimeExtractionPrompt) => void;
  /** Getter for current rawData (needed for time extraction) */
  getRawData?: () => DataRow[];
  /** Getter for current outcome column (needed for validation) */
  getOutcome?: () => string | null;
}

export interface UseDataIngestionReturn {
  /** Handle file upload from input element */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  /** Handle separate Pareto file upload */
  handleParetoFileUpload: (file: File) => Promise<boolean>;
  /** Clear separate Pareto data and switch back to derived mode */
  clearParetoFile: () => void;
  /** Clear all data and reset state */
  clearData: () => void;
  /** Apply time extraction to current dataset */
  applyTimeExtraction: (timeColumn: string, config: TimeExtractionConfig) => void;
}

/**
 * Shared data ingestion hook
 *
 * @param actions - Data context actions for updating state
 * @param options - Configuration options
 * @returns Object with file handling functions
 */
export function useDataIngestion(
  actions: DataIngestionActions,
  options?: UseDataIngestionOptions
): UseDataIngestionReturn {
  const { onWideFormatDetected, onTimeColumnDetected, getRawData, getOutcome } = options || {};
  const {
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setGrades,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
  } = actions;

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<boolean> => {
      const file = e.target.files?.[0];
      if (!file) return false;

      let data: DataRow[] = [];
      try {
        if (file.name.endsWith('.csv')) {
          data = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          data = await parseExcel(file);
        }

        if (data.length > 0) {
          // Check row limits for performance
          if (data.length > ROW_HARD_LIMIT) {
            alert(
              `File too large (${data.length.toLocaleString()} rows). Maximum is ${ROW_HARD_LIMIT.toLocaleString()} rows.`
            );
            return false;
          }
          if (data.length > ROW_WARNING_THRESHOLD) {
            const proceed = window.confirm(
              `Large dataset (${data.length.toLocaleString()} rows) may slow performance. Continue?`
            );
            if (!proceed) return false;
          }

          setRawData(data);
          setDataFilename(file.name);

          // Detect columns with enhanced keyword matching
          const detected = detectColumns(data);
          if (detected.outcome) setOutcome(detected.outcome);
          if (detected.factors.length > 0) setFactors(detected.factors);

          // Run validation and store report
          const report = validateData(data, detected.outcome);
          setDataQualityReport(report);

          // Check for wide format (multi-measure) data
          const wideFormat = detectWideFormat(data);
          if (wideFormat.isWideFormat && wideFormat.channels.length >= 3) {
            // Use callback if provided
            if (onWideFormatDetected) {
              onWideFormatDetected(wideFormat);
            }
          }

          // Check for time column
          if (detected.timeColumn && onTimeColumnDetected) {
            const hasTime = hasTimeComponent(data, detected.timeColumn);
            onTimeColumnDetected({
              timeColumn: detected.timeColumn,
              hasTimeComponent: hasTime,
            });
          }

          return true;
        }
        return false;
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check format.');
        return false;
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setDataQualityReport,
      onWideFormatDetected,
      onTimeColumnDetected,
    ]
  );

  // Handle separate Pareto file upload
  const handleParetoFileUpload = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const paretoData = await parseParetoFile(file);
        setSeparateParetoData(paretoData);
        setSeparateParetoFilename(file.name);
        setParetoMode('separate');
        return true;
      } catch (error) {
        console.error('Error parsing Pareto file:', error);
        alert(error instanceof Error ? error.message : 'Error parsing Pareto file.');
        return false;
      }
    },
    [setSeparateParetoData, setSeparateParetoFilename, setParetoMode]
  );

  // Clear separate Pareto data and switch back to derived mode
  const clearParetoFile = useCallback(() => {
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    setParetoMode('derived');
  }, [setSeparateParetoData, setSeparateParetoFilename, setParetoMode]);

  const clearData = useCallback(() => {
    setRawData([]);
    setDataFilename(null);
    setOutcome('');
    setFactors([]);
    setSpecs({});
    setGrades([]);
    setFilters({});
    setDataQualityReport(null);
    setParetoMode('derived');
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    // Reset performance mode
    setMeasureColumns([]);
    setMeasureLabel('Measure');
    setPerformanceMode(false);
  }, [
    setRawData,
    setDataFilename,
    setOutcome,
    setFactors,
    setSpecs,
    setGrades,
    setFilters,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setMeasureColumns,
    setMeasureLabel,
    setPerformanceMode,
  ]);

  // Apply time extraction to current dataset
  const applyTimeExtraction = useCallback(
    (timeColumn: string, config: TimeExtractionConfig) => {
      if (!getRawData || !getOutcome) {
        console.warn('applyTimeExtraction requires getRawData and getOutcome options');
        return;
      }

      const rawData = getRawData();
      const outcome = getOutcome();

      if (rawData.length === 0) return;

      const { newColumns } = augmentWithTimeColumns(rawData, timeColumn, config);

      if (newColumns.length > 0) {
        setFactors(prev => [...prev, ...newColumns]);
        const report = validateData(rawData, outcome);
        setDataQualityReport(report);
      }
    },
    [getRawData, getOutcome, setFactors, setDataQualityReport]
  );

  return {
    handleFileUpload,
    handleParetoFileUpload,
    clearParetoFile,
    clearData,
    applyTimeExtraction,
  };
}
