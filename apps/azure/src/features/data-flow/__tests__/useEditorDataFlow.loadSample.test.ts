/**
 * FSJ-3a — handleLoadSample boolean-return contract.
 *
 * Verifies:
 *   (1) returns true + calls loadSample on a fresh session (no rawData, no outcome)
 *   (2) returns false + does NOT call loadSample when the replace-confirm is declined
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
    detectDefectFormat: vi.fn(),
  };
});

import { renderHook, act } from '@testing-library/react';
import { detectColumns, validateData, detectWideFormat, detectDefectFormat } from '@variscout/core';
import type { DataRow } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import { useEditorDataFlow, type UseEditorDataFlowOptions } from '../useEditorDataFlow';

// ─── Minimal SampleDataset fixture ────────────────────────────────────────────
// Has outcome + factors → no OPEN_MAPPING dispatch (pre-configured path)
const SAMPLE_FIXTURE: SampleDataset = {
  name: 'Cookie Weight',
  description: 'Biscuit weight variation on a packaging line.',
  icon: 'Cookie',
  urlKey: 'cookie-weight',
  category: 'standard',
  featured: false,
  data: [
    { Batch_ID: 1, Weight_g: 12.4, Shift: 'A' },
    { Batch_ID: 2, Weight_g: 12.6, Shift: 'B' },
  ],
  config: {
    outcome: 'Weight_g',
    factors: ['Shift'],
    specs: { usl: 13.0, lsl: 12.0 },
  },
};

// ─── Default mock option builders ─────────────────────────────────────────────
function makeOptions(overrides: Partial<UseEditorDataFlowOptions> = {}): UseEditorDataFlowOptions {
  return {
    rawData: [] as DataRow[],
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

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(detectColumns).mockReturnValue({
    outcome: 'Weight_g',
    factors: ['Shift'],
    timeColumn: null,
    columnAnalysis: [
      { name: 'Weight_g', sampleValues: ['12.4', '12.6'], type: 'numeric' },
      { name: 'Shift', sampleValues: ['A', 'B'], type: 'categorical' },
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
  vi.mocked(detectDefectFormat).mockReturnValue({
    isDefectFormat: false,
  } as unknown as ReturnType<typeof detectDefectFormat>);
});

describe('useEditorDataFlow — handleLoadSample boolean return (FSJ-3a)', () => {
  it('returns true and loads on a fresh session', () => {
    const loadSample = vi.fn();
    const { result } = renderHook(() => useEditorDataFlow(makeOptions({ loadSample })));

    let returned: boolean | undefined;
    act(() => {
      returned = result.current.handleLoadSample(SAMPLE_FIXTURE);
    });

    expect(returned).toBe(true);
    expect(loadSample).toHaveBeenCalledWith(SAMPLE_FIXTURE);
  });

  it('returns false and loads nothing when the replace-confirm is declined (negative control)', () => {
    const loadSample = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { result } = renderHook(() =>
      useEditorDataFlow(
        makeOptions({
          loadSample,
          // Seed a non-empty session so the confirm is triggered
          rawData: [{ Weight_g: 12.4, Shift: 'A' }] as DataRow[],
          outcome: 'Weight_g',
        })
      )
    );

    let returned: boolean | undefined;
    act(() => {
      returned = result.current.handleLoadSample(SAMPLE_FIXTURE);
    });

    expect(returned).toBe(false);
    expect(loadSample).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
