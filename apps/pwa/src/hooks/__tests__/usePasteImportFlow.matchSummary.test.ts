/**
 * P2.3 — usePasteImportFlow match-summary wedge tests.
 *
 * Verifies that Mode A.2-paste (existing complete Hub) routes to MatchSummaryCard
 * state and that Mode B (no hub) continues unchanged through the existing pipeline.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.mock BEFORE any imports that transitively load the mocked module.
vi.mock('@variscout/core', async importOriginal => {
  const real = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...real,
    parseText: vi.fn(),
    detectColumns: vi.fn(),
    validateData: vi.fn(),
    detectWideFormat: vi.fn(),
    detectYamazumiFormat: vi.fn(),
    detectDefectFormat: vi.fn(),
  };
});

import { renderHook, act } from '@testing-library/react';
import {
  parseText,
  detectColumns,
  validateData,
  detectWideFormat,
  detectYamazumiFormat,
  detectDefectFormat,
} from '@variscout/core';
import type { ProcessHub } from '@variscout/core';
import { usePasteImportFlow, type UsePasteImportFlowOptions } from '../usePasteImportFlow';

// ─── Minimal stub for a complete Hub ──────────────────────────────────────────
const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Test Hub',
  createdAt: '2026-05-01T00:00:00Z',
  processGoal: 'Make weights right.',
  outcomes: [{ columnName: 'weight_g', characteristicType: 'nominalIsBest' }],
};

// ─── Default mock option builders ─────────────────────────────────────────────
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
    clearData: vi.fn(),
    clearSelection: vi.fn(),
    applyTimeExtraction: vi.fn(),
    ...overrides,
  };
}

// ─── Shared parsed data ────────────────────────────────────────────────────────
const PARSED_ROWS = [
  { ts: '2026-05-01', weight_g: 100 },
  { ts: '2026-05-02', weight_g: 101 },
];

beforeEach(() => {
  vi.clearAllMocks();

  // Default detectColumns stub — returns minimal shape
  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'weight_g',
    factors: [],
    timeColumn: 'ts',
    columnAnalysis: [
      { name: 'ts', sampleValues: ['2026-05-01', '2026-05-02'], type: 'date' },
      { name: 'weight_g', sampleValues: ['100', '101'], type: 'numeric' },
    ],
    suggestedStack: undefined,
  } as unknown as ReturnType<typeof detectColumns>);

  vi.mocked(validateData).mockReturnValue({
    excludedRows: [],
    warnings: [],
  } as unknown as ReturnType<typeof validateData>);
  vi.mocked(detectWideFormat).mockReturnValue({ isWideFormat: false } as unknown as ReturnType<
    typeof detectWideFormat
  >);
  vi.mocked(detectYamazumiFormat).mockReturnValue({
    isYamazumiFormat: false,
  } as unknown as ReturnType<typeof detectYamazumiFormat>);
  vi.mocked(detectDefectFormat).mockReturnValue({ isDefectFormat: false } as unknown as ReturnType<
    typeof detectDefectFormat
  >);
  vi.mocked(parseText).mockResolvedValue(
    PARSED_ROWS as unknown as Awaited<ReturnType<typeof parseText>>
  );
});

const CSV_TEXT = 'ts,weight_g\n2026-05-01,100\n2026-05-02,101';

describe('usePasteImportFlow — match-summary wedge (P2.3)', () => {
  it('opens matchSummary when paste detected on existing complete Hub (Mode A.2)', async () => {
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeDefined();
    expect(result.current.matchSummary?.classification).toBeDefined();
    expect(result.current.matchSummary?.newRows).toEqual(PARSED_ROWS);
    // paste mode is cancelled — match-summary card takes over
    expect(result.current.isPasteMode).toBe(false);
    expect(result.current.isMapping).toBe(false);
  });

  it('skips matchSummary when no active hub (Mode B — new paste flow)', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: undefined, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeUndefined();
    // Proceeds to ColumnMapping
    expect(result.current.isMapping).toBe(true);
    expect(setRawData).toHaveBeenCalledWith(PARSED_ROWS);
  });

  it('skips matchSummary when hub is incomplete (no processGoal)', async () => {
    const incompleteHub: ProcessHub = {
      id: 'hub-2',
      name: 'Incomplete',
      createdAt: '2026-05-01T00:00:00Z',
      outcomes: [{ columnName: 'weight_g', characteristicType: 'nominalIsBest' }],
      // no processGoal → isProcessHubComplete returns false
    };
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: incompleteHub, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(result.current.isMapping).toBe(true);
    expect(setRawData).toHaveBeenCalledWith(PARSED_ROWS);
  });

  it('acceptMatchSummary with proceed choice dispatches data and enters mapping', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeDefined();

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(setRawData).toHaveBeenCalledWith(PARSED_ROWS);
    expect(result.current.isMapping).toBe(true);
  });

  it('acceptMatchSummary with cancel choice clears matchSummary without committing data', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-cancel' });
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(setRawData).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(false);
  });

  it('cancelMatchSummary clears pending without committing data', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    act(() => {
      result.current.cancelMatchSummary();
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(setRawData).not.toHaveBeenCalled();
  });
});
