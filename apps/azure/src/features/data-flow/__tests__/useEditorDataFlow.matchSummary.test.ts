/**
 * P2.4 — useEditorDataFlow match-summary wedge tests (D9).
 *
 * Verifies that Mode A.2-paste (existing complete Hub) routes to MatchSummaryCard
 * state and that Mode B (no hub) continues with the legacy window.confirm path.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.mock BEFORE any imports that transitively load the mocked module.
vi.mock('../../../persistence', () => ({
  azureHubRepository: {
    dispatch: vi.fn(),
    evidenceSnapshots: {
      listByHub: vi.fn().mockResolvedValue([]),
    },
  },
}));

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
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Minimal stub for a complete Hub ──────────────────────────────────────────
const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Test Hub',
  createdAt: 1746057600000,
  deletedAt: null,
  processGoal: 'Reduce barrel diameter variation.',
  outcomes: [
    {
      id: 'outcome-diameter',
      hubId: 'hub-1',
      createdAt: 1746057600000,
      deletedAt: null,
      columnName: 'diameter_mm',
      characteristicType: 'nominalIsBest',
    },
  ],
};

// ─── Default mock option builders ─────────────────────────────────────────────
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
    ...overrides,
  };
}

// ─── Shared parsed data ────────────────────────────────────────────────────────
const PARSED_ROWS = [
  { ts: '2026-05-01', diameter_mm: 25.0 },
  { ts: '2026-05-02', diameter_mm: 25.1 },
];

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'diameter_mm',
    factors: [],
    timeColumn: 'ts',
    columnAnalysis: [
      { name: 'ts', sampleValues: ['2026-05-01', '2026-05-02'], type: 'date' },
      { name: 'diameter_mm', sampleValues: ['25.0', '25.1'], type: 'numeric' },
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

const CSV_TEXT = 'ts,diameter_mm\n2026-05-01,25.0\n2026-05-02,25.1';

describe('useEditorDataFlow — match-summary wedge (P2.4 / D9)', () => {
  it('opens matchSummary when paste detected on existing complete Hub (Mode A.2)', async () => {
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeDefined();
    expect(result.current.matchSummary?.classification).toBeDefined();
    expect(result.current.matchSummary?.newRows).toEqual(PARSED_ROWS);
    // Paste mode cancelled — match-summary card takes over
    expect(result.current.isPasteMode).toBe(false);
    expect(result.current.isMapping).toBe(false);
  });

  it('skips matchSummary when no active hub (Mode B)', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: undefined, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(result.current.isMapping).toBe(true);
    expect(setRawData).toHaveBeenCalledWith(PARSED_ROWS);
  });

  it('skips matchSummary when hub is incomplete (no processGoal)', async () => {
    const incompleteHub: ProcessHub = {
      id: 'hub-2',
      name: 'Incomplete',
      createdAt: 1746057600000,
      deletedAt: null,
      outcomes: [
        {
          id: 'outcome-diameter-2',
          hubId: 'hub-2',
          createdAt: 1746057600000,
          deletedAt: null,
          columnName: 'diameter_mm',
          characteristicType: 'nominalIsBest',
        },
      ],
      // no processGoal → isProcessHubComplete returns false
    };
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: incompleteHub, setRawData }))
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
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
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

  it('acceptMatchSummary with block choice cancels without committing data', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'different-grain-cancel' });
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(setRawData).not.toHaveBeenCalled();
    expect(result.current.isMapping).toBe(false);
  });

  it('cancelMatchSummary clears pending without committing data', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
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
