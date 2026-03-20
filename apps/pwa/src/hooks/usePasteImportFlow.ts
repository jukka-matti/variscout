import React, { useReducer, useState, useCallback, useMemo } from 'react';
import {
  validateData,
  parseText,
  detectColumns,
  detectWideFormat,
  detectYamazumiFormat,
  type DataRow,
  type DataQualityReport,
  type WideFormatDetection,
  type TimeExtractionConfig,
  type YamazumiDetection,
} from '@variscout/core';

// ── Reducer types ──────────────────────────────────────────────────────────

export interface PasteFlowState {
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isMappingReEdit: boolean;
  isManualEntry: boolean;
  wideFormatDetection: WideFormatDetection | null;
  yamazumiDetection: YamazumiDetection | null;
}

export type PasteFlowAction =
  | { type: 'START_PASTE' }
  | { type: 'PASTE_ERROR'; error: string }
  | { type: 'PASTE_ANALYZED' }
  | { type: 'PASTE_ANALYZED_WIDE'; detection: WideFormatDetection }
  | { type: 'CANCEL_PASTE' }
  | { type: 'START_MANUAL_ENTRY' }
  | { type: 'CANCEL_MANUAL_ENTRY' }
  | { type: 'MANUAL_ENTRY_DONE' }
  | { type: 'OPEN_FACTOR_MANAGER' }
  | { type: 'CONFIRM_MAPPING' }
  | { type: 'CANCEL_MAPPING' }
  | { type: 'WIDE_FORMAT_DETECTED'; detection: WideFormatDetection }
  | { type: 'DISMISS_WIDE_FORMAT' }
  | { type: 'YAMAZUMI_DETECTED'; detection: YamazumiDetection }
  | { type: 'DISMISS_YAMAZUMI' };

export const initialPasteFlowState: PasteFlowState = {
  isPasteMode: false,
  pasteError: null,
  isMapping: false,
  isMappingReEdit: false,
  isManualEntry: false,
  wideFormatDetection: null,
  yamazumiDetection: null,
};

/** Pure reducer — testable without React. */
export function pasteFlowReducer(state: PasteFlowState, action: PasteFlowAction): PasteFlowState {
  switch (action.type) {
    case 'START_PASTE':
      return { ...state, isPasteMode: true, pasteError: null };
    case 'PASTE_ERROR':
      return { ...state, pasteError: action.error };
    case 'PASTE_ANALYZED':
      return { ...state, isPasteMode: false, isMapping: true };
    case 'PASTE_ANALYZED_WIDE':
      return {
        ...state,
        isPasteMode: false,
        isMapping: true,
        wideFormatDetection: action.detection,
      };
    case 'CANCEL_PASTE':
      return { ...state, isPasteMode: false, pasteError: null };
    case 'START_MANUAL_ENTRY':
      return { ...state, isManualEntry: true };
    case 'CANCEL_MANUAL_ENTRY':
      return { ...state, isManualEntry: false };
    case 'MANUAL_ENTRY_DONE':
      return { ...state, isManualEntry: false };
    case 'OPEN_FACTOR_MANAGER':
      return { ...state, isMapping: true, isMappingReEdit: true };
    case 'CONFIRM_MAPPING':
      return { ...state, isMapping: false, isMappingReEdit: false };
    case 'CANCEL_MAPPING':
      return { ...state, isMapping: false, isMappingReEdit: false };
    case 'WIDE_FORMAT_DETECTED':
      return { ...state, wideFormatDetection: action.detection };
    case 'DISMISS_WIDE_FORMAT':
      return { ...state, wideFormatDetection: null };
    case 'YAMAZUMI_DETECTED':
      return { ...state, yamazumiDetection: action.detection };
    case 'DISMISS_YAMAZUMI':
      return { ...state, yamazumiDetection: null };
    default:
      return state;
  }
}

// ── Hook options & return ──────────────────────────────────────────────────

export interface UsePasteImportFlowOptions {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  dataQualityReport: DataQualityReport | null;
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
}

export interface UsePasteImportFlowReturn {
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isManualEntry: boolean;
  wideFormatDetection: WideFormatDetection | null;
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
  yamazumiDetection: YamazumiDetection | null;
  handleYamazumiDetected: (result: YamazumiDetection) => void;
  handleDismissYamazumi: () => void;
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

  // Flow state machine
  const [flowState, dispatch] = useReducer(pasteFlowReducer, initialPasteFlowState);

  // Independent lifecycle — not part of the flow state machine
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
    dispatch({ type: 'WIDE_FORMAT_DETECTED', detection: result });
  }, []);

  // Open ColumnMapping in re-edit mode (mid-analysis factor management)
  const openFactorManager = useCallback(() => {
    dispatch({ type: 'OPEN_FACTOR_MANAGER' });
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
      dispatch({ type: 'START_PASTE' }); // clears pasteError
      // Immediately re-clear — START_PASTE sets isPasteMode=true but we're already in paste mode
      // The purpose here is just to clear pasteError before attempting parse
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

        const yamazumiResult = detectYamazumiFormat(data, detected.columnAnalysis);
        if (yamazumiResult.isYamazumiFormat) {
          dispatch({ type: 'YAMAZUMI_DETECTED', detection: yamazumiResult });
        }

        const wideFormat = detectWideFormat(data);
        if (wideFormat.isWideFormat) {
          dispatch({ type: 'PASTE_ANALYZED_WIDE', detection: wideFormat });
        } else {
          dispatch({ type: 'PASTE_ANALYZED' });
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
      } catch (err) {
        dispatch({
          type: 'PASTE_ERROR',
          error: err instanceof Error ? err.message : 'Failed to parse data',
        });
      }
    },
    [setRawData, setDataFilename, setOutcome, setFactors, setDataQualityReport]
  );

  const handlePasteCancel = useCallback(() => {
    dispatch({ type: 'CANCEL_PASTE' });
  }, []);

  const handleOpenPaste = useCallback(() => {
    dispatch({ type: 'START_PASTE' });
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
      dispatch({ type: 'MANUAL_ENTRY_DONE' });
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
    dispatch({ type: 'CANCEL_MANUAL_ENTRY' });
  }, []);

  const handleOpenManualEntry = useCallback(() => {
    dispatch({ type: 'START_MANUAL_ENTRY' });
  }, []);

  const handleMappingConfirm = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number }
    ) => {
      setOutcome(newOutcome);
      setFactors(newFactors);
      if (newSpecs) {
        setSpecs(newSpecs);
      }
      dispatch({ type: 'CONFIRM_MAPPING' });

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
    ]
  );

  const handleMappingCancel = useCallback(() => {
    if (flowState.isMappingReEdit) {
      // Re-edit cancel: just close, don't wipe data
      dispatch({ type: 'CANCEL_MAPPING' });
      return;
    }
    // First-time cancel: wipe data
    clearData();
    dispatch({ type: 'CANCEL_MAPPING' });
  }, [flowState.isMappingReEdit, clearData]);

  const handleDismissWideFormat = useCallback(() => {
    dispatch({ type: 'DISMISS_WIDE_FORMAT' });
  }, []);

  const handleYamazumiDetected = useCallback((result: YamazumiDetection) => {
    dispatch({ type: 'YAMAZUMI_DETECTED', detection: result });
  }, []);

  const handleDismissYamazumi = useCallback(() => {
    dispatch({ type: 'DISMISS_YAMAZUMI' });
  }, []);

  return {
    isPasteMode: flowState.isPasteMode,
    pasteError: flowState.pasteError,
    isMapping: flowState.isMapping,
    isManualEntry: flowState.isManualEntry,
    wideFormatDetection: flowState.wideFormatDetection,
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
    yamazumiDetection: flowState.yamazumiDetection,
    handleYamazumiDetected,
    handleDismissYamazumi,
    isMappingReEdit: flowState.isMappingReEdit,
    openFactorManager,
  };
}
