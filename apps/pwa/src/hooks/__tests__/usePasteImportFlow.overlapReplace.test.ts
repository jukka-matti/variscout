/**
 * overlap-replace provenance tests (PWA) — Issue 1 fix.
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
import { usePasteImportFlow, type UsePasteImportFlowOptions } from '../usePasteImportFlow';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Fill-Weight Hub',
  createdAt: '2026-05-01T00:00:00Z',
  processGoal: 'Reduce fill-weight variation.',
  outcomes: [{ columnName: 'weight_g', characteristicType: 'nominalIsBest' }],
};

// Existing data: rows on May 1–4 (the middle two will fall in the overlap range).
const EXISTING_ROWS = [
  { ts: '2026-05-01', weight_g: 100 }, // before overlap
  { ts: '2026-05-02', weight_g: 101 }, // inside overlap
  { ts: '2026-05-03', weight_g: 102 }, // inside overlap
  { ts: '2026-05-04', weight_g: 103 }, // after overlap
];

// New rows replacing the overlap period (May 2–3) with corrected values.
const NEW_ROWS = [
  { ts: '2026-05-02', weight_g: 200 },
  { ts: '2026-05-03', weight_g: 201 },
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

function makeOptions(
  overrides: Partial<UsePasteImportFlowOptions> = {}
): UsePasteImportFlowOptions {
  return {
    rawData: EXISTING_ROWS,
    outcome: 'weight_g',
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

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'weight_g',
    factors: [],
    timeColumn: 'ts',
    columnAnalysis: [
      { name: 'ts', sampleValues: ['2026-05-02', '2026-05-03'], type: 'date' },
      { name: 'weight_g', sampleValues: ['200', '201'], type: 'numeric' },
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

const CSV_TEXT = 'ts,weight_g\n2026-05-02,200\n2026-05-03,201';

describe('usePasteImportFlow — overlap-replace provenance (Issue 1)', () => {
  it('archives existing overlap rows with __replacedBy tag and merges into dataset', async () => {
    const setRawData = vi.fn();
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
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
    const newRows = mergedData.filter(r => !r['__replacedBy'] && r['weight_g'] >= 200);
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
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB, setRawData }))
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
