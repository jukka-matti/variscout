/**
 * F3.5 P3.2 — overlap-replace + existingRange wiring tests (PWA).
 *
 * Verifies that accepting overlap-replace archives existing overlap rows with
 * the __replacedBy tag and merges them into the dataset passed to setRawData,
 * satisfying spec §16 AC "replaced-rows archived with replaced-by tag".
 *
 * Also verifies the existingRange wiring — after D4, existingRange is read
 * from pwaHubRepository.evidenceSnapshots.listByHub() inside handlePasteAnalyze,
 * not from a caller-provided prop. Tests mock listByHub per-test.
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

// Mock the persistence singleton — vi.mock hoist-safe: factory uses no top-level vars.
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
  validateData,
  detectWideFormat,
  detectYamazumiFormat,
  detectDefectFormat,
} from '@variscout/core';
import { classifyPaste } from '@variscout/core/matchSummary';
import type { ProcessHub } from '@variscout/core';
import type { EvidenceSnapshot } from '@variscout/core/evidenceSources';
import { pwaHubRepository } from '../../persistence';
import { usePasteImportFlow, type UsePasteImportFlowOptions } from '../usePasteImportFlow';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Fill-Weight Hub',
  createdAt: 1746057600000,
  deletedAt: null,
  processGoal: 'Reduce fill-weight variation.',
  outcomes: [
    {
      id: 'outcome-weight',
      hubId: 'hub-1',
      createdAt: 1746057600000,
      deletedAt: null,
      columnName: 'weight_g',
      characteristicType: 'nominalIsBest',
    },
  ],
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

  // Re-apply default mock returns after clearAllMocks resets them.
  vi.mocked(pwaHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

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
    const newRows = mergedData.filter(r => !r['__replacedBy'] && (r['weight_g'] as number) >= 200);
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

    // dispatch must also have been called (F3.5 persistence path)
    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
    const dispatchArg = vi.mocked(pwaHubRepository.dispatch).mock.calls[0][0];
    expect(dispatchArg.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
  });

  it('threads replacedSnapshotId from the most-recent live snapshot when overlap-replacing', async () => {
    // Pre-seed: mock listByHub to return one prior snapshot, activating D2 cascade.
    const priorSnapshot: EvidenceSnapshot = {
      id: 'snap-prior',
      hubId: 'hub-1',
      sourceId: 'weight_g',
      capturedAt: '2026-04-30T12:00:00Z',
      importedAt: 1746014400000,
      createdAt: 1746014400000,
      deletedAt: null,
      origin: 'paste:overlap-replace',
      rowCount: 4,
      rowTimestampRange: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-04T23:59:59.999Z',
      },
    };
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([priorSnapshot]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    // Trigger paste → overlap classification
    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    // Accept overlap-replace
    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    // The dispatch must include replacedSnapshotId matching the prior snapshot id.
    expect(pwaHubRepository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        replacedSnapshotId: 'snap-prior',
      })
    );
  });

  it('sets replacedSnapshotId to undefined when no prior snapshots exist (first paste)', async () => {
    // listByHub returns empty array — no prior snapshot → priorSnapshotId is undefined.
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    // dispatch is still called but without a replacedSnapshotId value.
    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
    const rawArg = vi.mocked(pwaHubRepository.dispatch).mock.calls[0][0];
    expect(rawArg.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
    // Cast to extract the EVIDENCE_ADD_SNAPSHOT variant for the optional field check.
    const dispatchArg = rawArg as Extract<typeof rawArg, { kind: 'EVIDENCE_ADD_SNAPSHOT' }>;
    expect(dispatchArg.replacedSnapshotId).toBeUndefined();
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

    // dispatch still called for persistence
    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
  });
});

// ─── existingRange call-site wiring tests ─────────────────────────────────────
// These cases test the F3.5 D4 path: existingRange is now read from
// pwaHubRepository.evidenceSnapshots.listByHub() inside handlePasteAnalyze,
// not from a caller-provided prop. Each case mocks listByHub per-test.

describe('usePasteImportFlow — existingRange wiring (F3.5 D4 + ADR-077 follow-up)', () => {
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

  it('Case A: forwards existingRange when listByHub returns a snapshot with rowTimestampRange', async () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-1',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-01T00:00:00Z',
      importedAt: 1746057600000,
      createdAt: 1746057600000,
      deletedAt: null,
      origin: 'paste-abc',
      rowCount: 4,
      rowTimestampRange: TIME_RANGE,
    };
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([snap]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toEqual(TIME_RANGE);
  });

  it('Case B: forwards existingRange as undefined when listByHub returns empty array', async () => {
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toBeUndefined();
  });

  it('Case C: forwards existingRange as undefined when latest snapshot has no rowTimestampRange', async () => {
    const snapNoRange: EvidenceSnapshot = {
      id: 'snap-1',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-01T00:00:00Z',
      importedAt: 1746057600000,
      createdAt: 1746057600000,
      deletedAt: null,
      origin: 'paste-abc',
      rowCount: 4,
      // rowTimestampRange intentionally absent
    };
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([snapNoRange]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    expect(ctx.existingRange).toBeUndefined();
  });

  it('Case D: does not call classifyPaste or listByHub when activeHub is undefined', async () => {
    const { result } = renderHook(() => usePasteImportFlow(makeOptions({ activeHub: undefined })));

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    // No complete Hub → Mode A.2 branch is skipped entirely.
    expect(classifyPaste).not.toHaveBeenCalled();
    expect(pwaHubRepository.evidenceSnapshots.listByHub).not.toHaveBeenCalled();
  });

  it('Case E: picks the most-recent snapshot by capturedAt when multiple snapshots exist', async () => {
    const olderSnap: EvidenceSnapshot = {
      id: 'snap-older',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-04-01T00:00:00Z',
      importedAt: 1743465600000,
      createdAt: 1743465600000,
      deletedAt: null,
      origin: 'paste-old',
      rowCount: 2,
      rowTimestampRange: {
        startISO: '2026-04-01T00:00:00.000Z',
        endISO: '2026-04-02T00:00:00.000Z',
      },
    };
    const newerSnap: EvidenceSnapshot = {
      id: 'snap-newer',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-01T00:00:00Z',
      importedAt: 1746057600000,
      createdAt: 1746057600000,
      deletedAt: null,
      origin: 'paste-new',
      rowCount: 4,
      rowTimestampRange: TIME_RANGE,
    };
    // Return in ascending order to verify the hook sorts correctly.
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([
      olderSnap,
      newerSnap,
    ]);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(classifyPaste).toHaveBeenCalledTimes(1);
    const [ctx] = vi.mocked(classifyPaste).mock.calls[0];
    // Should pick the newerSnap's rowTimestampRange
    expect(ctx.existingRange).toEqual(TIME_RANGE);
  });
});
