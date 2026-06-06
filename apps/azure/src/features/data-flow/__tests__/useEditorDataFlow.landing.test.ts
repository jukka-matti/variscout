/**
 * FSJ-3b (first-session spec §4.1/§4.2a) — useEditorDataFlow landing-branch tests
 * (the Azure mirror of the PWA usePasteImportFlow.landing.test.ts).
 *
 * A fresh, measurement-shaped paste (an outcome IS inferable, not defect/wide-shaped)
 * skips the ColumnMapping vestibule and lands at b0 pre-filled. These tests exercise
 * the REAL core detection functions (NOT mocked) so the routing decision is driven by
 * the same inference the production hook uses. Each fixture's detection shape is asserted
 * inside the test (the precondition) so that a fixture which stops triggering its branch
 * fails loudly rather than silently passing.
 *
 * Azure gate divergence from PWA (decision 2): defect = ANY isDefectFormat (Azure's
 * modal has no high|medium confidence filter); wide = ANY isWideFormat.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ONLY the persistence singleton (the hook's async repo call) so it resolves
// cleanly. Detection stays REAL — the landing branch IS a detection-driven decision.
// vi.mock() MUST precede component imports (repo rule: prevents infinite loops).
vi.mock('../../../persistence', () => ({
  azureHubRepository: {
    dispatch: vi.fn().mockResolvedValue(undefined),
    evidenceSnapshots: {
      listByHub: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { renderHook, act } from '@testing-library/react';
import {
  parseText,
  detectColumns,
  detectWideFormat,
  detectDefectFormat,
  type ProcessHub,
} from '@variscout/core';
import { azureHubRepository } from '../../../persistence';
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Fixtures (row objects) ──────────────────────────────────────────────────
// Realistic ISO timestamps; the date PATTERN wins over the parseFloat-prefix
// numeric check, so the 'Timestamp' column classifies as the time column rather
// than becoming the inferred numeric outcome.
const measurementRows = Array.from({ length: 30 }, (_, i) => ({
  Cycle_Time_sec: 40 + ((i * 7) % 23) + (i % 3) * 0.5,
  Timestamp: `2026-05-${String((i % 27) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00:00`,
  Workstation: i % 2 === 0 ? 'Alpha' : 'Bravo',
}));

// Smallest wide fixture: 4 channel-pattern columns (V1..V4 match CHANNEL_PATTERNS).
const wideRows = Array.from({ length: 6 }, (_, i) => ({
  Batch: `B${i + 1}`,
  V1: 10 + (i % 5),
  V2: 11 + ((i * 2) % 5),
  V3: 9 + ((i * 3) % 5),
  V4: 12 + ((i * 4) % 5),
}));

// Defect event-log fixture (cribbed from core defect detection.test.ts).
const defectRows = [
  { Date: '2024-01-01', Defect_Type: 'Scratch', Line: 'A' },
  { Date: '2024-01-01', Defect_Type: 'Dent', Line: 'B' },
  { Date: '2024-01-02', Defect_Type: 'Scratch', Line: 'A' },
  { Date: '2024-01-02', Defect_Type: 'Crack', Line: 'B' },
];

// All-categorical fixture: no numeric outcome inferable → confidence 'low'.
const allCategoricalRows = Array.from({ length: 20 }, (_, i) => ({
  Region: i % 2 === 0 ? 'North' : 'South',
  Product: i % 2 === 0 ? 'A' : 'B',
}));

// ─── TSV serializer ──────────────────────────────────────────────────────────
function tsvOf(rows: Record<string, unknown>[]): string {
  const cols = Object.keys(rows[0]);
  const header = cols.join('\t');
  const body = rows.map(r => cols.map(c => String(r[c])).join('\t')).join('\n');
  return `${header}\n${body}`;
}

// ─── Default mock option builder ─────────────────────────────────────────────
function makeOptions(overrides: Partial<UseEditorDataFlowOptions> = {}): UseEditorDataFlowOptions {
  return {
    rawData: [],
    outcome: null,
    factors: [],
    specs: {},
    columnAliases: {},
    dataFilename: null,
    analysisMode: 'standard',
    measureColumns: null,
    measureLabel: null,
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setSpecs: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setColumnAliases: vi.fn(),
    setAnalysisMode: vi.fn(),
    setMeasureColumns: vi.fn(),
    setMeasureLabel: vi.fn(),
    loadProject: vi.fn().mockResolvedValue(undefined),
    handleFileUpload: vi.fn().mockResolvedValue(true),
    processFile: vi.fn().mockResolvedValue(true),
    loadSample: vi.fn(),
    applyTimeExtraction: vi.fn(),
    onFreshPasteLanded: vi.fn(),
    onFreshPasteAnalyzed: vi.fn(),
    ...overrides,
  };
}

// ─── Minimal stub for a complete Hub (cribbed from matchSummary test) ─────────
const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Test Hub',
  createdAt: 1746057600000,
  deletedAt: null,
  processGoal: 'Make cycle time consistent.',
  outcomes: [
    {
      id: 'outcome-ct',
      hubId: 'hub-1',
      createdAt: 1746057600000,
      deletedAt: null,
      columnName: 'Cycle_Time_sec',
      characteristicType: 'smallerIsBetter',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(azureHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(azureHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);
});

describe('useEditorDataFlow — FSJ-3b landing branch', () => {
  it('lands a measurement-shaped fresh paste at b0 (no mapping), pre-filling Y', async () => {
    // Precondition: measurement-shaped (outcome inferable, not low / wide / defect).
    const parsed = await parseText(tsvOf(measurementRows));
    const detected = detectColumns(parsed);
    expect(detected.confidence).not.toBe('low');
    expect(detected.outcome).toBe('Cycle_Time_sec');
    expect(detectWideFormat(parsed).isWideFormat).toBe(false);
    // Azure gate: ANY isDefectFormat keeps the wizard — assert this fixture is NOT defect.
    expect(detectDefectFormat(parsed, detected.columnAnalysis).isDefectFormat).toBe(false);

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const setOutcome = vi.fn();
    const applyTimeExtraction = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed, setOutcome, applyTimeExtraction })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    // Mutually exclusive: the measurement landing branch never fires the wizard-path callback.
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(false);
    expect(setOutcome).toHaveBeenCalledWith('Cycle_Time_sec');
    expect(applyTimeExtraction).toHaveBeenCalledWith('Timestamp', {
      extractYear: false,
      extractMonth: true,
      extractWeek: false,
      extractDayOfWeek: true,
      extractHour: false,
    });
    expect(result.current.quietTimeExtraction).toEqual({
      timeColumn: 'Timestamp',
      newColumns: ['Timestamp_Month', 'Timestamp_DayOfWeek'],
      dismissed: false,
    });
  });

  it('lands a wide-shaped fresh paste at b0 with a performance proposal, without auto-applying performance mode', async () => {
    // Precondition: wide-format detected (a CHANNEL_PATTERNS drift must fail loudly).
    const parsed = await parseText(tsvOf(wideRows));
    expect(detectWideFormat(parsed).isWideFormat).toBe(true);
    // Precondition: wide fixture must not accidentally trigger the low-confidence path
    // (otherwise the test would pass for the wrong reason — the wizard fires for BOTH
    // wide AND low-confidence, but this test is specifically about wide-format routing).
    expect(detectColumns(parsed).confidence).not.toBe('low');

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const setMeasureColumns = vi.fn();
    const setMeasureLabel = vi.fn();
    const setAnalysisMode = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({
          onFreshPasteLanded,
          onFreshPasteAnalyzed,
          setMeasureColumns,
          setMeasureLabel,
          setAnalysisMode,
        })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(wideRows));
    });

    expect(result.current.isMapping).toBe(false);
    expect(result.current.wideFormatDetection?.isWideFormat).toBe(true);
    expect(result.current.wideFormatDetection?.channels.map(c => c.id)).toEqual([
      'V1',
      'V2',
      'V3',
      'V4',
    ]);
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
    expect(setMeasureColumns).not.toHaveBeenCalled();
    expect(setMeasureLabel).not.toHaveBeenCalled();
    expect(setAnalysisMode).not.toHaveBeenCalledWith('performance');
  });

  it('lands a defect-shaped fresh paste at b0 with a defect proposal', async () => {
    // Precondition: defect format detected. FSJ-6 routes ANY isDefectFormat to b0
    // for the inline confirm sequence (no high|medium filter in Azure).
    const parsed = await parseText(tsvOf(defectRows));
    const defect = detectDefectFormat(parsed, detectColumns(parsed).columnAnalysis);
    expect(defect.isDefectFormat).toBe(true);

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(defectRows));
    });

    expect(result.current.isMapping).toBe(false);
    expect(result.current.defectDetection).not.toBeNull();
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
  });

  it('auto-surfaces the mapping for a low-confidence paste (spec §4.1 — never a silent empty landing) + provisions the Untitled project (FSJ-3b §3)', async () => {
    // Precondition: no outcome inferable → confidence 'low'.
    const parsed = await parseText(tsvOf(allCategoricalRows));
    expect(detectColumns(parsed).confidence).toBe('low');

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(allCategoricalRows));
    });

    expect(result.current.isMapping).toBe(true);
    // The no-Y floor's primary live trigger: even though no Y is inferable, the
    // Untitled project IS provisioned so the b0 no-Y banner is reachable (spec §3/§4.1).
    expect(onFreshPasteAnalyzed).toHaveBeenCalledTimes(1);
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
  });

  it('keeps the pipeline for a match-summary re-dispatch (re-ingestion is not first-session, spec §7) — provisions NEITHER project callback', async () => {
    // A complete active hub routes the paste through the match-summary classifier;
    // accepting a choice re-dispatches via the reingest flag → wizard path, never landing.
    // Re-ingestion has its own hub — the Untitled-project guarantee does NOT fire here:
    // neither onFreshPasteLanded NOR onFreshPasteAnalyzed (spec §3/§7).
    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({ activeHub: COMPLETE_HUB, onFreshPasteLanded, onFreshPasteAnalyzed })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    // The match-summary card is pending (paste was intercepted, not landed).
    expect(result.current.matchSummary).toBeDefined();
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    // Re-dispatch routed through the reingest flag → wizard path, but neither
    // provisioning callback fires (re-ingestion is not a fresh first-session entry).
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(true);
  });

  it('does not wipe pasted data on first-time mapping cancel (spec §4.1 guarded regression)', async () => {
    // Paste all-categorical data (enters the wizard), then cancel: no setter resets data.
    const setRawData = vi.fn();
    const setOutcome = vi.fn();
    const { result } = renderHook(() => useEditorDataFlow(makeOptions({ setRawData, setOutcome })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(allCategoricalRows));
    });
    expect(result.current.isMapping).toBe(true);

    // Cancel from the first-time (non-re-edit) mapping. The old wipe block called
    // setRawData([]) / setOutcome(null) — with it removed, no reset fires.
    act(() => {
      result.current.handleMappingCancel();
    });

    expect(result.current.isMapping).toBe(false);
    expect(setRawData).not.toHaveBeenCalledWith([]);
    expect(setOutcome).not.toHaveBeenCalledWith(null);
  });
});
