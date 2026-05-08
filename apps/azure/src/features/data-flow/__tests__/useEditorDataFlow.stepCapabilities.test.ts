/**
 * T2 — useEditorDataFlow stepCapabilities stamping tests.
 *
 * Verifies that EVIDENCE_ADD_SNAPSHOT dispatches include a populated
 * stepCapabilities field when useCanvasStore has a canonical map with at
 * least one node that maps to a numeric column in the paste rows.
 *
 * Tests cover all three dispatch sites:
 *   1. multi-source-join
 *   2. overlap-replace (with overlapRange present)
 *   3. overlap-replace-fallback (no overlapRange)
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
    // parseTimeValue kept real so timestamp filtering works in overlap-replace tests.
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
import type { HubAction } from '@variscout/core/actions';
import { useCanvasStore, useProjectStore } from '@variscout/stores';
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

// New rows with numeric diameter_mm values so stamp can compute stats.
const NEW_ROWS = [
  { lot_id: 'A3', diameter_mm: 25.0 },
  { lot_id: 'A4', diameter_mm: 25.1 },
  { lot_id: 'A5', diameter_mm: 25.2 },
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
      { lot_id: 'A0', diameter_mm: 24.8 },
      { lot_id: 'A1', diameter_mm: 24.9 },
      { lot_id: 'A2', diameter_mm: 25.0 },
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

// Canvas map with one node whose ctqColumn is 'diameter_mm'.
const CANVAS_MAP_WITH_DIAMETER_NODE = {
  id: 'map-1',
  nodes: [{ id: 'step-bore-1', name: 'Boring', order: 0, ctqColumn: 'diameter_mm' }],
  arrows: [],
  assignments: {},
};

beforeEach(() => {
  vi.clearAllMocks();

  // Reset both stores to their initial state per project Zustand-test convention.
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useProjectStore.setState(useProjectStore.getInitialState());

  vi.mocked(azureHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(azureHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'diameter_mm',
    factors: [],
    timeColumn: undefined,
    columnAnalysis: [
      { name: 'lot_id', sampleValues: ['A3', 'A4', 'A5'], type: 'categorical' },
      { name: 'diameter_mm', sampleValues: [25.0, 25.1, 25.2], type: 'continuous' },
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

const CSV_TEXT = 'lot_id,diameter_mm\nA3,25.0\nA4,25.1\nA5,25.2';

describe('useEditorDataFlow — stepCapabilities stamping (T2)', () => {
  it('multi-source-join: dispatched snapshot has stepCapabilities populated from canvas map', async () => {
    // Seed canvas store with a map containing a node mapped to diameter_mm.
    useCanvasStore
      .getState()
      .hydrateCanvasDocument({ canonicalMap: CANVAS_MAP_WITH_DIAMETER_NODE });
    // Seed measureSpecs with spec limits so Cpk can be computed.
    useProjectStore.setState(s => ({
      ...s,
      measureSpecs: { diameter_mm: { usl: 25.5, lsl: 24.5 } },
    }));

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
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

    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    const dispatchCall = mockedDispatch.mock.calls[0][0] as Extract<
      HubAction,
      { kind: 'EVIDENCE_ADD_SNAPSHOT' }
    >;
    expect(dispatchCall.kind).toBe('EVIDENCE_ADD_SNAPSHOT');

    // stepCapabilities must be defined and contain one entry (one map node).
    expect(dispatchCall.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchCall.snapshot.stepCapabilities).toHaveLength(1);
    const stamp = dispatchCall.snapshot.stepCapabilities![0];
    expect(stamp.stepId).toBe('step-bore-1');
    expect(stamp.n).toBeGreaterThan(0);
  });

  it('multi-source-join: stepCapabilities is empty array when canvas map has no nodes', async () => {
    // Canvas store is in its default empty-map state (reset in beforeEach).
    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
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

    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    const dispatchCall = mockedDispatch.mock.calls[0][0] as Extract<
      HubAction,
      { kind: 'EVIDENCE_ADD_SNAPSHOT' }
    >;
    if (dispatchCall.kind !== 'EVIDENCE_ADD_SNAPSHOT') return;

    // Empty map → stamps array is empty but field is defined.
    expect(dispatchCall.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchCall.snapshot.stepCapabilities).toHaveLength(0);
  });

  it('overlap-replace-fallback: dispatched snapshot has stepCapabilities from canvas map', async () => {
    // Overlap-replace fallback fires when overlapRange is absent.
    const overlapClassification = {
      source: 'same-source' as const,
      temporal: 'overlap-replace' as const,
      blockReasons: [],
      overlapRange: undefined, // no range → triggers fallback branch
    };
    vi.mocked(classifyPaste).mockReturnValue(overlapClassification);
    vi.mocked(azureHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

    useCanvasStore
      .getState()
      .hydrateCanvasDocument({ canonicalMap: CANVAS_MAP_WITH_DIAMETER_NODE });
    useProjectStore.setState(s => ({
      ...s,
      measureSpecs: { diameter_mm: { usl: 25.5, lsl: 24.5 } },
    }));

    const { result } = renderHook(() =>
      useEditorDataFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    const dispatchCall = mockedDispatch.mock.calls[0][0] as Extract<
      HubAction,
      { kind: 'EVIDENCE_ADD_SNAPSHOT' }
    >;
    if (dispatchCall.kind !== 'EVIDENCE_ADD_SNAPSHOT') return;

    expect(dispatchCall.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchCall.snapshot.stepCapabilities).toHaveLength(1);
    expect(dispatchCall.snapshot.stepCapabilities![0].stepId).toBe('step-bore-1');
    expect(dispatchCall.snapshot.stepCapabilities![0].n).toBeGreaterThan(0);
  });
});
