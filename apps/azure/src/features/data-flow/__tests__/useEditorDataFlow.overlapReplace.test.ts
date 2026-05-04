/**
 * overlap-replace provenance tests (Azure) — Issue 1 fix.
 *
 * Verifies that accepting overlap-replace archives existing overlap rows with
 * the __replacedBy tag and merges them into the dataset passed to setRawData,
 * satisfying spec §16 AC "replaced-rows archived with replaced-by tag".
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
    // parseTimeValue is kept from the real implementation so timestamp filtering works.
  };
});

vi.mock('@variscout/core/matchSummary', async importOriginal => {
  const real = await importOriginal<typeof import('@variscout/core/matchSummary')>();
  return { ...real, classifyPaste: vi.fn() };
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
import { classifyPaste } from '@variscout/core/matchSummary';
import type { ProcessHub } from '@variscout/core';
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel Hub',
  createdAt: '2026-05-01T00:00:00Z',
  processGoal: 'Reduce barrel diameter variation.',
  outcomes: [{ columnName: 'diameter_mm', characteristicType: 'nominalIsBest' }],
};

// Existing data: rows on May 1–4 (the middle two will fall in the overlap range).
const EXISTING_ROWS = [
  { ts: '2026-05-01', diameter_mm: 25.0 }, // before overlap
  { ts: '2026-05-02', diameter_mm: 25.1 }, // inside overlap
  { ts: '2026-05-03', diameter_mm: 25.2 }, // inside overlap
  { ts: '2026-05-04', diameter_mm: 25.3 }, // after overlap
];

// New rows replacing the overlap period (May 2–3) with corrected values.
const NEW_ROWS = [
  { ts: '2026-05-02', diameter_mm: 30.0 },
  { ts: '2026-05-03', diameter_mm: 30.1 },
];

const OVERLAP_CLASSIFICATION = {
  source: 'same-source' as const,
  temporal: 'overlap' as const,
  blockReasons: ['overlap' as const],
  overlapRange: {
    startISO: '2026-05-02T00:00:00.000Z',
    endISO: '2026-05-03T23:59:59.999Z',
  },
};

function makeOptions(overrides: Partial<UseEditorDataFlowOptions> = {}): UseEditorDataFlowOptions {
  return {
    rawData: EXISTING_ROWS,
    outcome: 'diameter_mm',
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

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'diameter_mm',
    factors: [],
    timeColumn: 'ts',
    columnAnalysis: [
      { name: 'ts', sampleValues: ['2026-05-02', '2026-05-03'], type: 'date' },
      { name: 'diameter_mm', sampleValues: ['30.0', '30.1'], type: 'numeric' },
    ],
    suggestedStack: undefined,
  } as unknown as ReturnType<typeof detectColumns>);

  vi.mocked(validateData).mockReturnValue({
    excludedRows: [],
    warnings: [],
  } as unknown as ReturnType<typeof validateData>);
  vi.mocked(detectWideFormat).mockReturnValue({
    isWideFormat: false,
  } as unknown as ReturnType<typeof detectWideFormat>);
  vi.mocked(detectYamazumiFormat).mockReturnValue({
    isYamazumiFormat: false,
  } as unknown as ReturnType<typeof detectYamazumiFormat>);
  vi.mocked(detectDefectFormat).mockReturnValue({
    isDefectFormat: false,
  } as unknown as ReturnType<typeof detectDefectFormat>);
  vi.mocked(parseText).mockResolvedValue(
    NEW_ROWS as unknown as Awaited<ReturnType<typeof parseText>>
  );
  vi.mocked(classifyPaste).mockReturnValue(OVERLAP_CLASSIFICATION);
});

const CSV_TEXT = 'ts,diameter_mm\n2026-05-02,30.0\n2026-05-03,30.1';

describe('useEditorDataFlow — overlap-replace provenance (Issue 1)', () => {
  it('archives existing overlap rows with __replacedBy tag and merges into dataset', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    // Trigger paste → match-summary card with overlap classification
    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeDefined();
    expect(result.current.matchSummary?.classification.temporal).toBe('overlap');

    // Accept overlap-replace
    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    expect(result.current.matchSummary).toBeUndefined();
    expect(setRawData).toHaveBeenCalledTimes(1);

    const mergedData = setRawData.mock.calls[0][0] as Array<Record<string, unknown>>;

    // Non-overlap rows (May 1 and May 4) should be present without __replacedBy.
    const nonOverlapRows = mergedData.filter(r => !r['__replacedBy']);
    const nonOverlapDates = nonOverlapRows.map(r => r['ts']).sort();
    expect(nonOverlapDates).toContain('2026-05-01');
    expect(nonOverlapDates).toContain('2026-05-04');

    // New rows (May 2–3 replacements) should also be present without __replacedBy.
    const newRows = mergedData.filter(
      r => !r['__replacedBy'] && (r['diameter_mm'] as number) >= 30
    );
    expect(newRows).toHaveLength(2);
    expect(newRows.map(r => r['ts']).sort()).toEqual(['2026-05-02', '2026-05-03']);

    // Archived rows (original May 2–3) must have __replacedBy set to the import ID.
    const archivedRows = mergedData.filter(r => r['__replacedBy']);
    expect(archivedRows).toHaveLength(2);
    expect(archivedRows.map(r => r['ts']).sort()).toEqual(['2026-05-02', '2026-05-03']);
    // All archived rows share the same non-empty import ID.
    const importId = archivedRows[0]['__replacedBy'];
    expect(typeof importId).toBe('string');
    expect(String(importId).length).toBeGreaterThan(0);
    expect(archivedRows[1]['__replacedBy']).toBe(importId);

    // Total row count: 2 non-overlap + 2 archived + 2 new = 6.
    expect(mergedData).toHaveLength(6);
  });

  it('falls back to new-rows-only when overlapRange is absent', async () => {
    const setRawData = vi.fn();
    // Classification with no overlapRange (e.g. existingRange not yet wired)
    vi.mocked(classifyPaste).mockReturnValue({
      source: 'same-source' as const,
      temporal: 'overlap' as const,
      blockReasons: ['overlap' as const],
      // overlapRange intentionally absent
    });

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    expect(setRawData).toHaveBeenCalledTimes(1);
    // Falls back: setRawData receives the new rows only (no merge / archival).
    const calledWith = setRawData.mock.calls[0][0] as unknown[];
    expect(calledWith).toHaveLength(NEW_ROWS.length);
  });
});

// ─── existingRange call-site wiring tests ─────────────────────────────────────
// These cases test the `evidenceSnapshots` hook option (not `ProcessHub.evidenceSnapshots`,
// which does not exist). The caller (Editor.tsx) loads snapshots from IndexedDB separately
// and passes them via this option. ProcessHub stays a pure data-only type.

describe('useEditorDataFlow — existingRange wiring (ADR-077 follow-up)', () => {
  const TIME_RANGE = { startISO: '2026-05-01T00:00:00.000Z', endISO: '2026-05-04T23:59:59.999Z' };

  // Minimal non-blocking classification so handlePasteAnalyze proceeds to setMatchSummary.
  const PASSTHROUGH_CLASSIFICATION = {
    source: 'same-source' as const,
    temporal: 'append' as const,
    blockReasons: [] as never[],
  };

  beforeEach(() => {
    vi.mocked(classifyPaste).mockReturnValue(PASSTHROUGH_CLASSIFICATION);
  });

  it('Case A: forwards existingRange when evidenceSnapshots option has a snapshot with rowTimestampRange', async () => {
    const evidenceSnapshots = [
      {
        id: 'snap-1',
        hubId: 'hub-1',
        sourceId: 'src-1',
        capturedAt: '2026-05-01T00:00:00Z',
        importedAt: '2026-05-01T00:00:00Z',
        origin: 'paste-abc',
        rowCount: 4,
        rowTimestampRange: TIME_RANGE,
      },
    ];

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, evidenceSnapshots }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toEqual(TIME_RANGE);
  });

  it('Case B: forwards existingRange as undefined when evidenceSnapshots option is empty', async () => {
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, evidenceSnapshots: [] }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toBeUndefined();
  });

  it('Case C: forwards existingRange as undefined when latest snapshot has no rowTimestampRange', async () => {
    const evidenceSnapshots = [
      {
        id: 'snap-1',
        hubId: 'hub-1',
        sourceId: 'src-1',
        capturedAt: '2026-05-01T00:00:00Z',
        importedAt: '2026-05-01T00:00:00Z',
        origin: 'paste-abc',
        rowCount: 4,
        // rowTimestampRange intentionally absent
      },
    ];

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB, evidenceSnapshots }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toBeUndefined();
  });

  it('Case D: does not call classifyPaste when no Hub is active and no prior data', async () => {
    // rawData: [] ensures the Mode-B window.confirm path is not taken, so the
    // assertion holds for the right reason: classifyPaste is unreachable because
    // activeHub is undefined, not because window.confirm returned falsy.
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: undefined, rawData: [] }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    // No complete Hub → Mode A.2 branch is skipped entirely.
    expect(classifyPaste).not.toHaveBeenCalled();
  });
});
