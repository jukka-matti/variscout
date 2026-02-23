import React, { useRef, useState, useCallback, useMemo } from 'react';
import { parseText, detectColumns, validateData, detectWideFormat } from '@variscout/core';
import type { DataRow, DataQualityReport } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import type { ManualEntryConfig } from '../components/data/ManualEntry';

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
  triggerFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle paste -> parse -> auto-detect -> show ColumnMapping
  const handlePasteAnalyze = useCallback(
    async (text: string) => {
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

  const handlePasteCancel = useCallback(() => {
    setIsPasteMode(false);
    setPasteError(null);
  }, []);

  // Handle sample load -> show ColumnMapping
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      loadSample(sample);
      setIsMapping(true);
    },
    [loadSample]
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

  // File upload handling
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsParsingFile(true);
      try {
        await handleFileUpload(e);
        setIsMapping(true);
      } finally {
        setIsParsingFile(false);
      }
    },
    [handleFileUpload]
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
    triggerFileUpload,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
  };
}
