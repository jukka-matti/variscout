import React, { useRef, useReducer, useState, useCallback, useMemo } from 'react';
import { parseText, detectColumns, validateData, detectWideFormat } from '@variscout/core';
import type { DataRow, DataQualityReport, TimeExtractionConfig } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import type { ManualEntryConfig } from '../components/data/ManualEntry';
import { detectMergeStrategy, mergeColumns, mergeRows } from './useDataMerge';

// ── Reducer types ──────────────────────────────────────────────────────────

export interface EditorFlowState {
  isManualEntry: boolean;
  appendMode: boolean;
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isMappingReEdit: boolean;
  isParsingFile: boolean;
  isLoadingProject: boolean;
  drillFromPerformance: string | null;
  appendFeedback: string | null;
}

export type EditorFlowAction =
  | { type: 'START_PASTE' }
  | { type: 'START_APPEND_PASTE' }
  | { type: 'PASTE_ERROR'; error: string }
  | { type: 'PASTE_ANALYZED' }
  | { type: 'CANCEL_PASTE' }
  | { type: 'START_MANUAL_ENTRY' }
  | { type: 'START_APPEND_MANUAL' }
  | { type: 'CANCEL_MANUAL_ENTRY' }
  | { type: 'MANUAL_ENTRY_DONE' }
  | { type: 'OPEN_FACTOR_MANAGER' }
  | { type: 'OPEN_MAPPING' }
  | { type: 'CONFIRM_MAPPING' }
  | { type: 'CANCEL_MAPPING' }
  | { type: 'START_FILE_PARSE' }
  | { type: 'FILE_PARSED_TO_MAPPING' }
  | { type: 'FILE_PARSE_DONE' }
  | { type: 'START_APPEND_FILE' }
  | { type: 'APPEND_FILE_TO_MAPPING' }
  | { type: 'APPEND_FILE_DONE' }
  | { type: 'APPEND_ROWS_DONE'; feedback: string }
  | { type: 'APPEND_COLUMNS_DONE'; feedback: string }
  | { type: 'CLEAR_APPEND_FEEDBACK' }
  | { type: 'START_PROJECT_LOAD' }
  | { type: 'PROJECT_LOADED' }
  | { type: 'DRILL_TO_MEASURE'; measureId: string }
  | { type: 'BACK_TO_PERFORMANCE' };

export const initialFlowState: EditorFlowState = {
  isManualEntry: false,
  appendMode: false,
  isPasteMode: false,
  pasteError: null,
  isMapping: false,
  isMappingReEdit: false,
  isParsingFile: false,
  isLoadingProject: false,
  drillFromPerformance: null,
  appendFeedback: null,
};

/** Pure reducer — testable without React. */
export function editorFlowReducer(
  state: EditorFlowState,
  action: EditorFlowAction
): EditorFlowState {
  switch (action.type) {
    case 'START_PASTE':
      return { ...state, isPasteMode: true, pasteError: null };
    case 'START_APPEND_PASTE':
      return { ...state, isPasteMode: true, appendMode: true, pasteError: null };
    case 'PASTE_ERROR':
      return { ...state, pasteError: action.error };
    case 'PASTE_ANALYZED':
      return { ...state, isPasteMode: false, isMapping: true };
    case 'CANCEL_PASTE':
      return { ...state, isPasteMode: false, appendMode: false, pasteError: null };
    case 'START_MANUAL_ENTRY':
      return { ...state, isManualEntry: true };
    case 'START_APPEND_MANUAL':
      return { ...state, isManualEntry: true, appendMode: true };
    case 'CANCEL_MANUAL_ENTRY':
      return { ...state, isManualEntry: false, appendMode: false };
    case 'MANUAL_ENTRY_DONE':
      return { ...state, isManualEntry: false, appendMode: false };
    case 'OPEN_FACTOR_MANAGER':
      return { ...state, isMapping: true, isMappingReEdit: true };
    case 'OPEN_MAPPING':
      return { ...state, isMapping: true, isMappingReEdit: false };
    case 'CONFIRM_MAPPING':
      return { ...state, isMapping: false, isMappingReEdit: false };
    case 'CANCEL_MAPPING':
      return { ...state, isMapping: false, isMappingReEdit: false };
    case 'START_FILE_PARSE':
      return { ...state, isParsingFile: true };
    case 'FILE_PARSED_TO_MAPPING':
      return { ...state, isParsingFile: false, isMapping: true };
    case 'FILE_PARSE_DONE':
      return { ...state, isParsingFile: false };
    case 'START_APPEND_FILE':
      return { ...state, isParsingFile: true, appendMode: true };
    case 'APPEND_FILE_TO_MAPPING':
      return { ...state, isParsingFile: false, appendMode: false, isMapping: true };
    case 'APPEND_FILE_DONE':
      return { ...state, isParsingFile: false };
    case 'APPEND_ROWS_DONE':
      return {
        ...state,
        isPasteMode: false,
        appendMode: false,
        appendFeedback: action.feedback,
      };
    case 'APPEND_COLUMNS_DONE':
      return {
        ...state,
        isPasteMode: false,
        appendMode: false,
        isMapping: true,
        appendFeedback: action.feedback,
      };
    case 'CLEAR_APPEND_FEEDBACK':
      return { ...state, appendFeedback: null };
    case 'START_PROJECT_LOAD':
      return { ...state, isLoadingProject: true };
    case 'PROJECT_LOADED':
      return { ...state, isLoadingProject: false };
    case 'DRILL_TO_MEASURE':
      return { ...state, drillFromPerformance: action.measureId };
    case 'BACK_TO_PERFORMANCE':
      return { ...state, drillFromPerformance: null };
    default:
      return state;
  }
}

// ── Hook interface ─────────────────────────────────────────────────────────

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
  applyTimeExtraction: (col: string, config: TimeExtractionConfig) => void;
}

export interface UseEditorDataFlowReturn {
  // Read-only state from reducer
  isManualEntry: boolean;
  appendMode: boolean;
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isMappingReEdit: boolean;
  isParsingFile: boolean;
  isLoadingProject: boolean;
  drillFromPerformance: string | null;
  appendFeedback: string | null;
  // Semantic action methods (replace raw setters)
  startPaste: () => void;
  startAppendPaste: () => void;
  startManualEntry: () => void;
  startAppendManual: () => void;
  manualEntryDone: () => void;
  startProjectLoad: () => void;
  projectLoaded: () => void;
  startAppendFileUpload: () => void;
  openFactorManager: () => void;
  // Computed
  mappingColumnAnalysis: ReturnType<typeof detectColumns>['columnAnalysis'] | undefined;
  handleColumnRename: (originalName: string, alias: string) => void;
  existingConfig: ManualEntryConfig | undefined;
  // Flow handlers
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
  triggerFileUpload: () => void;
  triggerAppendFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  appendFileInputRef: React.RefObject<HTMLInputElement>;
  // Independent state (not part of flow reducer)
  timeExtractionPrompt: { timeColumn: string; hasTimeComponent: boolean } | null;
  setTimeExtractionPrompt: (v: { timeColumn: string; hasTimeComponent: boolean } | null) => void;
  timeExtractionConfig: TimeExtractionConfig;
  setTimeExtractionConfig: React.Dispatch<React.SetStateAction<TimeExtractionConfig>>;
}

// ── Hook implementation ────────────────────────────────────────────────────

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
    applyTimeExtraction,
  } = options;

  const [flowState, dispatch] = useReducer(editorFlowReducer, initialFlowState);

  // Independent state (not part of flow state machine)
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

  const showFeedback = useCallback((_msg: string) => {
    // Feedback is set via dispatch (APPEND_ROWS_DONE / APPEND_COLUMNS_DONE)
    // but clearance is a side-effect timeout
    setTimeout(() => dispatch({ type: 'CLEAR_APPEND_FEEDBACK' }), 3000);
  }, []);

  // ── Semantic action methods ──────────────────────────────────────────────

  const startPaste = useCallback(() => dispatch({ type: 'START_PASTE' }), []);
  const startAppendPaste = useCallback(() => dispatch({ type: 'START_APPEND_PASTE' }), []);
  const startManualEntry = useCallback(() => dispatch({ type: 'START_MANUAL_ENTRY' }), []);
  const startAppendManual = useCallback(() => dispatch({ type: 'START_APPEND_MANUAL' }), []);
  const manualEntryDone = useCallback(() => dispatch({ type: 'MANUAL_ENTRY_DONE' }), []);
  const startProjectLoad = useCallback(() => dispatch({ type: 'START_PROJECT_LOAD' }), []);
  const projectLoaded = useCallback(() => dispatch({ type: 'PROJECT_LOADED' }), []);

  // Open ColumnMapping in re-edit mode (mid-analysis factor management)
  const openFactorManager = useCallback(() => dispatch({ type: 'OPEN_FACTOR_MANAGER' }), []);

  // Confirm before replacing active analysis with new data
  const confirmReplaceIfNeeded = useCallback((): boolean => {
    if (rawData.length > 0 && outcome) {
      return window.confirm('Replace current data? This will start a new analysis.');
    }
    return true;
  }, [rawData.length, outcome]);

  // ── Flow handlers ────────────────────────────────────────────────────────

  // Handle paste -> parse -> auto-detect -> show ColumnMapping (initial load)
  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      if (!confirmReplaceIfNeeded()) return;
      dispatch({ type: 'PASTE_ERROR', error: '' }); // clear previous error
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

        if (detected.timeColumn) {
          const hasTime = detected.columnAnalysis.some(
            c =>
              c.name === detected.timeColumn &&
              c.sampleValues.some(v => v.includes('T') || v.includes(':'))
          );
          setTimeExtractionPrompt({
            timeColumn: detected.timeColumn,
            hasTimeComponent: hasTime,
          });
          if (hasTime) {
            setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
          }
        }

        dispatch({ type: 'PASTE_ANALYZED' });
      } catch (err) {
        dispatch({
          type: 'PASTE_ERROR',
          error: err instanceof Error ? err.message : 'Failed to parse data',
        });
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
      dispatch({ type: 'PASTE_ERROR', error: '' }); // clear previous error
      try {
        const incoming = await parseText(text);
        const existingCols = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const incomingCols = Object.keys(incoming[0] || {});
        const strategy = detectMergeStrategy(existingCols, incomingCols);

        if (strategy === 'rows') {
          const merged = mergeRows(rawData, incoming);
          setRawData(merged);
          const report = validateData(merged, outcome!);
          setDataQualityReport(report);
          const feedback = `Appended ${incoming.length} rows (${merged.length} total)`;
          dispatch({ type: 'APPEND_ROWS_DONE', feedback });
          showFeedback(feedback);
        } else {
          const { data: merged, addedColumns } = mergeColumns(rawData, incoming);
          setRawData(merged);
          const report = validateData(merged, outcome!);
          setDataQualityReport(report);
          const feedback = `Added ${addedColumns.length} column${addedColumns.length !== 1 ? 's' : ''} (${addedColumns.join(', ')})`;
          dispatch({ type: 'APPEND_COLUMNS_DONE', feedback });
          showFeedback(feedback);
        }
      } catch (err) {
        dispatch({
          type: 'PASTE_ERROR',
          error: err instanceof Error ? err.message : 'Failed to parse data',
        });
      }
    },
    [rawData, outcome, setRawData, setDataQualityReport, showFeedback]
  );

  // Handle file upload in append context
  const handleAppendFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'START_APPEND_FILE' });
      try {
        const success = await handleFileUpload(e);
        if (!success) {
          dispatch({ type: 'APPEND_FILE_DONE' });
          return;
        }
        dispatch({ type: 'APPEND_FILE_TO_MAPPING' });
      } catch {
        dispatch({ type: 'APPEND_FILE_DONE' });
      }
    },
    [handleFileUpload]
  );

  const startAppendFileUpload = useCallback(() => {
    dispatch({ type: 'START_APPEND_FILE' });
    appendFileInputRef.current?.click();
  }, []);

  const triggerAppendFileUpload = useCallback(() => {
    appendFileInputRef.current?.click();
  }, []);

  const handlePasteCancel = useCallback(() => dispatch({ type: 'CANCEL_PASTE' }), []);

  // Handle sample load -> show ColumnMapping (with replace confirmation)
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      if (!confirmReplaceIfNeeded()) return;
      loadSample(sample);
      dispatch({ type: 'OPEN_MAPPING' });
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
      if (flowState.isMappingReEdit) {
        const removedFactors = factors.filter(f => !newFactors.includes(f));
        if (removedFactors.length > 0) {
          // Clean orphaned filters (via DataContext setFilters if needed)
          // The factors change will cascade through DataContext filtering
        }
      }

      setOutcome(newOutcome);
      setFactors(newFactors);
      if (newSpecs) setSpecs(newSpecs);
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
      flowState.isMappingReEdit,
      factors,
      applyTimeExtraction,
      timeExtractionPrompt,
      timeExtractionConfig,
    ]
  );

  // Handle column mapping cancel
  const handleMappingCancel = useCallback(() => {
    if (flowState.isMappingReEdit) {
      dispatch({ type: 'CANCEL_MAPPING' });
      return;
    }
    // First-time cancel: wipe data
    setRawData([]);
    setOutcome(null);
    setFactors([]);
    setDataFilename(null);
    setDataQualityReport(null);
    dispatch({ type: 'CANCEL_MAPPING' });
  }, [
    flowState.isMappingReEdit,
    setRawData,
    setOutcome,
    setFactors,
    setDataFilename,
    setDataQualityReport,
  ]);

  const handleManualEntryCancel = useCallback(() => dispatch({ type: 'CANCEL_MANUAL_ENTRY' }), []);

  // handleAddMoreData is now just a signal — the dropdown in Editor controls what happens
  const handleAddMoreData = useCallback(() => dispatch({ type: 'START_APPEND_MANUAL' }), []);

  // Performance Mode drill navigation
  const handleDrillToMeasure = useCallback(
    (measureId: string) => {
      dispatch({ type: 'DRILL_TO_MEASURE', measureId });
      setOutcome(measureId);
    },
    [setOutcome]
  );

  const handleBackToPerformance = useCallback(() => dispatch({ type: 'BACK_TO_PERFORMANCE' }), []);

  // File upload handling (initial load, replaces data)
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!confirmReplaceIfNeeded()) {
        if (e.target) e.target.value = '';
        return;
      }
      dispatch({ type: 'START_FILE_PARSE' });
      try {
        await handleFileUpload(e);
        dispatch({ type: 'FILE_PARSED_TO_MAPPING' });
      } catch {
        dispatch({ type: 'FILE_PARSE_DONE' });
      }
    },
    [confirmReplaceIfNeeded, handleFileUpload]
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // State (from reducer)
    ...flowState,
    // Semantic action methods
    startPaste,
    startAppendPaste,
    startManualEntry,
    startAppendManual,
    manualEntryDone,
    startProjectLoad,
    projectLoaded,
    startAppendFileUpload,
    openFactorManager,
    // Computed
    mappingColumnAnalysis,
    handleColumnRename,
    existingConfig,
    // Flow handlers
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
    triggerFileUpload,
    triggerAppendFileUpload,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
    appendFileInputRef: appendFileInputRef as React.RefObject<HTMLInputElement>,
    // Independent state
    timeExtractionPrompt,
    setTimeExtractionPrompt,
    timeExtractionConfig,
    setTimeExtractionConfig,
  };
}
