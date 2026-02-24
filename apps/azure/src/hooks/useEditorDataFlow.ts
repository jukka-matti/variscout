import React, { useRef, useState, useCallback, useMemo } from 'react';
import { parseText, detectColumns, validateData, detectWideFormat } from '@variscout/core';
import type { DataRow, DataQualityReport } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import type { ManualEntryConfig } from '../components/data/ManualEntry';
import { detectMergeStrategy, mergeColumns } from './useDataMerge';

export interface UseEditorDataFlowOptions {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: { usl?: number; lsl?: number; target?: number };
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  isPerformanceMode: boolean;
  measureColumns: string[] | null;
  measureLabel: string | null;
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { target?: number; lsl?: number; usl?: number }) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setPerformanceMode: (v: boolean) => void;
  setMeasureColumns: (cols: string[]) => void;
  setMeasureLabel: (label: string) => void;
  loadProject: (id: string) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  loadSample: (sample: SampleDataset) => void;
}

export interface UseEditorDataFlowReturn {
  isManualEntry: boolean;
  setIsManualEntry: (v: boolean) => void;
  appendMode: boolean;
  setAppendMode: (v: boolean) => void;
  isPasteMode: boolean;
  setIsPasteMode: (v: boolean) => void;
  pasteError: string | null;
  isMapping: boolean;
  setIsMapping: (v: boolean) => void;
  isParsingFile: boolean;
  isLoadingProject: boolean;
  setIsLoadingProject: (v: boolean) => void;
  drillFromPerformance: string | null;
  setDrillFromPerformance: (v: string | null) => void;
  mappingColumnAnalysis: ReturnType<typeof detectColumns>['columnAnalysis'] | undefined;
  handleColumnRename: (originalName: string, alias: string) => void;
  existingConfig: ManualEntryConfig | undefined;
  handlePasteAnalyze: (text: string) => Promise<void>;
  handlePasteCancel: () => void;
  handleLoadSample: (sample: SampleDataset) => void;
  handleMappingConfirm: (
    newOutcome: string,
    newFactors: string[],
    newSpecs?: { target?: number; lsl?: number; usl?: number }
  ) => void;
  handleMappingCancel: () => void;
  handleManualEntryCancel: () => void;
  handleAddMoreData: () => void;
  handleDrillToMeasure: (measureId: string) => void;
  handleBackToPerformance: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAppendPaste: (text: string) => Promise<void>;
  handleAppendFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  appendFeedback: string | null;
  triggerFileUpload: () => void;
  triggerAppendFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  appendFileInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Manages data ingestion orchestration for the Azure Editor:
 * paste flow, file upload, sample loading, column mapping,
 * manual entry, and Performance Mode drill navigation.
 */
export function useEditorDataFlow(options: UseEditorDataFlowOptions): UseEditorDataFlowReturn {
  const {
    rawData,
    outcome,
    factors,
    specs,
    columnAliases,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    handleFileUpload,
    loadSample,
  } = options;

  const [isManualEntry, setIsManualEntry] = useState(false);
  const [appendMode, setAppendMode] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);
  const [appendFeedback, setAppendFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Column analysis for ColumnMapping rich cards
  const mappingColumnAnalysis = useMemo(() => {
    if (rawData.length === 0) return undefined;
    return detectColumns(rawData).columnAnalysis;
  }, [rawData]);

  // Column rename handler
  const handleColumnRename = useCallback(
    (originalName: string, alias: string) => {
      if (alias) {
        setColumnAliases({ ...columnAliases, [originalName]: alias });
      } else {
        const next = { ...columnAliases };
        delete next[originalName];
        setColumnAliases(next);
      }
    },
    [columnAliases, setColumnAliases]
  );

  // Existing config for append mode
  const existingConfig = useMemo<ManualEntryConfig | undefined>(() => {
    if (!outcome) return undefined;
    return {
      outcome,
      factors: factors || [],
      specs:
        specs?.usl !== undefined || specs?.lsl !== undefined
          ? { usl: specs.usl, lsl: specs.lsl }
          : undefined,
      isPerformanceMode,
      measureColumns: measureColumns || [],
      measureLabel: measureLabel || 'Channel',
    };
  }, [outcome, factors, specs, isPerformanceMode, measureColumns, measureLabel]);

  const showFeedback = useCallback((msg: string) => {
    setAppendFeedback(msg);
    setTimeout(() => setAppendFeedback(null), 3000);
  }, []);

  // Confirm before replacing active analysis with new data
  const confirmReplaceIfNeeded = useCallback((): boolean => {
    if (rawData.length > 0 && outcome) {
      return window.confirm('Replace current data? This will start a new analysis.');
    }
    return true;
  }, [rawData.length, outcome]);

  // Handle paste -> parse -> auto-detect -> show ColumnMapping (initial load, replaces data)
  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      if (!confirmReplaceIfNeeded()) return;
      setPasteError(null);
      try {
        const data = await parseText(text);
        setRawData(data);
        setDataFilename('Pasted Data');

        const detected = detectColumns(data);
        if (detected.outcome) setOutcome(detected.outcome);
        if (detected.factors.length > 0) setFactors(detected.factors);

        const report = validateData(data, detected.outcome);
        setDataQualityReport(report);

        const wideFormat = detectWideFormat(data);
        if (wideFormat.isWideFormat && wideFormat.channels.length >= 3) {
          setMeasureColumns(wideFormat.channels.map(c => c.id));
          setMeasureLabel('Channel');
          setPerformanceMode(true);
        }

        setIsPasteMode(false);
        setIsMapping(true);
      } catch (err) {
        setPasteError(err instanceof Error ? err.message : 'Failed to parse data');
      }
    },
    [
      confirmReplaceIfNeeded,
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setPerformanceMode,
    ]
  );

  // Handle paste in append context: auto-detect rows vs columns
  const handleAppendPaste = useCallback(
    async (text: string) => {
      setPasteError(null);
      try {
        const incoming = await parseText(text);
        const existingCols = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const incomingCols = Object.keys(incoming[0] || {});
        const strategy = detectMergeStrategy(existingCols, incomingCols);

        if (strategy === 'rows') {
          // Append rows — concat and fill missing columns with null
          const allColumns = new Set([...existingCols, ...incomingCols]);
          const merged = [...rawData, ...incoming].map(row =>
            Object.fromEntries([...allColumns].map(col => [col, row[col] ?? null]))
          );
          setRawData(merged);
          const report = validateData(merged, outcome!);
          setDataQualityReport(report);
          setIsPasteMode(false);
          setAppendMode(false);
          showFeedback(`Appended ${incoming.length} rows (${merged.length} total)`);
        } else {
          // Add columns — index-aligned merge
          const { data: merged, addedColumns } = mergeColumns(rawData, incoming);
          setRawData(merged);
          const report = validateData(merged, outcome!);
          setDataQualityReport(report);
          setIsPasteMode(false);
          setAppendMode(false);
          // Show column mapping for the new columns so user can classify them
          setIsMapping(true);
          showFeedback(
            `Added ${addedColumns.length} column${addedColumns.length !== 1 ? 's' : ''} (${addedColumns.join(', ')})`
          );
        }
      } catch (err) {
        setPasteError(err instanceof Error ? err.message : 'Failed to parse data');
      }
    },
    [rawData, outcome, setRawData, setDataQualityReport, showFeedback]
  );

  // Handle file upload in append context
  const handleAppendFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsParsingFile(true);
      try {
        const success = await handleFileUpload(e);
        if (!success) return;
        // After handleFileUpload, rawData is already set via the hook — but we need
        // the parsed data. handleFileUpload sets rawData directly, so we read
        // from the next render. Instead, go to mapping which will pick up the data.
        setAppendMode(false);
        setIsMapping(true);
      } finally {
        setIsParsingFile(false);
      }
    },
    [handleFileUpload]
  );

  const triggerAppendFileUpload = useCallback(() => {
    appendFileInputRef.current?.click();
  }, []);

  const handlePasteCancel = useCallback(() => {
    setIsPasteMode(false);
    setAppendMode(false);
    setPasteError(null);
  }, []);

  // Handle sample load -> show ColumnMapping (with replace confirmation)
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      if (!confirmReplaceIfNeeded()) return;
      loadSample(sample);
      setIsMapping(true);
    },
    [confirmReplaceIfNeeded, loadSample]
  );

  // Handle column mapping confirm
  const handleMappingConfirm = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number }
    ) => {
      setOutcome(newOutcome);
      setFactors(newFactors);
      if (newSpecs) setSpecs(newSpecs);
      setIsMapping(false);
    },
    [setOutcome, setFactors, setSpecs]
  );

  // Handle column mapping cancel
  const handleMappingCancel = useCallback(() => {
    setRawData([]);
    setOutcome(null);
    setFactors([]);
    setDataFilename(null);
    setDataQualityReport(null);
    setIsMapping(false);
  }, [setRawData, setOutcome, setFactors, setDataFilename, setDataQualityReport]);

  const handleManualEntryCancel = useCallback(() => {
    setIsManualEntry(false);
    setAppendMode(false);
  }, []);

  // handleAddMoreData is now just a signal — the dropdown in Editor controls what happens
  const handleAddMoreData = useCallback(() => {
    setAppendMode(true);
    setIsManualEntry(true);
  }, []);

  // Performance Mode drill navigation
  const handleDrillToMeasure = useCallback(
    (measureId: string) => {
      setDrillFromPerformance(measureId);
      setOutcome(measureId);
    },
    [setOutcome]
  );

  const handleBackToPerformance = useCallback(() => {
    setDrillFromPerformance(null);
  }, []);

  // File upload handling (initial load, replaces data)
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!confirmReplaceIfNeeded()) {
        // Reset the input so the same file can be re-selected
        if (e.target) e.target.value = '';
        return;
      }
      setIsParsingFile(true);
      try {
        await handleFileUpload(e);
        setIsMapping(true);
      } finally {
        setIsParsingFile(false);
      }
    },
    [confirmReplaceIfNeeded, handleFileUpload]
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Expose setIsLoadingProject for the project loading effect in Editor
  return {
    isManualEntry,
    setIsManualEntry,
    appendMode,
    setAppendMode,
    isPasteMode,
    setIsPasteMode,
    pasteError,
    isMapping,
    setIsMapping,
    isParsingFile,
    isLoadingProject,
    setIsLoadingProject,
    drillFromPerformance,
    setDrillFromPerformance,
    mappingColumnAnalysis,
    handleColumnRename,
    existingConfig,
    handlePasteAnalyze,
    handlePasteCancel,
    handleLoadSample,
    handleMappingConfirm,
    handleMappingCancel,
    handleManualEntryCancel,
    handleAddMoreData,
    handleDrillToMeasure,
    handleBackToPerformance,
    handleFileChange,
    handleAppendPaste,
    handleAppendFile,
    appendFeedback,
    triggerFileUpload,
    triggerAppendFileUpload,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
    appendFileInputRef: appendFileInputRef as React.RefObject<HTMLInputElement>,
  };
}
