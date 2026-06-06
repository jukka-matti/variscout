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
  detectWideFormat,
  detectDefectFormat,
  type ProcessHub,
} from '@variscout/core';
import { pwaHubRepository } from '../../persistence';
import { usePasteImportFlow, type UsePasteImportFlowOptions } from '../usePasteImportFlow';

// ─── Fixtures (row objects) ──────────────────────────────────────────────────
// "Mon DD YYYY" date strings classify as `date` type (parseFloat fails, Date.parse
// succeeds) so Timestamp becomes the time column rather than a numeric outcome.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const measurementRows = Array.from({ length: 30 }, (_, i) => ({
  Cycle_Time_sec: 40 + ((i * 7) % 23) + (i % 3) * 0.5,
  Timestamp: `${MONTHS[i % 6]} ${String((i % 27) + 1)} 2026`,
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
    const setOutcome = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ onFreshPasteLanded, setOutcome }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
    expect(result.current.isMapping).toBe(false);
    expect(setOutcome).toHaveBeenCalledWith('Cycle_Time_sec');
  });

  it('auto-applies time extraction with defaults when a time column is present', async () => {
    // Precondition: a date-type time column is detected.
    const parsed = await parseText(tsvOf(measurementRows));
    expect(detectColumns(parsed).timeColumn).toBe('Timestamp');

    const applyTimeExtraction = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ applyTimeExtraction })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    expect(applyTimeExtraction).toHaveBeenCalledWith(
      'Timestamp',
      expect.objectContaining({ extractDayOfWeek: true })
    );
    // Quiet-tier interim: the prompt is suppressed (the landing branch nulls it).
    expect(result.current.timeExtractionPrompt).toBeNull();
  });

  it('keeps the wizard path for a wide-shaped paste (negative control)', async () => {
    // Precondition: wide-format detected.
    const parsed = await parseText(tsvOf(wideRows));
    expect(detectWideFormat(parsed).isWideFormat).toBe(true);

    const onFreshPasteLanded = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ onFreshPasteLanded })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(wideRows));
    });

    expect(result.current.isMapping).toBe(true);
    expect(result.current.wideFormatDetection).not.toBeNull();
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
  });

  it('keeps the wizard path for a defect-shaped paste (negative control)', async () => {
    // Precondition: defect format at high|medium confidence.
    const parsed = await parseText(tsvOf(defectRows));
    const defect = detectDefectFormat(parsed, detectColumns(parsed).columnAnalysis);
    expect(defect.isDefectFormat).toBe(true);
    expect(['high', 'medium']).toContain(defect.confidence);

    const onFreshPasteLanded = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ onFreshPasteLanded })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(defectRows));
    });

    expect(result.current.isMapping).toBe(true);
    expect(result.current.defectDetection).not.toBeNull();
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
  });

  it('auto-surfaces the mapping for a low-confidence paste (spec §4.1 — never a silent empty landing)', async () => {
    // Precondition: no outcome inferable → confidence 'low'.
    const parsed = await parseText(tsvOf(allCategoricalRows));
    expect(detectColumns(parsed).confidence).toBe('low');

    const onFreshPasteLanded = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ onFreshPasteLanded })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(allCategoricalRows));
    });

    expect(result.current.isMapping).toBe(true);
    expect(onFreshPasteLanded).not.toHaveBeenCalled();
  });

  it('keeps the pipeline for a match-summary re-dispatch (re-ingestion is not first-session, spec §7)', async () => {
    // A complete active hub routes the paste through the match-summary classifier;
    // accepting a choice re-dispatches via the reingest flag → wizard path, never landing.
    const onFreshPasteLanded = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, onFreshPasteLanded }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(measurementRows));
    });

    // The match-summary card is pending (paste was intercepted, not landed).
    expect(result.current.matchSummary).toBeDefined();
    expect(onFreshPasteLanded).not.toHaveBeenCalled();

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    expect(onFreshPasteLanded).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(true);
  });

  it('does not wipe pasted data on first-time mapping cancel (spec §4.1 guarded regression)', async () => {
    // Paste wide-shaped data (enters the wizard), then cancel: no setter resets data.
    const setRawData = vi.fn();
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ setRawData })));

    await act(async () => {
      await result.current.handlePasteAnalyze(tsvOf(wideRows));
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
});
