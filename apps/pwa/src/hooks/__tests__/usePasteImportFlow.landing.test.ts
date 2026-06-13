/**
 * FSJ-2 (first-session spec §4.1/§4.2a) — usePasteImportFlow landing-branch tests.
 *
 * A fresh, measurement-shaped paste (an outcome IS inferable, not defect/wide-shaped)
 * skips the ColumnMapping vestibule and lands at b0 pre-filled. These tests exercise
 * the REAL core detection functions (NOT mocked) so the routing decision is driven by
 * the same inference the production hook uses. Each fixture's detection shape is asserted
 * inside the test (the precondition) so that a fixture which stops triggering its branch
 * fails loudly rather than silently passing.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock ONLY the persistence singleton (the hook's async repo call) so it resolves
// cleanly. Detection stays REAL — the landing branch IS a detection-driven decision.
// vi.mock() MUST precede component imports (repo rule: prevents infinite loops).
vi.mock('../../persistence', () => ({
  pwaHubRepository: {
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
  rankYCandidates,
  detectWideFormat,
  detectDefectFormat,
  augmentWithTimeColumns,
  type ProcessHub,
  type DataRow,
  type TimeExtractionConfig,
} from '@variscout/core';
import { pwaHubRepository } from '../../persistence';
import { usePasteImportFlow, type UsePasteImportFlowOptions } from '../usePasteImportFlow';

// ─── Fixtures (row objects) ──────────────────────────────────────────────────
// Realistic ISO timestamps. Post FSJ-2-walk Fix 1, date PATTERNS win over the
// parseFloat-prefix numeric check, so an ISO 'Timestamp' column classifies as
// `date` (the time column) rather than becoming the inferred numeric outcome.
// (Before Fix 1 this fixture had to use 'Mon DD YYYY' strings to dodge the bug.)
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

const idLikeNumericRows = Array.from({ length: 12 }, (_, i) => ({
  Date: `2026-06-${String(i + 1).padStart(2, '0')}`,
  Line: i % 2 === 0 ? 'A' : 'B',
  Shift: i % 2 === 0 ? 'Day' : 'Night',
  batch_id: 1000 + i,
}));

// ─── TSV serializer ──────────────────────────────────────────────────────────
function tsvOf(rows: Record<string, unknown>[]): string {
  const cols = Object.keys(rows[0]);
  const header = cols.join('\t');
  const body = rows.map(r => cols.map(c => String(r[c])).join('\t')).join('\n');
  return `${header}\n${body}`;
}

// ─── Default mock option builder ─────────────────────────────────────────────
function makeOptions(
  overrides: Partial<UsePasteImportFlowOptions> = {}
): UsePasteImportFlowOptions {
  return {
    rawData: [],
    outcome: null,
    factors: [],
    columnAliases: {},
    dataFilename: null,
    dataQualityReport: null,
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setSpecs: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setColumnAliases: vi.fn(),
    clearSelection: vi.fn(),
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
  vi.mocked(pwaHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);
});

describe('usePasteImportFlow — FSJ-2 landing branch', () => {
  it('lands a measurement-shaped fresh paste at b0 (no mapping), pre-filling Y', async () => {
    // Precondition: measurement-shaped (outcome inferable, not low / wide / defect).
    const parsed = await parseText(tsvOf(measurementRows));
    const detected = detectColumns(parsed);
    expect(detected.confidence).not.toBe('low');
    expect(detected.outcome).toBe('Cycle_Time_sec');
    expect(detectWideFormat(parsed).isWideFormat).toBe(false);
    const defect = detectDefectFormat(parsed, detected.columnAnalysis);
    expect(
      defect.isDefectFormat && (defect.confidence === 'high' || defect.confidence === 'medium')
    ).toBe(false);

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const setOutcome = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed, setOutcome }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    // Mutually exclusive: the measurement landing branch never fires the wizard-path callback.
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(false);
    expect(setOutcome).toHaveBeenCalledWith('Cycle_Time_sec');
  });

  it('does not pre-fill an ID-like detected outcome on fresh paste', async () => {
    const parsed = await parseText(tsvOf(idLikeNumericRows));
    const detected = detectColumns(parsed);
    expect(detected.outcome).toBe('batch_id');
    expect(rankYCandidates(detected.columnAnalysis).map(({ column }) => column.name)).not.toContain(
      'batch_id'
    );

    const setOutcome = vi.fn();
    const onFreshPasteLanded = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ setOutcome, onFreshPasteLanded }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(idLikeNumericRows));
    });

    expect(result.current.isMapping).toBe(false);
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(setOutcome).not.toHaveBeenCalledWith('batch_id');
  });

  it('auto-applies quiet time extraction without Year and exposes the undoable chip', async () => {
    // Precondition: a date-type time column is detected.
    const parsed = await parseText(tsvOf(measurementRows));
    expect(detectColumns(parsed).timeColumn).toBe('Timestamp');

    // NOTE: this asserts the CALL, not the EFFECT. A spy can pass while the real
    // extraction no-ops (FSJ-2 walk Fix 3: App.tsx's getters closed over stale
    // render-scope values → applyTimeExtraction early-returned on an empty array).
    // The load-bearing effect coverage lives in
    // apps/pwa/src/__tests__/timeExtraction.integration.test.ts (live-store getter
    // applies extraction; stale-closure negative control no-ops). The e2e/chrome
    // walk also exercises the wired App path end-to-end.
    const applyTimeExtraction = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ applyTimeExtraction })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(applyTimeExtraction).toHaveBeenCalledWith(
      'Timestamp',
      expect.objectContaining({ extractMonth: true, extractDayOfWeek: true, extractYear: false })
    );
    expect(result.current.timeExtractionPrompt).toBeNull();
    expect(result.current.quietTimeExtraction).toEqual({
      timeColumn: 'Timestamp',
      newColumns: ['Timestamp_Month', 'Timestamp_DayOfWeek'],
      dismissed: false,
    });

    act(() => {
      result.current.dismissQuietTimeExtraction();
    });
    expect(result.current.quietTimeExtraction).toEqual({
      timeColumn: 'Timestamp',
      newColumns: ['Timestamp_Month', 'Timestamp_DayOfWeek'],
      dismissed: true,
    });
  });

  it('undoes quiet time extraction by removing derived date columns and factors', async () => {
    function useStatefulFlow() {
      const [data, setData] = React.useState<DataRow[]>([]);
      const [outcome, setOutcome] = React.useState<string | null>(null);
      const [factors, setFactors] = React.useState<string[]>([]);
      const dataRef = React.useRef<DataRow[]>(data);
      const factorsRef = React.useRef<string[]>(factors);
      dataRef.current = data;
      factorsRef.current = factors;

      const setRawData = React.useCallback((next: DataRow[]) => {
        dataRef.current = next;
        setData(next);
      }, []);

      const applyTimeExtraction = React.useCallback((col: string, config: TimeExtractionConfig) => {
        const { newColumns } = augmentWithTimeColumns(dataRef.current, col, config);
        setFactors([...factorsRef.current, ...newColumns]);
      }, []);

      const flow = usePasteImportFlow(
        makeOptions({
          rawData: data,
          outcome,
          factors,
          setRawData,
          setOutcome,
          setFactors,
          applyTimeExtraction,
        })
      );

      return { flow, data, factors };
    }

    const { result } = renderHook(() => useStatefulFlow());

    await act(async () => {
      await result.current.flow.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(Object.keys(result.current.data[0])).toContain('Timestamp_Month');
    expect(Object.keys(result.current.data[0])).toContain('Timestamp_DayOfWeek');
    expect(Object.keys(result.current.data[0])).not.toContain('Timestamp_Year');
    expect(result.current.factors).toEqual(
      expect.arrayContaining(['Timestamp_Month', 'Timestamp_DayOfWeek'])
    );

    act(() => {
      result.current.flow.undoQuietTimeExtraction();
    });

    expect(Object.keys(result.current.data[0])).not.toContain('Timestamp_Month');
    expect(Object.keys(result.current.data[0])).not.toContain('Timestamp_DayOfWeek');
    expect(result.current.factors).not.toContain('Timestamp_Month');
    expect(result.current.factors).not.toContain('Timestamp_DayOfWeek');
    expect(result.current.flow.quietTimeExtraction).toBeNull();
  });

  it('lands a wide-shaped fresh paste at b0 with the performance proposal intact', async () => {
    // Precondition: wide-format detected.
    const parsed = await parseText(tsvOf(wideRows));
    expect(detectWideFormat(parsed).isWideFormat).toBe(true);

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(wideRows));
    });

    expect(result.current.isMapping).toBe(false);
    expect(result.current.wideFormatDetection).not.toBeNull();
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
  });

  it('lands a defect-shaped fresh paste at b0 — high confidence auto-applies, medium opens modal', async () => {
    // Precondition: defect format at high|medium confidence.
    const parsed = await parseText(tsvOf(defectRows));
    const defect = detectDefectFormat(parsed, detectColumns(parsed).columnAnalysis);
    expect(defect.isDefectFormat).toBe(true);
    expect(['high', 'medium']).toContain(defect.confidence);

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const onHighConfidenceDefect = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(
        makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed, onHighConfidenceDefect })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(defectRows));
    });

    expect(result.current.isMapping).toBe(false);
    if (defect.confidence === 'high') {
      // ER-5b: auto-apply — callback fires, defectDetection stays null (no modal).
      expect(onHighConfidenceDefect).toHaveBeenCalledTimes(1);
      expect(result.current.defectDetection).toBeNull();
    } else {
      // Medium: modal-confirm path — defectDetection is set (modal shown).
      expect(onHighConfidenceDefect).not.toHaveBeenCalled();
      expect(result.current.defectDetection).not.toBeNull();
    }
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
  });

  it('lands a low-confidence fresh paste at b0 so the no-Y floor owns recovery', async () => {
    // Precondition: no outcome inferable → confidence 'low'.
    const parsed = await parseText(tsvOf(allCategoricalRows));
    expect(detectColumns(parsed).confidence).toBe('low');

    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ onFreshPasteLanded, onFreshPasteAnalyzed }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(allCategoricalRows));
    });

    expect(result.current.isMapping).toBe(false);
    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(onFreshPasteAnalyzed).not.toHaveBeenCalled();
  });

  it('keeps the pipeline for a match-summary re-dispatch (re-ingestion is not first-session, spec §7) — provisions NEITHER project callback', async () => {
    // A complete active hub routes the paste through the match-summary classifier;
    // accepting a choice re-dispatches via the reingest flag → wizard path, never landing.
    // Re-ingestion has its own hub — the Untitled-project guarantee does NOT fire here:
    // neither onFreshPasteLanded NOR onFreshPasteAnalyzed (spec §3/§7).
    const onFreshPasteLanded = vi.fn();
    const onFreshPasteAnalyzed = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(
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
    // Paste low-confidence data lands at b0; the permanent "Fix data..." hatch
    // opens the wizard, and cancel still cannot reset data.
    const setRawData = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ setRawData })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(allCategoricalRows));
    });
    expect(result.current.isMapping).toBe(false);

    act(() => {
      result.current.openFactorManager();
    });
    expect(result.current.isMapping).toBe(true);

    act(() => {
      result.current.handleMappingCancel();
    });

    expect(result.current.isMapping).toBe(false);
    // The old wipe routed through the injected clearData; with it removed, no setter
    // should reset the data array.
    expect(setRawData).not.toHaveBeenCalledWith([]);
  });

  it('mapping confirm no longer interactively rewrites active Y/X', () => {
    const setOutcome = vi.fn();
    const setFactors = vi.fn();
    const setSpecs = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ setOutcome, setFactors, setSpecs }))
    );

    act(() => {
      result.current.openFactorManager();
    });
    expect(result.current.isMapping).toBe(true);

    act(() => {
      result.current.handleMappingConfirm('Wrong_Y', ['Wrong_X'], { target: 12 });
    });

    expect(result.current.isMapping).toBe(false);
    expect(setOutcome).not.toHaveBeenCalled();
    expect(setFactors).not.toHaveBeenCalled();
    expect(setSpecs).toHaveBeenCalledWith({ target: 12 });
  });
});
