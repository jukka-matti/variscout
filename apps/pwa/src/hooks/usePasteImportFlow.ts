import React, { useState, useCallback, useMemo } from 'react';
import {
  validateData,
  parseText,
  detectColumns,
  detectWideFormat,
  type DataRow,
  type DataQualityReport,
  type WideFormatDetection,
  type TimeExtractionConfig,
} from '@variscout/core';
import type { ParetoMode } from '@variscout/hooks';

export interface UsePasteImportFlowOptions {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  dataQualityReport: DataQualityReport | null;
  paretoMode: ParetoMode;
  separateParetoFilename: string | null;
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { target?: number; lsl?: number; usl?: number }) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  clearData: () => void;
  clearSelection: () => void;
  applyTimeExtraction: (col: string, config: TimeExtractionConfig) => void;
  handleParetoFileUpload: (file: File) => Promise<boolean>;
  clearParetoFile: () => void;
}

export interface UsePasteImportFlowReturn {
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isManualEntry: boolean;
  wideFormatDetection: WideFormatDetection | null;
  setWideFormatDetection: (v: WideFormatDetection | null) => void;
  timeExtractionPrompt: { timeColumn: string; hasTimeComponent: boolean } | null;
  setTimeExtractionPrompt: (v: { timeColumn: string; hasTimeComponent: boolean } | null) => void;
  timeExtractionConfig: TimeExtractionConfig;
  setTimeExtractionConfig: React.Dispatch<React.SetStateAction<TimeExtractionConfig>>;
  mappingColumnAnalysis: ReturnType<typeof detectColumns>['columnAnalysis'] | undefined;
  handleColumnRename: (originalName: string, alias: string) => void;
  handleWideFormatDetected: (result: WideFormatDetection) => void;
  handlePasteAnalyze: (text: string) => Promise<void>;
  handlePasteCancel: () => void;
  handleOpenPaste: () => void;
  handleManualDataAnalyze: (
    data: DataRow[],
    config: {
      outcome: string;
      factors: string[];
      specs?: { usl?: number; lsl?: number };
    }
  ) => void;
  handleManualEntryCancel: () => void;
  handleOpenManualEntry: () => void;
  handleMappingConfirm: (
    newOutcome: string,
    newFactors: string[],
    newSpecs?: { target?: number; lsl?: number; usl?: number }
  ) => void;
  handleMappingCancel: () => void;
  handleDismissWideFormat: () => void;
  setIsMapping: (v: boolean) => void;
  isMappingReEdit: boolean;
  openFactorManager: () => void;
}

/**
 * Manages the paste/import/manual-entry state machine for the PWA.
 *
 * Accepts data context setters via dependency injection so it never
 * imports useData() directly.
 */
export function usePasteImportFlow(options: UsePasteImportFlowOptions): UsePasteImportFlowReturn {
  const {
    rawData,
    columnAliases,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    clearData,
    clearSelection,
    applyTimeExtraction,
  } = options;

  // State for performance mode auto-detection (wide format dismissal)
  const [wideFormatDetection, setWideFormatDetection] = useState<WideFormatDetection | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [isMappingReEdit, setIsMappingReEdit] = useState(false);

  const [timeExtractionPrompt, setTimeExtractionPrompt] = useState<{
    timeColumn: string;
    hasTimeComponent: boolean;
  } | null>(null);
  const [timeExtractionConfig, setTimeExtractionConfig] = useState<TimeExtractionConfig>({
    extractYear: true,
    extractMonth: true,
    extractWeek: false,
    extractDayOfWeek: true,
    extractHour: false,
  });

  const handleWideFormatDetected = useCallback((result: WideFormatDetection) => {
    setWideFormatDetection(result);
  }, []);

  // Open ColumnMapping in re-edit mode (mid-analysis factor management)
  const openFactorManager = useCallback(() => {
    setIsMapping(true);
    setIsMappingReEdit(true);
  }, []);

  // Column analysis for ColumnMapping rich cards
  const mappingColumnAnalysis = useMemo(() => {
    if (rawData.length === 0) return undefined;
    return detectColumns(rawData).columnAnalysis;
  }, [rawData]);

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

  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      setPasteError(null);
      try {
        const data = await parseText(text);
        setRawData(data);
        setDataFilename('Pasted Data');

        const detected = detectColumns(data);
        if (detected.outcome) {
          setOutcome(detected.outcome);
        }
        if (detected.factors.length > 0) {
          setFactors(detected.factors);
        }

        const report = validateData(data, detected.outcome);
        setDataQualityReport(report);

        const wideFormat = detectWideFormat(data);
        if (wideFormat.isWideFormat) {
          setWideFormatDetection(wideFormat);
        }

        if (detected.timeColumn) {
          setTimeExtractionPrompt({
            timeColumn: detected.timeColumn,
            hasTimeComponent: detected.columnAnalysis.some(
              c =>
                c.name === detected.timeColumn &&
                c.sampleValues.some(v => v.includes('T') || v.includes(':'))
            ),
          });
        }

        setIsPasteMode(false);
        setIsMapping(true);
      } catch (err) {
        setPasteError(err instanceof Error ? err.message : 'Failed to parse data');
      }
    },
    [setRawData, setDataFilename, setOutcome, setFactors, setDataQualityReport]
  );

  const handlePasteCancel = useCallback(() => {
    setIsPasteMode(false);
    setPasteError(null);
  }, []);

  const handleOpenPaste = useCallback(() => {
    setIsPasteMode(true);
    setPasteError(null);
  }, []);

  const handleManualDataAnalyze = useCallback(
    (
      data: DataRow[],
      config: {
        outcome: string;
        factors: string[];
        specs?: { usl?: number; lsl?: number };
      }
    ) => {
      setRawData(data);
      setDataFilename('Manual Entry');
      setOutcome(config.outcome);
      setFactors(config.factors);

      if (config.specs) {
        setSpecs(config.specs);
      }

      const report = validateData(data, config.outcome);
      setDataQualityReport(report);

      clearSelection();
      setIsManualEntry(false);
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      clearSelection,
    ]
  );

  const handleManualEntryCancel = useCallback(() => {
    setIsManualEntry(false);
  }, []);

  const handleOpenManualEntry = useCallback(() => {
    setIsManualEntry(true);
  }, []);

  const handleMappingConfirm = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number }
    ) => {
      if (isMappingReEdit) {
        setIsMappingReEdit(false);
      }

      setOutcome(newOutcome);
      setFactors(newFactors);
      if (newSpecs) {
        setSpecs(newSpecs);
      }
      setIsMapping(false);

      if (timeExtractionPrompt?.timeColumn) {
        applyTimeExtraction(timeExtractionPrompt.timeColumn, timeExtractionConfig);
      }

      setTimeExtractionPrompt(null);
    },
    [
      setOutcome,
      setFactors,
      setSpecs,
      applyTimeExtraction,
      timeExtractionPrompt,
      timeExtractionConfig,
      isMappingReEdit,
    ]
  );

  const handleMappingCancel = useCallback(() => {
    if (isMappingReEdit) {
      // Re-edit cancel: just close, don't wipe data
      setIsMapping(false);
      setIsMappingReEdit(false);
      return;
    }
    // First-time cancel: wipe data
    clearData();
    setIsMapping(false);
  }, [isMappingReEdit, clearData]);

  const handleDismissWideFormat = useCallback(() => {
    setWideFormatDetection(null);
  }, []);

  return {
    isPasteMode,
    pasteError,
    isMapping,
    isManualEntry,
    wideFormatDetection,
    setWideFormatDetection,
    timeExtractionPrompt,
    setTimeExtractionPrompt,
    timeExtractionConfig,
    setTimeExtractionConfig,
    mappingColumnAnalysis,
    handleColumnRename,
    handleWideFormatDetected,
    handlePasteAnalyze,
    handlePasteCancel,
    handleOpenPaste,
    handleManualDataAnalyze,
    handleManualEntryCancel,
    handleOpenManualEntry,
    handleMappingConfirm,
    handleMappingCancel,
    handleDismissWideFormat,
    setIsMapping,
    isMappingReEdit,
    openFactorManager,
  };
}
