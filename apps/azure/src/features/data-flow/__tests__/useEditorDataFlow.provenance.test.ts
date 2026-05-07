/**
 * P5.4 — useEditorDataFlow provenance dispatch tests (P3.4 updated for F3.6-β).
 *
 * P5.2 dropped the `setRowProvenance?` prop; provenance is now carried exclusively
 * in the EVIDENCE_ADD_SNAPSHOT action envelope dispatched to azureHubRepository.
 *
 * Verifies that multi-source-join confirmation dispatches EVIDENCE_ADD_SNAPSHOT with
 * provenance tags, and that single-source pastes do not dispatch at all.
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
import type { JoinKeyCandidate } from '@variscout/core/matchSummary';
import type { RowProvenanceTag } from '@variscout/core/evidenceSources';
import type { HubAction } from '@variscout/core/actions';
import { azureHubRepository } from '../../../persistence';
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

const mockedDispatch = vi.mocked(azureHubRepository.dispatch);

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel Hub',
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

function makeOptions(overrides: Partial<UseEditorDataFlowOptions> = {}): UseEditorDataFlowOptions {
  return {
    rawData: [
      { lot_id: 'A0', diameter_mm: 25.0 },
      { lot_id: 'A1', diameter_mm: 25.1 },
    ],
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

describe('useEditorDataFlow — provenance dispatch (P5.4 / F3.6-β)', () => {
  it('multi-source-join dispatches EVIDENCE_ADD_SNAPSHOT with provenance tags (no setRowProvenance)', async () => {
    // P5.2: setRowProvenance prop dropped. Provenance now rides the dispatch envelope only.
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
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

    // azureHubRepository.dispatch called once with EVIDENCE_ADD_SNAPSHOT + provenance.
    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    const dispatchCall = mockedDispatch.mock.calls[0][0] as Extract<
      HubAction,
      { kind: 'EVIDENCE_ADD_SNAPSHOT' }
    >;
    expect(dispatchCall.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
    expect(dispatchCall.hubId).toBe('hub-1');

    // provenance carries 2 tags (one per new row).
    const tags = dispatchCall.provenance as RowProvenanceTag[];
    expect(tags).toHaveLength(2);

    // Hub has outcome 'diameter_mm'; new columns are ['lot_id', 'defect_type'].
    // First new-only column (not in ['diameter_mm']) is 'lot_id' → source = 'lot-id'.
    expect(tags[0]).toEqual(
      expect.objectContaining({
        source: 'lot-id',
        joinKey: 'lot_id',
        rowKey: '2',
        deletedAt: null,
      })
    );
    expect(tags[1]).toEqual(
      expect.objectContaining({
        source: 'lot-id',
        joinKey: 'lot_id',
        rowKey: '3',
        deletedAt: null,
      })
    );

    expect(dispatchCall).toMatchObject({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-1',
      snapshot: expect.objectContaining({
        hubId: 'hub-1',
        sourceId: 'lot-id',
        origin: 'paste:lot-id',
        rowCount: 2,
        deletedAt: null,
      }),
      provenance: tags,
    });
    // No replacedSnapshotId on a join (purely additive).
    expect(dispatchCall.replacedSnapshotId).toBeUndefined();
  });

  it('single-source append does NOT dispatch EVIDENCE_ADD_SNAPSHOT', async () => {
    // P5.2: append branch does not dispatch — no snapshot created for single-source appends.
    const appendClassification = {
      source: 'same-source' as const,
      temporal: 'append' as const,
      blockReasons: [],
    };
    vi.mocked(classifyPaste).mockReturnValue(appendClassification);

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    // azureHubRepository.dispatch must NOT have been called for a single-source paste
    // (append branch does not dispatch EVIDENCE_ADD_SNAPSHOT per plan).
    expect(mockedDispatch).not.toHaveBeenCalled();
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
      useEditorDataFlow(
        makeOptions({
          activeHub: hubWithAllCols,
          rawData: [{ lot_id: 'A0', diameter_mm: 25.0 }],
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

    // Dispatch fires with the correct sourceId fallback.
    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    const dispatchCall = mockedDispatch.mock.calls[0][0] as Extract<
      HubAction,
      { kind: 'EVIDENCE_ADD_SNAPSHOT' }
    >;
    expect(dispatchCall.kind).toBe('EVIDENCE_ADD_SNAPSHOT');
    // hubCols = ['lot_id', 'defect_type']; newColumns = ['lot_id', 'defect_type']
    // → no distinguishing column → fallback 'source-2'
    expect(dispatchCall.snapshot).toMatchObject({
      hubId: 'hub-1',
      sourceId: 'source-2',
      origin: 'paste:source-2',
    });
    // provenance tags also have source = 'source-2'
    const tags = dispatchCall.provenance as RowProvenanceTag[];
    expect(tags[0].source).toBe('source-2');
  });
});
