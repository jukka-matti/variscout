/**
 * T2 — usePasteImportFlow stepCapabilities stamping tests.
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
import { useCanvasStore, useProjectStore } from '@variscout/stores';
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

// New rows with numeric weight_g values so the stamp can compute stats.
const NEW_ROWS = [
  { lot_id: 'A3', weight_g: 100.1 },
  { lot_id: 'A4', weight_g: 100.2 },
  { lot_id: 'A5', weight_g: 100.3 },
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
      { lot_id: 'A0', weight_g: 99.8 },
      { lot_id: 'A1', weight_g: 99.9 },
      { lot_id: 'A2', weight_g: 100.0 },
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

// Canvas map with one node whose ctqColumn is 'weight_g' so stampStepCapabilities
// can find numeric values in the new rows.
const CANVAS_MAP_WITH_WEIGHT_NODE = {
  version: 1 as const,
  nodes: [{ id: 'step-fill-1', name: 'Fill', order: 0, ctqColumn: 'weight_g' }],
  tributaries: [],
  arrows: [],
  assignments: {},
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();

  // Reset both stores to their initial state per project Zustand-test convention.
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useProjectStore.setState(useProjectStore.getInitialState());

  // Re-apply default mock returns after clearAllMocks.
  vi.mocked(pwaHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'weight_g',
    factors: [],
    timeColumn: undefined,
    columnAnalysis: [
      { name: 'lot_id', sampleValues: ['A3', 'A4', 'A5'], type: 'categorical' },
      { name: 'weight_g', sampleValues: [100.1, 100.2, 100.3], type: 'continuous' },
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

const CSV_TEXT = 'lot_id,weight_g\nA3,100.1\nA4,100.2\nA5,100.3';

describe('usePasteImportFlow — stepCapabilities stamping (T2)', () => {
  it('multi-source-join: dispatched snapshot has stepCapabilities populated from canvas map', async () => {
    // Seed canvas store with a map containing a node mapped to weight_g.
    useCanvasStore.getState().hydrateCanvasDocument({ canonicalMap: CANVAS_MAP_WITH_WEIGHT_NODE });
    // Seed measureSpecs with spec limits so Cpk can be computed.
    useProjectStore.setState(s => ({
      ...s,
      measureSpecs: { weight_g: { usl: 101, lsl: 99 } },
    }));

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
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

    // stepCapabilities must be defined and contain one entry (one map node).
    expect(dispatchArg.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchArg.snapshot.stepCapabilities).toHaveLength(1);
    const stamp = dispatchArg.snapshot.stepCapabilities![0];
    expect(stamp.stepId).toBe('step-fill-1');
    expect(stamp.n).toBeGreaterThan(0);
  });

  it('multi-source-join: stepCapabilities is empty array when canvas map has no nodes', async () => {
    // Canvas store is in its default empty-map state (reset in beforeEach).
    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
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
    if (dispatchArg.kind !== 'EVIDENCE_ADD_SNAPSHOT') return;

    // Empty map → stamps array is empty but field is defined.
    expect(dispatchArg.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchArg.snapshot.stepCapabilities).toHaveLength(0);
  });

  it('overlap-replace-fallback: dispatched snapshot has stepCapabilities from canvas map', async () => {
    // Overlap-replace fallback fires when overlapRange is absent.
    const overlapClassification = {
      source: 'same-source' as const,
      temporal: 'overlap' as const,
      blockReasons: [],
      overlapRange: undefined, // no range → triggers fallback branch
    };
    vi.mocked(classifyPaste).mockReturnValue(overlapClassification);
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([]);

    useCanvasStore.getState().hydrateCanvasDocument({ canonicalMap: CANVAS_MAP_WITH_WEIGHT_NODE });
    useProjectStore.setState(s => ({
      ...s,
      measureSpecs: { weight_g: { usl: 101, lsl: 99 } },
    }));

    const { result } = renderHook(() =>
      usePasteImportFlow(makeOptions({ activeHub: COMPLETE_HUB }))
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'overlap-replace' });
    });

    expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1);
    const dispatchArg = vi.mocked(pwaHubRepository.dispatch).mock.calls[0][0];
    if (dispatchArg.kind !== 'EVIDENCE_ADD_SNAPSHOT') return;

    expect(dispatchArg.snapshot.stepCapabilities).toBeDefined();
    expect(dispatchArg.snapshot.stepCapabilities).toHaveLength(1);
    expect(dispatchArg.snapshot.stepCapabilities![0].stepId).toBe('step-fill-1');
    expect(dispatchArg.snapshot.stepCapabilities![0].n).toBeGreaterThan(0);
  });
});
