/**
 * F3.5 P3.2 — usePasteImportFlow provenance dispatch tests.
 *
 * Verifies that multi-source-join confirmation dispatches
 * pwaHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... }) with the
 * correct provenance payload, and that single-source pastes do NOT dispatch.
 *
 * Replaces the pre-F3.5 setRowProvenance prop assertions per locked decision D4.
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
import type { JoinKeyCandidate } from '@variscout/core/matchSummary';
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

const JOIN_CANDIDATE: JoinKeyCandidate = {
  hubColumn: 'lot_id',
  newColumn: 'lot_id',
  nameMatchScore: 1,
  valueOverlapPct: 1,
  cardinalityCompatible: true,
  totalScore: 1,
};

// New rows with 'lot_id' shared + 'defect_type' as the distinguishing column.
const NEW_ROWS = [
  { lot_id: 'A1', defect_type: 'scratch' },
  { lot_id: 'A2', defect_type: 'dent' },
];

const JOINABLE_CLASSIFICATION = {
  source: 'different-source-joinable' as const,
  temporal: 'no-timestamp' as const,
  blockReasons: [],
  candidates: [JOIN_CANDIDATE],
};

function makeOptions(
  overrides: Partial<UsePasteImportFlowOptions> = {}
): UsePasteImportFlowOptions {
  return {
    rawData: [
      { lot_id: 'A0', weight_g: 100 },
      { lot_id: 'A1', weight_g: 101 },
    ],
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
    timeColumn: undefined,
    columnAnalysis: [
      { name: 'lot_id', sampleValues: ['A1', 'A2'], type: 'categorical' },
      { name: 'defect_type', sampleValues: ['scratch', 'dent'], type: 'categorical' },
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
    NEW_ROWS as unknown as Awaited<ReturnType<typeof parseText>>
  );
  vi.mocked(classifyPaste).mockReturnValue(JOINABLE_CLASSIFICATION);
});

const CSV_TEXT = 'lot_id,defect_type\nA1,scratch\nA2,dent';

describe('usePasteImportFlow — provenance dispatch (F3.5 D4)', () => {
  it('multi-source-join dispatches EVIDENCE_ADD_SNAPSHOT with provenance tags', async () => {
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    // Trigger paste → shows matchSummary
    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    expect(result.current.matchSummary).toBeDefined();
    expect(result.current.matchSummary?.classification.source).toBe('different-source-joinable');

    // Accept the join confirmation
    await act(async () => {
      result.current.acceptMatchSummary({
        kind: 'multi-source-join',
        candidate: JOIN_CANDIDATE,
      });
    });

    expect(result.current.matchSummary).toBeUndefined();

    // dispatch must have been called with EVIDENCE_ADD_SNAPSHOT
    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
    const dispatchArg = vi.mocked(pwaHubRepository.dispatch).mock.calls[0][0];
    expect(dispatchArg.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
    if (dispatchArg.kind !== 'EVIDENCE_ADD_SNAPSHOT') return; // type narrowing

    expect(dispatchArg.hubId).toBe('hub-1');
    expect(dispatchArg.snapshot).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        hubId: 'hub-1',
        rowCount: 2,
      })
    );
    // Hub has outcome 'weight_g'; new columns are ['lot_id', 'defect_type'].
    // First new-only column (not in ['weight_g']) is 'lot_id' → sourceId = 'lot-id'.
    expect(dispatchArg.snapshot.sourceId).toBe('lot-id');

    // 2 provenance tags (one per new row), each with correct rowKey and joinKey.
    expect(dispatchArg.provenance).toHaveLength(2);
    expect(dispatchArg.provenance[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        source: 'lot-id',
        joinKey: 'lot_id',
        rowKey: '2', // existing 2 rows → startIndex = 2
        deletedAt: null,
      })
    );
    expect(dispatchArg.provenance[1]).toEqual(
      expect.objectContaining({
        source: 'lot-id',
        joinKey: 'lot_id',
        rowKey: '3',
        deletedAt: null,
      })
    );
  });

  it('single-source append does NOT dispatch EVIDENCE_ADD_SNAPSHOT', async () => {
    const appendClassification = {
      source: 'same-source' as const,
      temporal: 'append' as const,
      blockReasons: [],
    };
    vi.mocked(classifyPaste).mockReturnValue(appendClassification);

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    // dispatch must NOT have been called for a single-source append
    expect(pwaHubRepository.dispatch).not.toHaveBeenCalled();
  });

  it('source ID falls back to source-2 when all new columns match hub outcome columns', async () => {
    // Hub whose outcomes include both new columns → deriveSourceId returns 'source-2'
    const hubWithAllCols: ProcessHub = {
      ...COMPLETE_HUB,
      outcomes: [
        {
          id: 'outcome-lot',
          hubId: 'hub-1',
          createdAt: 1746057600000,
          deletedAt: null,
          columnName: 'lot_id',
          characteristicType: 'nominalIsBest',
        },
        {
          id: 'outcome-defect',
          hubId: 'hub-1',
          createdAt: 1746057600000,
          deletedAt: null,
          columnName: 'defect_type',
          characteristicType: 'nominalIsBest',
        },
      ],
    };

    const { result } = renderHook(() =>
      usePasteImportFlow(
        makeOptions({
          activeHub: hubWithAllCols,
          rawData: [{ lot_id: 'A0', weight_g: 100 }],
        })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({
        kind: 'multi-source-join',
        candidate: JOIN_CANDIDATE,
      });
    });

    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
    const dispatchArg = vi.mocked(pwaHubRepository.dispatch).mock.calls[0][0];
    expect(dispatchArg.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
    if (dispatchArg.kind !== 'EVIDENCE_ADD_SNAPSHOT') return;

    // hubCols = ['lot_id', 'defect_type']; newColumns = ['lot_id', 'defect_type']
    // → no distinguishing column → fallback 'source-2'
    expect(dispatchArg.snapshot.sourceId).toBe('source-2');
    expect(dispatchArg.provenance[0]).toEqual(expect.objectContaining({ source: 'source-2' }));
  });
});
