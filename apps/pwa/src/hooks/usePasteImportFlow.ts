import React, { useReducer, useState, useCallback, useMemo } from 'react';
import {
  validateData,
  parseText,
  detectColumns,
  detectWideFormat,
  detectYamazumiFormat,
  detectDefectFormat,
  stackColumns,
  parseTimeValue,
  type DataRow,
  type DataQualityReport,
  type WideFormatDetection,
  type TimeExtractionConfig,
  type YamazumiDetection,
  type DefectDetection,
  type StackConfig,
  type ProcessHub,
} from '@variscout/core';
import {
  classifyPaste,
  archiveReplacedRows,
  type MatchSummaryClassification,
} from '@variscout/core/matchSummary';
import { isProcessHubComplete } from '@variscout/core/processHub';
import type { EvidenceSnapshot, RowProvenanceTag } from '@variscout/core/evidenceSources';
import type { MatchSummaryActionChoice } from '@variscout/ui';

// ── Reducer types ──────────────────────────────────────────────────────────

export interface PasteFlowState {
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isMappingReEdit: boolean;
  isManualEntry: boolean;
  wideFormatDetection: WideFormatDetection | null;
  yamazumiDetection: YamazumiDetection | null;
  defectDetection: DefectDetection | null;
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
  | { type: 'DISMISS_YAMAZUMI' }
  | { type: 'DEFECT_DETECTED'; detection: DefectDetection }
  | { type: 'DISMISS_DEFECT' };

export const initialPasteFlowState: PasteFlowState = {
  isPasteMode: false,
  pasteError: null,
  isMapping: false,
  isMappingReEdit: false,
  isManualEntry: false,
  wideFormatDetection: null,
  yamazumiDetection: null,
  defectDetection: null,
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
    case 'DEFECT_DETECTED':
      return { ...state, defectDetection: action.detection };
    case 'DISMISS_DEFECT':
      return { ...state, defectDetection: null };
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
  /** Active session Hub — when set and complete, paste triggers the Mode A.2 match-summary path. */
  activeHub?: ProcessHub;
  /**
   * Evidence snapshots for the active hub, sorted ascending by `importedAt`.
   * The most-recent snapshot (`at(-1)`) supplies `rowTimestampRange` to
   * `classifyPaste` for temporal-axis classification (overlap / append / backfill).
   *
   * PWA has no snapshot persistence (Spec 5 / Q8). Pass `undefined` — the
   * overlap-replace UI is currently unreachable in PWA; wiring is in place for
   * when snapshot persistence lands.
   */
  evidenceSnapshots?: EvidenceSnapshot[];
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
  /** Optional — populated only on multi-source join confirmation (P3.4). */
  setRowProvenance?: (startIndex: number, tags: RowProvenanceTag[]) => void;
}

export interface MatchSummaryPending {
  classification: MatchSummaryClassification;
  newRows: DataRow[];
  newColumns: string[];
  newTimeColumn?: string;
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
  suggestedStack: ReturnType<typeof detectColumns>['suggestedStack'];
  handleStackConfigChange: (config: StackConfig | null) => void;
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
  defectDetection: DefectDetection | null;
  handleDefectDetected: (result: DefectDetection) => void;
  handleDismissDefect: () => void;
  isMappingReEdit: boolean;
  openFactorManager: () => void;
  /** Pending match-summary classification — set when Mode A.2 paste is detected. */
  matchSummary: MatchSummaryPending | undefined;
  acceptMatchSummary: (choice: MatchSummaryActionChoice) => void;
  cancelMatchSummary: () => void;
}

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
 * Manages the paste/import/manual-entry state machine for the PWA.
 *
 * Accepts data context setters via dependency injection so it never
 * imports from Zustand stores directly.
 */
export function usePasteImportFlow(options: UsePasteImportFlowOptions): UsePasteImportFlowReturn {
  const {
    rawData,
    columnAliases,
    activeHub,
    evidenceSnapshots,
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
    setRowProvenance,
  } = options;

  // Flow state machine
  const [flowState, dispatch] = useReducer(pasteFlowReducer, initialPasteFlowState);

  // Independent lifecycle — not part of the flow state machine
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

  // Mode A.2 match-summary state — set when paste detects an existing complete Hub.
  const [matchSummary, setMatchSummary] = useState<MatchSummaryPending | undefined>(undefined);

  const handleWideFormatDetected = useCallback((result: WideFormatDetection) => {
    dispatch({ type: 'WIDE_FORMAT_DETECTED', detection: result });
  }, []);

  // Open ColumnMapping in re-edit mode (mid-analysis factor management)
  const openFactorManager = useCallback(() => {
    dispatch({ type: 'OPEN_FACTOR_MANAGER' });
  }, []);

  // Column analysis for ColumnMapping rich cards
  const detectedColumnsResult = useMemo(() => {
    if (rawData.length === 0) return undefined;
    return detectColumns(rawData);
  }, [rawData]);

  const mappingColumnAnalysis = detectedColumnsResult?.columnAnalysis;
  const suggestedStack = detectedColumnsResult?.suggestedStack;

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
      if (detected.outcome) {
        setOutcome(detected.outcome);
      }
      if (detected.factors.length > 0) {
        setFactors(detected.factors);
      }

      const report = validateData(data, detected.outcome ? [detected.outcome] : []);
      setDataQualityReport(report);

      const yamazumiResult = detectYamazumiFormat(data, detected.columnAnalysis);
      if (yamazumiResult.isYamazumiFormat) {
        dispatch({ type: 'YAMAZUMI_DETECTED', detection: yamazumiResult });
      }

      // Check for defect format (only if not already detected as yamazumi)
      if (!yamazumiResult.isYamazumiFormat) {
        const defectResult = detectDefectFormat(data, detected.columnAnalysis);
        if (
          defectResult.isDefectFormat &&
          (defectResult.confidence === 'high' || defectResult.confidence === 'medium')
        ) {
          dispatch({ type: 'DEFECT_DETECTED', detection: defectResult });
        }
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
    },
    [setRawData, setDataFilename, setOutcome, setFactors, setDataQualityReport]
  );

  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      dispatch({ type: 'START_PASTE' }); // clears pasteError
      // Immediately re-clear — START_PASTE sets isPasteMode=true but we're already in paste mode
      // The purpose here is just to clear pasteError before attempting parse
      try {
        const data = await parseText(text);

        // Mode A.2: when there is an existing complete Hub, classify the paste and
        // surface the match-summary card instead of proceeding directly. The user
        // must confirm (or cancel) before the paste is committed.
        if (activeHub && isProcessHubComplete(activeHub)) {
          const hubColumns = activeHub.outcomes?.map(o => o.columnName) ?? [];
          const newColumns = data.length > 0 ? Object.keys(data[0]) : [];
          const detected = detectColumns(data);
          const classification = classifyPaste(
            {
              hubColumns,
              existingRows: rawData.slice(0, 1000),
              existingTimeColumn: undefined,
              existingRange: evidenceSnapshots?.at(-1)?.rowTimestampRange,
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
    [activeHub, evidenceSnapshots, rawData, _proceedWithParsedData]
  );

  /**
   * Accept a match-summary action choice.
   * Proceed-cases (append/backfill/replace/no-timestamp/overlap-replace/overlap-keep-both)
   * re-dispatch the pending rows through the existing column-mapping pipeline.
   * Cancel/separate-hub cases dismiss the card without committing data.
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
          // flow. For now, cancel the paste — the block-case discipline (user must decide)
          // is the critical behaviour; the new-Hub action is a future slice.
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
          // Re-enter paste mode momentarily so the pipeline dispatch lands cleanly,
          // then proceed through the column-mapping flow.
          dispatch({ type: 'START_PASTE' });
          _proceedWithParsedData(ms.newRows);
          return;
      }
    },
    [matchSummary, activeHub, rawData, setRowProvenance, _proceedWithParsedData]
  );

  const cancelMatchSummary = useCallback(() => setMatchSummary(undefined), []);

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

      const report = validateData(data, config.outcome ? [config.outcome] : []);
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
      // Apply stack transform if configured
      if (pendingStackConfig && pendingStackConfig.columnsToStack.length > 0) {
        const result = stackColumns(rawData, pendingStackConfig);
        setRawData(result.data);
      }

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
      setRawData,
      rawData,
      pendingStackConfig,
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

  const handleDefectDetected = useCallback((result: DefectDetection) => {
    dispatch({ type: 'DEFECT_DETECTED', detection: result });
  }, []);

  const handleDismissDefect = useCallback(() => {
    dispatch({ type: 'DISMISS_DEFECT' });
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
    suggestedStack,
    handleStackConfigChange: setPendingStackConfig,
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
    defectDetection: flowState.defectDetection,
    handleDefectDetected,
    handleDismissDefect,
    isMappingReEdit: flowState.isMappingReEdit,
    openFactorManager,
    matchSummary,
    acceptMatchSummary,
    cancelMatchSummary,
  };
}
