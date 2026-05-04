/**
 * P3.4 — useEditorDataFlow sidecar RowProvenanceTag tests.
 *
 * Verifies that multi-source-join confirmation populates the provenanceTags
 * sidecar via setRowProvenance, and that single-source pastes do not.
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
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPLETE_HUB: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel Hub',
  createdAt: '2026-05-01T00:00:00Z',
  processGoal: 'Reduce barrel diameter variation.',
  outcomes: [{ columnName: 'diameter_mm', characteristicType: 'nominalIsBest' }],
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

describe('useEditorDataFlow — provenance sidecar (P3.4)', () => {
  it('multi-source-join populates sidecar Map via setRowProvenance', async () => {
    const setRowProvenance = vi.fn();
    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({
          activeHub: COMPLETE_HUB,
          setRowProvenance,
        })
      )
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

    // setRowProvenance called with startIndex=2 (2 existing rows) and 2 tags
    expect(setRowProvenance).toHaveBeenCalledTimes(1);
    const [startIndex, tags] = setRowProvenance.mock.calls[0] as [number, RowProvenanceTag[]];
    expect(startIndex).toBe(2);
    expect(tags).toHaveLength(2);
    // Hub has outcome 'diameter_mm'; new columns are ['lot_id', 'defect_type'].
    // First new-only column (not in ['diameter_mm']) is 'lot_id' → source = 'lot-id'.
    expect(tags[0]).toEqual({ source: 'lot-id', joinKey: 'lot_id' });
    expect(tags[1]).toEqual({ source: 'lot-id', joinKey: 'lot_id' });
  });

  it('single-source append does NOT populate provenance sidecar', async () => {
    const setRowProvenance = vi.fn();
    const appendClassification = {
      source: 'same-source' as const,
      temporal: 'append' as const,
      blockReasons: [],
    };
    vi.mocked(classifyPaste).mockReturnValue(appendClassification);

    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({
          activeHub: COMPLETE_HUB,
          setRowProvenance,
        })
      )
    );

    await act(async () => {
      await result.current.handlePasteAnalyze(CSV_TEXT);
    });

    await act(async () => {
      result.current.acceptMatchSummary({ kind: 'append' });
    });

    // setRowProvenance must NOT have been called for a single-source paste
    expect(setRowProvenance).not.toHaveBeenCalled();
  });

  it('source ID falls back to source-2 when all new columns match hub outcome columns', async () => {
    const setRowProvenance = vi.fn();
    // Hub whose outcomes include both new columns → deriveSourceId returns 'source-2'
    const hubWithAllCols: ProcessHub = {
      ...COMPLETE_HUB,
      outcomes: [
        { columnName: 'lot_id', characteristicType: 'nominalIsBest' },
        { columnName: 'defect_type', characteristicType: 'nominalIsBest' },
      ],
    };

    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({
          activeHub: hubWithAllCols,
          rawData: [{ lot_id: 'A0', diameter_mm: 25.0 }],
          setRowProvenance,
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

    expect(setRowProvenance).toHaveBeenCalledTimes(1);
    const [, tags] = setRowProvenance.mock.calls[0] as [number, RowProvenanceTag[]];
    // hubCols = ['lot_id', 'defect_type']; newColumns = ['lot_id', 'defect_type']
    // → no distinguishing column → fallback 'source-2'
    expect(tags[0].source).toBe('source-2');
  });
});
