import React, { useReducer, useState, useCallback, useMemo } from 'react';
import {
  validateData,
  parseText,
  detectColumns,
  detectWideFormat,
  detectDefectFormat,
  stackColumns,
  parseTimeValue,
  type DataRow,
  type DataQualityReport,
  type WideFormatDetection,
  type TimeExtractionConfig,
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
import { generateDeterministicId } from '@variscout/core/identity';
import { stampStepCapabilities } from '@variscout/core/canvas';
import type { MatchSummaryActionChoice } from '@variscout/ui';
import { useCanvasStore, useProjectStore } from '@variscout/stores';
import { pwaHubRepository } from '../persistence';

// ── Reducer types ──────────────────────────────────────────────────────────

export interface PasteFlowState {
  isPasteMode: boolean;
  pasteError: string | null;
  isMapping: boolean;
  isMappingReEdit: boolean;
  isManualEntry: boolean;
  wideFormatDetection: WideFormatDetection | null;
  defectDetection: DefectDetection | null;
}

export type PasteFlowAction =
  | { type: 'START_PASTE' }
  | { type: 'PASTE_ERROR'; error: string }
  | { type: 'PASTE_ANALYZED' }
  | { type: 'PASTE_ANALYZED_WIDE'; detection: WideFormatDetection }
  | { type: 'PASTE_LANDED' }
  | { type: 'CANCEL_PASTE' }
  | { type: 'START_MANUAL_ENTRY' }
  | { type: 'CANCEL_MANUAL_ENTRY' }
  | { type: 'MANUAL_ENTRY_DONE' }
  | { type: 'OPEN_FACTOR_MANAGER' }
  | { type: 'CONFIRM_MAPPING' }
  | { type: 'CANCEL_MAPPING' }
  | { type: 'WIDE_FORMAT_DETECTED'; detection: WideFormatDetection }
  | { type: 'DISMISS_WIDE_FORMAT' }
  | { type: 'DEFECT_DETECTED'; detection: DefectDetection }
  | { type: 'DISMISS_DEFECT' };

export const initialPasteFlowState: PasteFlowState = {
  isPasteMode: false,
  pasteError: null,
  isMapping: false,
  isMappingReEdit: false,
  isManualEntry: false,
  wideFormatDetection: null,
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
    case 'PASTE_LANDED':
      // FSJ-2: measurement-shaped fresh paste — no vestibule, lands at b0.
      return { ...state, isPasteMode: false, isMapping: false, isMappingReEdit: false };
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
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: { target?: number; lsl?: number; usl?: number }) => void;
  setDataFilename: (filename: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  clearSelection: () => void;
  applyTimeExtraction: (col: string, config: TimeExtractionConfig) => void;
  /**
   * FSJ-2 (first-session spec §4.1): fired when a fresh measurement-shaped
   * paste lands without the mapping vestibule. App wires this to
   * landPasteOnProcess (ensure project + activate IP + route to Process tab).
   */
  onFreshPasteLanded?: () => void;
  /**
   * FSJ-2 (spec §3): fired when a fresh paste enters the mapping/wizard path
   * (defect/wide-shaped or low inference confidence). The Untitled-project
   * guarantee holds for EVERY fresh entry — App wires this to provision the
   * project WITHOUT routing (the wizard path keeps today's landing until P2).
   * Mutually exclusive with onFreshPasteLanded; neither fires on re-ingestion.
   */
  onFreshPasteAnalyzed?: () => void;
}

export interface MatchSummaryPending {
  classification: MatchSummaryClassification;
  newRows: DataRow[];
  newColumns: string[];
  newTimeColumn?: string;
  /** Id of the most-recent live snapshot at classification time — threads into
   *  replacedSnapshotId on overlap-replace dispatch to activate the P1 cascade (D2). */
  priorSnapshotId?: EvidenceSnapshot['id'];
}

export interface QuietTimeExtractionChip {
  timeColumn: string;
  newColumns: string[];
  dismissed: boolean;
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
  quietTimeExtraction: QuietTimeExtractionChip | null;
  dismissQuietTimeExtraction: () => void;
  undoQuietTimeExtraction: () => void;
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

function timeExtractionColumnsFor(timeColumn: string, config: TimeExtractionConfig): string[] {
  const columns: string[] = [];
  if (config.extractYear) columns.push(`${timeColumn}_Year`);
  if (config.extractMonth) columns.push(`${timeColumn}_Month`);
  if (config.extractWeek) columns.push(`${timeColumn}_Week`);
  if (config.extractDayOfWeek) columns.push(`${timeColumn}_DayOfWeek`);
  if (config.extractHour) columns.push(`${timeColumn}_Hour`);
  if (config.extractMinuteInterval)
    columns.push(`${timeColumn}_${config.extractMinuteInterval}min`);
  return columns;
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
 *
 * F3.5 D4: `evidenceSnapshots?` and `setRowProvenance?` props dropped.
 * - existingRange is now read from pwaHubRepository.evidenceSnapshots.listByHub()
 *   inside handlePasteAnalyze (Option A from audit S4).
 * - Snapshot + provenance persistence is routed through
 *   pwaHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... }).
 */
export function usePasteImportFlow(options: UsePasteImportFlowOptions): UsePasteImportFlowReturn {
  const {
    rawData,
    outcome,
    factors,
    columnAliases,
    activeHub,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    clearSelection,
    applyTimeExtraction,
    onFreshPasteLanded,
    onFreshPasteAnalyzed,
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
    extractYear: false,
    extractMonth: true,
    extractWeek: false,
    extractDayOfWeek: true,
    extractHour: false,
  });
  const [quietTimeExtraction, setQuietTimeExtraction] = useState<QuietTimeExtractionChip | null>(
    null
  );

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
    (data: DataRow[], opts?: { reingest?: boolean }) => {
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

      const defectResult = detectDefectFormat(data, detected.columnAnalysis);
      const defectFired =
        defectResult.isDefectFormat &&
        (defectResult.confidence === 'high' || defectResult.confidence === 'medium');
      const wideFormat = detectWideFormat(data);

      // FSJ-5 (first-session spec §4.2a): unit-of-analysis detections re-frame
      // b0; they do not bypass it with a modal or stay on the mapping path.
      // Kept on today's mapping path: low inference confidence (= no Y inferable,
      // detection.ts:189-205) and match-summary re-dispatch (re-ingestion is not
      // first-session, spec §7).
      const landsAtB0 =
        !opts?.reingest &&
        (detected.confidence !== 'low' || defectFired || wideFormat.isWideFormat);

      if (landsAtB0) {
        if (defectFired) {
          dispatch({ type: 'DEFECT_DETECTED', detection: defectResult });
        }
        if (wideFormat.isWideFormat) {
          dispatch({ type: 'WIDE_FORMAT_DETECTED', detection: wideFormat });
        }
        if (detected.timeColumn) {
          applyTimeExtraction(detected.timeColumn, timeExtractionConfig);
          setQuietTimeExtraction({
            timeColumn: detected.timeColumn,
            newColumns: timeExtractionColumnsFor(detected.timeColumn, timeExtractionConfig),
            dismissed: false,
          });
        } else {
          setQuietTimeExtraction(null);
        }
        setTimeExtractionPrompt(null);
        dispatch({ type: 'PASTE_LANDED' });
        onFreshPasteLanded?.();
        return;
      }

      if (defectFired) {
        dispatch({ type: 'DEFECT_DETECTED', detection: defectResult });
      }
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
      } else {
        setQuietTimeExtraction(null);
      }

      // FSJ-2 (spec §3): the Untitled-project guarantee holds on the wizard path
      // too. Fire ONLY for fresh entries — re-ingestion has its own hub and must
      // never provision (the no-Y floor's primary live trigger is cancelling out
      // of this auto-surfaced wizard, which needs a live IP to be reachable).
      // Provisions WITHOUT routing (App wires this to provisionPasteProject).
      if (!opts?.reingest) {
        onFreshPasteAnalyzed?.();
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setDataQualityReport,
      applyTimeExtraction,
      timeExtractionConfig,
      onFreshPasteLanded,
      onFreshPasteAnalyzed,
    ]
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

          // F3.5 D4 + audit S4 Option A: read existingRange from the repo directly.
          // The evidenceSnapshots prop has been dropped; the hook queries the
          // repository for the most-recent live snapshot's rowTimestampRange, which
          // seeds the classifier's overlap-detection branch.
          const liveSnapshots = await pwaHubRepository.evidenceSnapshots.listByHub(activeHub.id);
          const mostRecentSnapshot = liveSnapshots
            .slice()
            .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
          const existingRange = mostRecentSnapshot?.rowTimestampRange;

          const classification = classifyPaste(
            {
              hubColumns,
              existingRows: rawData.slice(0, 1000),
              existingTimeColumn: undefined,
              existingRange,
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
            priorSnapshotId: mostRecentSnapshot?.id,
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
    [activeHub, rawData, _proceedWithParsedData]
  );

  /**
   * Accept a match-summary action choice.
   * Proceed-cases (append/backfill/replace/no-timestamp/overlap-replace/overlap-keep-both)
   * re-dispatch the pending rows through the existing column-mapping pipeline.
   * Cancel/separate-hub cases dismiss the card without committing data.
   *
   * F3.5 D4: persistence routes through pwaHubRepository.dispatch(EVIDENCE_ADD_SNAPSHOT).
   * archiveReplacedRows is kept for in-memory sentinel-column mutation only
   * (the overlap-replace branch still annotates the in-memory row array with __replacedBy).
   * The persistence-side replacement cascade is handled by the action handler (P1).
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
          // P3.4 / F3.5: dispatch snapshot + provenance through the repository.
          // The handler writes snapshot + provenance atomically (D2) and populates
          // snapshotId on each provenance tag — closes the snapshotId = '' placeholder
          // gap from F1+F2 P1.3 (ADR-077 amendment).
          if (!activeHub) return;
          const hubCols = activeHub.outcomes?.map(o => o.columnName) ?? [];
          const sourceId = deriveSourceId(hubCols, ms.newColumns);
          const startIndex = rawData.length;
          const now = Date.now();
          const snapshotId = generateDeterministicId();

          const snapshot: EvidenceSnapshot = {
            id: snapshotId,
            hubId: activeHub.id,
            sourceId,
            capturedAt: new Date(now).toISOString(),
            rowCount: ms.newRows.length,
            origin: `paste:${sourceId}`,
            importedAt: now,
            createdAt: now,
            deletedAt: null,
          };

          const tags: RowProvenanceTag[] = ms.newRows.map((_, i) => ({
            id: generateDeterministicId(),
            createdAt: now,
            deletedAt: null,
            // snapshotId is populated by the handler at write time (closes F3.5 gap).
            // Passed here as empty string per the existing contract; the handler
            // overwrites it with action.snapshot.id inside the transaction.
            snapshotId: '',
            rowKey: String(startIndex + i),
            source: sourceId,
            joinKey: choice.candidate.hubColumn,
          }));

          const stamps = stampStepCapabilities({
            map: useCanvasStore.getState().canonicalMap,
            rows: ms.newRows,
            measureSpecs: useProjectStore.getState().measureSpecs,
          });
          const snapshotWithStamps: EvidenceSnapshot = { ...snapshot, stepCapabilities: stamps };

          void pwaHubRepository.dispatch({
            kind: 'EVIDENCE_ADD_SNAPSHOT',
            hubId: activeHub.id,
            snapshot: snapshotWithStamps,
            provenance: tags,
          });

          dispatch({ type: 'START_PASTE' });
          _proceedWithParsedData(ms.newRows, { reingest: true });
          return;
        }

        case 'overlap-replace': {
          // Archive existing rows that fall within the overlap range, then merge:
          // non-overlap existing rows ∪ archived overlap rows ∪ new rows.
          // archiveReplacedRows annotates in-memory rows with __replacedBy sentinel;
          // the persistence-side replacement cascade goes through the handler via
          // replacedSnapshotId (threaded from priorSnapshotId captured at classification time).
          const importId = generateDeterministicId();
          const overlapRange = ms.classification.overlapRange;
          const timeCol = ms.newTimeColumn;

          if (!activeHub) {
            dispatch({ type: 'START_PASTE' });
            _proceedWithParsedData(ms.newRows, { reingest: true });
            return;
          }

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

            const now = Date.now();
            const snapshotId = generateDeterministicId();
            const sourceId = activeHub.outcomes?.[0]?.columnName ?? 'paste';
            const snapshot: EvidenceSnapshot = {
              id: snapshotId,
              hubId: activeHub.id,
              sourceId,
              capturedAt: new Date(now).toISOString(),
              rowCount: ms.newRows.length,
              origin: `paste:overlap-replace`,
              importedAt: now,
              createdAt: now,
              deletedAt: null,
              ...(overlapRange ? { rowTimestampRange: overlapRange } : {}),
            };

            // replacedSnapshotId is threaded from the most-recent live snapshot read
            // at classification time (priorSnapshotId on the matchSummary state).
            // This activates the P1 handler's atomic-cascade path (D2): the handler
            // will soft-delete the prior snapshot in the same Dexie transaction.
            const stampsReplace = stampStepCapabilities({
              map: useCanvasStore.getState().canonicalMap,
              rows: merged,
              measureSpecs: useProjectStore.getState().measureSpecs,
            });
            const snapshotWithStampsReplace: EvidenceSnapshot = {
              ...snapshot,
              stepCapabilities: stampsReplace,
            };

            void pwaHubRepository.dispatch({
              kind: 'EVIDENCE_ADD_SNAPSHOT',
              hubId: activeHub.id,
              snapshot: snapshotWithStampsReplace,
              provenance: [],
              replacedSnapshotId: ms.priorSnapshotId,
            });

            dispatch({ type: 'START_PASTE' });
            _proceedWithParsedData(merged, { reingest: true });
          } else {
            // overlapRange absent when classifyPaste could not determine the overlap window
            // (no time column, or no prior snapshots) — fall back to replacing the full
            // dataset with the new rows.
            const now = Date.now();
            const snapshotId = generateDeterministicId();
            const sourceId = activeHub.outcomes?.[0]?.columnName ?? 'paste';
            const snapshot: EvidenceSnapshot = {
              id: snapshotId,
              hubId: activeHub.id,
              sourceId,
              capturedAt: new Date(now).toISOString(),
              rowCount: ms.newRows.length,
              origin: `paste:overlap-replace-fallback`,
              importedAt: now,
              createdAt: now,
              deletedAt: null,
            };

            const stampsFallback = stampStepCapabilities({
              map: useCanvasStore.getState().canonicalMap,
              rows: ms.newRows,
              measureSpecs: useProjectStore.getState().measureSpecs,
            });
            const snapshotWithStampsFallback: EvidenceSnapshot = {
              ...snapshot,
              stepCapabilities: stampsFallback,
            };

            void pwaHubRepository.dispatch({
              kind: 'EVIDENCE_ADD_SNAPSHOT',
              hubId: activeHub.id,
              snapshot: snapshotWithStampsFallback,
              provenance: [],
              replacedSnapshotId: ms.priorSnapshotId,
            });

            dispatch({ type: 'START_PASTE' });
            _proceedWithParsedData(ms.newRows, { reingest: true });
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
          _proceedWithParsedData(ms.newRows, { reingest: true });
          return;
      }
    },
    [matchSummary, activeHub, rawData, _proceedWithParsedData]
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
    // FSJ-2 (spec §4.1 guarded regression): cancel never wipes pasted data.
    // The engine-detected Y/X are already in the store (written before the
    // modal rendered), so closing the mapping leaves a working session.
    // Explicit data clearing is owned by the reset affordances, not cancel.
    dispatch({ type: 'CANCEL_MAPPING' });
  }, []);

  const handleDismissWideFormat = useCallback(() => {
    dispatch({ type: 'DISMISS_WIDE_FORMAT' });
  }, []);

  const handleDefectDetected = useCallback((result: DefectDetection) => {
    dispatch({ type: 'DEFECT_DETECTED', detection: result });
  }, []);

  const handleDismissDefect = useCallback(() => {
    dispatch({ type: 'DISMISS_DEFECT' });
  }, []);

  const dismissQuietTimeExtraction = useCallback(() => {
    setQuietTimeExtraction(current => (current == null ? null : { ...current, dismissed: true }));
  }, []);

  const undoQuietTimeExtraction = useCallback(() => {
    if (quietTimeExtraction == null) return;
    const removeColumns = new Set(quietTimeExtraction.newColumns);
    const nextRawData = rawData.map(row => {
      const nextRow: DataRow = { ...row };
      for (const column of removeColumns) {
        delete nextRow[column];
      }
      return nextRow;
    });
    const nextFactors = factors.filter(factor => !removeColumns.has(factor));

    setRawData(nextRawData);
    setFactors(nextFactors);
    const report = validateData(nextRawData, outcome ? [outcome] : []);
    setDataQualityReport(report);
    setQuietTimeExtraction(null);
  }, [
    factors,
    outcome,
    quietTimeExtraction,
    rawData,
    setDataQualityReport,
    setFactors,
    setRawData,
  ]);

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
    quietTimeExtraction,
    dismissQuietTimeExtraction,
    undoQuietTimeExtraction,
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
