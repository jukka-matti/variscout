import React, { useRef, useReducer, useState, useCallback, useMemo } from 'react';
import {
  parseText,
  detectColumns,
  validateData,
  detectWideFormat,
  detectYamazumiFormat,
  detectDefectFormat,
  augmentWithTimeColumns,
  stackColumns,
  parseTimeValue,
} from '@variscout/core';
import type {
  AnalysisMode,
  DataRow,
  DataQualityReport,
  TimeExtractionConfig,
  YamazumiDetection,
  DefectDetection,
  StackConfig,
  ProcessHub,
} from '@variscout/core';
import {
  classifyPaste,
  archiveReplacedRows,
  type MatchSummaryClassification,
} from '@variscout/core/matchSummary';
import { isProcessHubComplete } from '@variscout/core/processHub';
import type { RowProvenanceTag } from '@variscout/core/evidenceSources';
import type { MatchSummaryActionChoice } from '@variscout/ui';
import type { SampleDataset } from '@variscout/data';
import type { ManualEntryConfig } from '../../components/data/ManualEntry';
import { detectMergeStrategy, mergeColumns, mergeRows } from '../../hooks/useDataMerge';

/** Time-derived column suffixes used by augmentWithTimeColumns */
const TIME_SUFFIXES = ['_Year', '_Month', '_Week', '_DayOfWeek', '_Hour'] as const;

/**
 * Re-apply time column extraction on merged data.
 * Detects existing time-derived factors and re-derives them for all rows.
 */
function reapplyTimeColumns(data: DataRow[], factors: string[]): void {
  for (const factor of factors) {
    for (const suffix of TIME_SUFFIXES) {
      if (factor.endsWith(suffix)) {
        const sourceColumn = factor.slice(0, -suffix.length);
        if (data.length > 0 && sourceColumn in data[0]) {
          augmentWithTimeColumns(data, sourceColumn, {
            extractYear: suffix === '_Year',
            extractMonth: suffix === '_Month',
            extractWeek: suffix === '_Week',
            extractDayOfWeek: suffix === '_DayOfWeek',
            extractHour: suffix === '_Hour',
          });
        }
      }
    }
  }
}

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

export interface MatchSummaryPending {
  classification: MatchSummaryClassification;
  newRows: DataRow[];
  newColumns: string[];
  newTimeColumn?: string;
}

export interface UseEditorDataFlowOptions {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: { usl?: number; lsl?: number; target?: number };
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  analysisMode: AnalysisMode;
  measureColumns: string[] | null;
  measureLabel: string | null;
  /** Active process hub — when set and complete, paste triggers the Mode A.2 match-summary path. */
  activeHub?: ProcessHub;
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { target?: number; lsl?: number; usl?: number }) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setMeasureColumns: (cols: string[]) => void;
  setMeasureLabel: (label: string) => void;
  loadProject: (id: string) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  /** Process a File object directly (e.g., from SharePoint File Picker) */
  processFile: (file: File) => Promise<boolean>;
  loadSample: (sample: SampleDataset) => void;
  applyTimeExtraction: (col: string, config: TimeExtractionConfig) => void;
  /** Optional — populated only on multi-source join confirmation (P3.4). */
  setRowProvenance?: (startIndex: number, tags: RowProvenanceTag[]) => void;
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
  suggestedStack: ReturnType<typeof detectColumns>['suggestedStack'];
  handleStackConfigChange: (config: StackConfig | null) => void;
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
  /** Handle a File object directly (e.g., from SharePoint File Picker, ADR-030) */
  handleFile: (file: File) => Promise<void>;
  handleAppendPaste: (text: string) => Promise<void>;
  handleAppendFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerFileUpload: () => void;
  triggerAppendFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  appendFileInputRef: React.RefObject<HTMLInputElement | null>;
  // Independent state (not part of flow reducer)
  timeExtractionPrompt: { timeColumn: string; hasTimeComponent: boolean } | null;
  setTimeExtractionPrompt: (v: { timeColumn: string; hasTimeComponent: boolean } | null) => void;
  timeExtractionConfig: TimeExtractionConfig;
  setTimeExtractionConfig: React.Dispatch<React.SetStateAction<TimeExtractionConfig>>;
  // Yamazumi detection
  yamazumiDetection: YamazumiDetection | null;
  dismissYamazumiDetection: () => void;
  handleYamazumiDetectedFromIngestion: (result: YamazumiDetection) => void;
  // Defect detection
  defectDetection: DefectDetection | null;
  dismissDefectDetection: () => void;
  handleDefectDetectedFromIngestion: (result: DefectDetection) => void;
  // Match-summary (Mode A.2 paste into existing complete Hub)
  matchSummary: MatchSummaryPending | undefined;
  acceptMatchSummary: (choice: MatchSummaryActionChoice) => void;
  cancelMatchSummary: () => void;
}

// ── Hook implementation ────────────────────────────────────────────────────

/**
 * Derives a stable source identifier from the distinguishing columns of the
 * new dataset (those NOT present in the existing hub columns).
 * Deterministic — no randomness.
 */
function deriveSourceId(hubColumns: readonly string[], newColumns: readonly string[]): string {
  const distinguishing = newColumns.find(c => !hubColumns.includes(c));
  if (distinguishing) return distinguishing.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return 'source-2';
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
    analysisMode,
    measureColumns,
    measureLabel,
    activeHub,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    setAnalysisMode,
    setMeasureColumns,
    setMeasureLabel,
    handleFileUpload,
    processFile: processFileFromPicker,
    loadSample,
    applyTimeExtraction,
    setRowProvenance,
  } = options;

  const [flowState, dispatch] = useReducer(editorFlowReducer, initialFlowState);

  // Independent state (not part of flow state machine)
  const [pendingStackConfig, setPendingStackConfig] = useState<StackConfig | null>(null);
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

  // Yamazumi detection state
  const [yamazumiDetection, setYamazumiDetection] = useState<YamazumiDetection | null>(null);
  const dismissYamazumiDetection = useCallback(() => setYamazumiDetection(null), []);
  const handleYamazumiDetectedFromIngestion = useCallback(
    (result: YamazumiDetection) => setYamazumiDetection(result),
    []
  );

  // Defect detection state
  const [defectDetection, setDefectDetection] = useState<DefectDetection | null>(null);
  const dismissDefectDetection = useCallback(() => setDefectDetection(null), []);
  const handleDefectDetectedFromIngestion = useCallback(
    (result: DefectDetection) => setDefectDetection(result),
    []
  );

  // Mode A.2 match-summary state — set when paste detects an existing complete Hub.
  const [matchSummary, setMatchSummary] = useState<MatchSummaryPending | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Column analysis for ColumnMapping rich cards
  const detectedColumnsResult = useMemo(() => {
    if (rawData.length === 0) return undefined;
    return detectColumns(rawData);
  }, [rawData]);

  const mappingColumnAnalysis = detectedColumnsResult?.columnAnalysis;
  const suggestedStack = detectedColumnsResult?.suggestedStack;

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
      analysisMode: analysisMode === 'performance' ? 'performance' : 'standard',
      measureColumns: measureColumns || [],
      measureLabel: measureLabel || 'Channel',
    };
  }, [outcome, factors, specs, analysisMode, measureColumns, measureLabel]);

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

  // ── Flow handlers ────────────────────────────────────────────────────────

  /**
   * Inner function: run the post-parse pipeline on already-parsed rows.
   * Called both from handlePasteAnalyze (first parse) and from acceptMatchSummary
   * (re-dispatch after user confirms match-summary choice).
   */
  const _proceedWithParsedData = useCallback(
    (data: DataRow[]) => {
      setRawData(data);
      setDataFilename('Pasted Data');

      const detected = detectColumns(data);
      if (detected.outcome) setOutcome(detected.outcome);
      if (detected.factors.length > 0) setFactors(detected.factors);

      const report = validateData(data, detected.outcome ? [detected.outcome] : []);
      setDataQualityReport(report);

      // Check for Yamazumi format (more specific than wide format)
      const yamazumiResult = detectYamazumiFormat(data, detected.columnAnalysis);
      if (yamazumiResult.isYamazumiFormat) {
        setYamazumiDetection(yamazumiResult);
      } else {
        // Check for defect format before falling back to wide/standard
        const defectResult = detectDefectFormat(data, detected.columnAnalysis);
        if (defectResult.isDefectFormat) {
          setDefectDetection(defectResult);
        } else {
          const wideFormat = detectWideFormat(data);
          if (wideFormat.isWideFormat && wideFormat.channels.length >= 3) {
            setMeasureColumns(wideFormat.channels.map(c => c.id));
            setMeasureLabel('Channel');
            setAnalysisMode('performance');
          }
        }
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
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setAnalysisMode,
    ]
  );

  // Handle paste -> parse -> auto-detect -> show ColumnMapping (initial load).
  // When activeHub is a complete Hub (D9), route through match-summary card instead
  // of the legacy window.confirm('Replace current data?').
  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      dispatch({ type: 'PASTE_ERROR', error: '' }); // clear previous error

      // Mode B / no complete Hub: legacy confirm-before-parse path — keep original
      // order so the user is prompted before any parse work happens.
      if (!(activeHub && isProcessHubComplete(activeHub))) {
        if (rawData.length > 0 && outcome) {
          if (!window.confirm('Replace current data? This will start a new analysis.')) return;
        }
      }

      try {
        const data = await parseText(text);

        // Mode A.2: complete Hub present → classify the paste and surface the card.
        if (activeHub && isProcessHubComplete(activeHub)) {
          const hubColumns = activeHub.outcomes?.map(o => o.columnName) ?? [];
          const newColumns = data.length > 0 ? Object.keys(data[0]) : [];
          const detected = detectColumns(data);
          const classification = classifyPaste(
            {
              hubColumns,
              existingRows: rawData.slice(0, 1000),
              existingTimeColumn: undefined,
            },
            {
              newColumns,
              newRows: data,
              newTimeColumn: detected.timeColumn ?? undefined,
            }
          );
          setMatchSummary({
            classification,
            newRows: data,
            newColumns,
            newTimeColumn: detected.timeColumn ?? undefined,
          });
          // Transition out of paste mode — match-summary card takes over.
          dispatch({ type: 'CANCEL_PASTE' });
          return;
        }

        _proceedWithParsedData(data);
      } catch (err) {
        dispatch({
          type: 'PASTE_ERROR',
          error: err instanceof Error ? err.message : 'Failed to parse data',
        });
      }
    },
    [activeHub, rawData, outcome, _proceedWithParsedData]
  );

  /**
   * Accept a match-summary action choice.
   * Proceed-cases re-dispatch the pending rows through the existing column-mapping
   * pipeline. Cancel/separate-hub cases dismiss the card without committing data.
   */
  const acceptMatchSummary = useCallback(
    (choice: MatchSummaryActionChoice) => {
      const ms = matchSummary;
      if (!ms) return;
      setMatchSummary(undefined);

      switch (choice.kind) {
        case 'overlap-cancel':
        case 'different-grain-cancel':
        case 'different-grain-separate-hub':
        case 'different-source-no-key-new-hub':
          // TODO (slice 4): 'separate-hub' / 'new-hub' intents trigger a new Hub creation
          // flow. For now, cancel the paste — block-case discipline is the critical part.
          return;

        case 'multi-source-join': {
          // P3.4: populate the sidecar provenance Map before appending rows.
          const hubCols = activeHub?.outcomes?.map(o => o.columnName) ?? [];
          const sourceId = deriveSourceId(hubCols, ms.newColumns);
          const startIndex = rawData.length;
          const tags: RowProvenanceTag[] = ms.newRows.map(() => ({
            source: sourceId,
            joinKey: choice.candidate.hubColumn,
          }));
          setRowProvenance?.(startIndex, tags);
          dispatch({ type: 'START_PASTE' });
          _proceedWithParsedData(ms.newRows);
          return;
        }

        case 'overlap-replace': {
          // Archive existing rows that fall within the overlap range, then merge:
          // non-overlap existing rows ∪ archived overlap rows ∪ new rows.
          const importId = crypto.randomUUID();
          const overlapRange = ms.classification.overlapRange;
          const timeCol = ms.newTimeColumn;

          if (overlapRange && timeCol) {
            const overlapStart = new Date(overlapRange.startISO).getTime();
            const overlapEnd = new Date(overlapRange.endISO).getTime();

            const overlapRows: DataRow[] = [];
            const nonOverlapRows: DataRow[] = [];

            for (const row of rawData) {
              const parsed = parseTimeValue(row[timeCol]);
              const ms2 = parsed ? parsed.getTime() : NaN;
              if (Number.isFinite(ms2) && ms2 >= overlapStart && ms2 <= overlapEnd) {
                overlapRows.push(row);
              } else {
                nonOverlapRows.push(row);
              }
            }

            const archived = archiveReplacedRows(overlapRows, importId);
            const merged = [...nonOverlapRows, ...archived, ...ms.newRows];
            dispatch({ type: 'START_PASTE' });
            _proceedWithParsedData(merged);
          } else {
            // No overlap range available (existingRange not yet wired); fall back to
            // replacing the full dataset with the new rows.
            dispatch({ type: 'START_PASTE' });
            _proceedWithParsedData(ms.newRows);
          }
          return;
        }

        case 'append':
        case 'backfill':
        case 'replace':
        case 'no-timestamp':
        case 'overlap-keep-both':
          // Re-enter paste mode momentarily so the pipeline dispatch lands cleanly.
          dispatch({ type: 'START_PASTE' });
          _proceedWithParsedData(ms.newRows);
          return;
      }
    },
    [matchSummary, activeHub, rawData, setRowProvenance, _proceedWithParsedData]
  );

  const cancelMatchSummary = useCallback(() => setMatchSummary(undefined), []);

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
          reapplyTimeColumns(merged, factors);
          setRawData(merged);
          const report = validateData(merged, outcome ? [outcome] : []);
          setDataQualityReport(report);
          const feedback = `Appended ${incoming.length} rows (${merged.length} total)`;
          dispatch({ type: 'APPEND_ROWS_DONE', feedback });
          showFeedback(feedback);
        } else {
          const { data: merged, addedColumns } = mergeColumns(rawData, incoming);
          setRawData(merged);
          const report = validateData(merged, outcome ? [outcome] : []);
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
    [rawData, outcome, factors, setRawData, setDataQualityReport, showFeedback]
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

  // Handle sample load (with replace confirmation)
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      if (rawData.length > 0 && outcome) {
        if (!window.confirm('Replace current data? This will start a new analysis.')) return;
      }
      loadSample(sample);
      // Pre-configured samples already have outcome/factors — skip ColumnMapping
      const hasPreconfigured =
        sample.config?.outcome && sample.config.factors && sample.config.factors.length > 0;
      if (!hasPreconfigured) {
        dispatch({ type: 'OPEN_MAPPING' });
      }
    },
    [rawData.length, outcome, loadSample]
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

      // Apply stack transform if configured
      if (pendingStackConfig && pendingStackConfig.columnsToStack.length > 0) {
        const result = stackColumns(rawData, pendingStackConfig);
        setRawData(result.data);
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
      setRawData,
      rawData,
      pendingStackConfig,
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
      if (rawData.length > 0 && outcome) {
        if (!window.confirm('Replace current data? This will start a new analysis.')) {
          if (e.target) e.target.value = '';
          return;
        }
      }
      dispatch({ type: 'START_FILE_PARSE' });
      try {
        await handleFileUpload(e);
        dispatch({ type: 'FILE_PARSED_TO_MAPPING' });
      } catch {
        dispatch({ type: 'FILE_PARSE_DONE' });
      }
    },
    [rawData.length, outcome, handleFileUpload]
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Direct File object handler — no synthetic event needed
  // Used by SharePoint File Picker integration (ADR-030)
  const handleFile = useCallback(
    async (file: File) => {
      if (rawData.length > 0 && outcome) {
        if (!window.confirm('Replace current data? This will start a new analysis.')) return;
      }
      dispatch({ type: 'START_FILE_PARSE' });
      try {
        await processFileFromPicker(file);
        dispatch({ type: 'FILE_PARSED_TO_MAPPING' });
      } catch {
        dispatch({ type: 'FILE_PARSE_DONE' });
      }
    },
    [rawData.length, outcome, processFileFromPicker]
  );

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
    suggestedStack,
    handleStackConfigChange: setPendingStackConfig,
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
    handleFile,
    handleAppendPaste,
    handleAppendFile,
    triggerFileUpload,
    triggerAppendFileUpload,
    fileInputRef,
    appendFileInputRef,
    // Independent state
    timeExtractionPrompt,
    setTimeExtractionPrompt,
    timeExtractionConfig,
    setTimeExtractionConfig,
    // Yamazumi detection
    yamazumiDetection,
    dismissYamazumiDetection,
    handleYamazumiDetectedFromIngestion,
    // Defect detection
    defectDetection,
    dismissDefectDetection,
    handleDefectDetectedFromIngestion,
    // Match-summary (Mode A.2 paste into existing complete Hub)
    matchSummary,
    acceptMatchSummary,
    cancelMatchSummary,
  };
}
