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

import React, { useCallback } from 'react';
import {
  parseCSV,
  parseExcel,
  detectColumns,
  validateData,
  parseParetoFile,
  detectWideFormat,
  detectYamazumiFormat,
  detectDefectFormat,
  augmentWithTimeColumns,
  hasTimeComponent,
  type WideFormatDetection,
  type YamazumiDetection,
  type DefectDetection,
  type AnalysisMode,
  type YamazumiColumnMapping,
  type DefectMapping,
  type DataQualityReport,
  type ParetoRow,
  type DataRow,
  type SpecLimits,
  type TimeExtractionConfig,
  type Finding,
  type Question,
  type InvestigationCategory,
} from '@variscout/core';
import type { ProcessContext } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';

// Default performance thresholds
const DEFAULT_ROW_WARNING_THRESHOLD = 5000;
const DEFAULT_ROW_HARD_LIMIT = 50000;

/**
 * Minimal interface for the actions needed by useDataIngestion
 * Subset of DataActions from useDataState
 */
export interface DataIngestionActions {
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: SpecLimits) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setParetoMode: (mode: 'derived' | 'separate') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (filename: string | null) => void;
  setMeasureColumns: (columns: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;
  setDefectMapping?: (mapping: DefectMapping | null) => void;
  /** Set pre-populated findings (for showcase/demo datasets) */
  setFindings?: (findings: Finding[]) => void;
  /** Set pre-populated questions (for showcase/demo datasets) */
  setQuestions?: (questions: Question[]) => void;
  /** Set pre-populated investigation categories (for showcase/demo datasets) */
  setCategories?: (categories: InvestigationCategory[]) => void;
  /** Set the process context (used to seed FRAME Process Map on showcases) */
  setProcessContext?: (ctx: ProcessContext | null) => void;
  /** Snapshot of the current process context — merged when seeding processMap. */
  getProcessContext?: () => ProcessContext | null | undefined;
}

export interface TimeExtractionPrompt {
  timeColumn: string;
  hasTimeComponent: boolean;
}

export interface DataIngestionConfig {
  /** Maximum number of rows allowed (default: 50000) */
  rowHardLimit?: number;
  /** Row count above which a warning is shown (default: 5000) */
  rowWarningThreshold?: number;
}

export interface UseDataIngestionOptions {
  /** Callback when wide-format (multi-measure) data is detected */
  onWideFormatDetected?: (result: WideFormatDetection) => void;
  /** Callback when Yamazumi (time study) format is detected */
  onYamazumiDetected?: (result: YamazumiDetection) => void;
  /** Callback when defect data format is detected */
  onDefectDetected?: (result: DefectDetection) => void;
  /** Callback when time column is detected */
  onTimeColumnDetected?: (prompt: TimeExtractionPrompt) => void;
  /** Getter for current rawData (needed for time extraction) */
  getRawData?: () => DataRow[];
  /** Getter for current outcome column (needed for validation) */
  getOutcome?: () => string | null;
  /** Getter for current factors list (needed for time extraction) */
  getFactors?: () => string[];
  /** Row limit configuration */
  limits?: DataIngestionConfig;
}

export interface UseDataIngestionReturn {
  /** Handle file upload from input element */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  /** Process a File object directly (e.g., from SharePoint File Picker) */
  processFile: (file: File) => Promise<boolean>;
  /** Handle separate Pareto file upload */
  handleParetoFileUpload: (file: File) => Promise<boolean>;
  /** Clear separate Pareto data and switch back to derived mode */
  clearParetoFile: () => void;
  /** Clear all data and reset state */
  clearData: () => void;
  /** Load a built-in sample dataset */
  loadSample: (sample: SampleDataset) => void;
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
  const {
    onWideFormatDetected,
    onYamazumiDetected,
    onDefectDetected,
    onTimeColumnDetected,
    getRawData,
    getOutcome,
    getFactors,
    limits,
  } = options || {};
  const rowHardLimit = limits?.rowHardLimit ?? DEFAULT_ROW_HARD_LIMIT;
  const rowWarningThreshold = limits?.rowWarningThreshold ?? DEFAULT_ROW_WARNING_THRESHOLD;
  const {
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    setYamazumiMapping,
    setDefectMapping,
    setFindings,
    setQuestions,
    setCategories,
    setProcessContext,
    getProcessContext,
  } = actions;

  const processFile = useCallback(
    async (file: File): Promise<boolean> => {
      let data: DataRow[] = [];
      try {
        if (file.name.endsWith('.csv')) {
          data = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          data = await parseExcel(file);
        }

        if (data.length > 0) {
          // Check row limits for performance
          if (data.length > rowHardLimit) {
            alert(
              `File too large (${data.length.toLocaleString()} rows). ` +
                `Maximum is ${rowHardLimit.toLocaleString()} rows. ` +
                `Large datasets require significant browser memory — consider filtering or aggregating data before import.`
            );
            return false;
          }
          if (data.length > rowWarningThreshold) {
            const proceed = window.confirm(
              `Large dataset (${data.length.toLocaleString()} rows). ` +
                `This may use significant browser memory and could slow down older computers. Continue?`
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

          // Check for Yamazumi format (more specific than wide format)
          const yamazumiResult = detectYamazumiFormat(data, detected.columnAnalysis);
          if (yamazumiResult.isYamazumiFormat && onYamazumiDetected) {
            onYamazumiDetected(yamazumiResult);
          } else {
            // Check for defect format (before wide format — more specific)
            const defectResult = detectDefectFormat(data, detected.columnAnalysis);
            if (
              defectResult.isDefectFormat &&
              (defectResult.confidence === 'high' || defectResult.confidence === 'medium') &&
              onDefectDetected
            ) {
              onDefectDetected(defectResult);
            } else {
              // Check for wide format (multi-measure) data
              const wideFormat = detectWideFormat(data);
              if (wideFormat.isWideFormat && wideFormat.channels.length >= 3) {
                if (onWideFormatDetected) {
                  onWideFormatDetected(wideFormat);
                }
              }
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
      onYamazumiDetected,
      onDefectDetected,
      onTimeColumnDetected,
      rowHardLimit,
      rowWarningThreshold,
    ]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<boolean> => {
      const file = e.target.files?.[0];
      if (!file) return false;
      return processFile(file);
    },
    [processFile]
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
    setFilters({});
    setDataQualityReport(null);
    setParetoMode('derived');
    setSeparateParetoData(null);
    setSeparateParetoFilename(null);
    // Reset measure state
    setMeasureColumns([]);
    setMeasureLabel('Measure');
    setAnalysisMode('standard');
    setYamazumiMapping(null);
    if (setDefectMapping) setDefectMapping(null);
  }, [
    setRawData,
    setDataFilename,
    setOutcome,
    setFactors,
    setSpecs,
    setFilters,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    setYamazumiMapping,
    setDefectMapping,
  ]);

  // Apply time extraction to current dataset
  const applyTimeExtraction = useCallback(
    (timeColumn: string, config: TimeExtractionConfig) => {
      if (!getRawData || !getOutcome || !getFactors) {
        console.warn('applyTimeExtraction requires getRawData, getOutcome, and getFactors options');
        return;
      }

      const rawData = getRawData();
      const outcome = getOutcome();
      const currentFactors = getFactors();

      if (rawData.length === 0) return;

      const { newColumns } = augmentWithTimeColumns(rawData, timeColumn, config);

      if (newColumns.length > 0) {
        setFactors([...currentFactors, ...newColumns]);
        const report = validateData(rawData, outcome);
        setDataQualityReport(report);
      }
    },
    [getRawData, getOutcome, getFactors, setFactors, setDataQualityReport]
  );

  const loadSample = useCallback(
    (sample: SampleDataset) => {
      setRawData(sample.data as DataRow[]);
      setDataFilename(sample.name);
      setOutcome(sample.config.outcome);
      setFactors(sample.config.factors);
      setSpecs(sample.config.specs);
      const report = validateData(sample.data as DataRow[], sample.config.outcome);
      setDataQualityReport(report);
      setParetoMode('derived');
      setSeparateParetoData(null);
      setSeparateParetoFilename(null);
      if (
        sample.config.analysisMode === 'performance' &&
        sample.config.measureColumns &&
        sample.config.measureColumns.length >= 3
      ) {
        setMeasureColumns(sample.config.measureColumns);
        setMeasureLabel('Channel');
      } else {
        setMeasureColumns([]);
        setMeasureLabel('Channel');
      }
      // Set analysis mode based on sample config
      if (sample.config.yamazumiMode && sample.config.yamazumiMapping) {
        setAnalysisMode('yamazumi');
        setYamazumiMapping({
          activityTypeColumn: sample.config.yamazumiMapping.activityTypeColumn,
          cycleTimeColumn: sample.config.yamazumiMapping.cycleTimeColumn,
          stepColumn: sample.config.yamazumiMapping.stepColumn,
          activityColumn: sample.config.yamazumiMapping.activityColumn,
          reasonColumn: sample.config.yamazumiMapping.reasonColumn,
          productColumn: sample.config.yamazumiMapping.productColumn,
          waitTimeColumn: sample.config.yamazumiMapping.waitTimeColumn,
        });
      } else if (sample.config.analysisMode === 'defect' && sample.config.defectMapping) {
        setAnalysisMode('defect');
        if (setDefectMapping) {
          setDefectMapping({
            dataShape: sample.config.defectMapping.dataShape,
            defectTypeColumn: sample.config.defectMapping.defectTypeColumn,
            countColumn: sample.config.defectMapping.countColumn,
            resultColumn: sample.config.defectMapping.resultColumn,
            aggregationUnit: sample.config.defectMapping.aggregationUnit,
            unitsProducedColumn: sample.config.defectMapping.unitsProducedColumn,
          });
        }
        setYamazumiMapping(null);
      } else {
        setAnalysisMode(sample.config.analysisMode ?? 'standard');
        setYamazumiMapping(null);
        if (setDefectMapping) setDefectMapping(null);
      }
      // Inject or clear pre-populated investigation state (showcase/demo datasets)
      if (sample.config.investigation) {
        const inv = sample.config.investigation;
        if (inv.findings?.length && setFindings) setFindings(inv.findings);
        if (inv.questions?.length && setQuestions) setQuestions(inv.questions);
        if (inv.categories?.length && setCategories) setCategories(inv.categories);
      } else {
        // Clear stale investigation state from a previous showcase sample
        if (setFindings) setFindings([]);
        if (setQuestions) setQuestions([]);
        if (setCategories) setCategories([]);
      }
      // Seed or clear the FRAME Process Map (ADR-070). Preserves any other
      // processContext fields (description, problemStatement, …) already set.
      if (setProcessContext) {
        const base = getProcessContext?.() ?? undefined;
        if (sample.config.processMap) {
          setProcessContext({ ...(base ?? {}), processMap: sample.config.processMap });
        } else if (base?.processMap) {
          const { processMap: _drop, ...rest } = base;
          setProcessContext(Object.keys(rest).length > 0 ? (rest as ProcessContext) : null);
        }
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      setParetoMode,
      setSeparateParetoData,
      setSeparateParetoFilename,
      setMeasureColumns,
      setMeasureLabel,
      setAnalysisMode,
      setYamazumiMapping,
      setDefectMapping,
      setFindings,
      setQuestions,
      setCategories,
      setProcessContext,
      getProcessContext,
    ]
  );

  return {
    handleFileUpload,
    processFile,
    handleParetoFileUpload,
    clearParetoFile,
    clearData,
    loadSample,
    applyTimeExtraction,
  };
}
