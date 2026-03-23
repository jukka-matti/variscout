/**
 * Tests for useDataIngestion hook
 *
 * Validates the shared data ingestion logic: returned shape, clearData reset,
 * loadSample dispatching, and clearParetoFile reset.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { validateData } from '@variscout/core';
import { useDataIngestion, type DataIngestionActions } from '../useDataIngestion';
import type { SampleDataset } from '@variscout/data';

vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    validateData: vi.fn().mockReturnValue({ issues: [] }),
  };
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockActions(): DataIngestionActions {
  return {
    setRawData: vi.fn(),
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setSpecs: vi.fn(),
    setFilters: vi.fn(),
    setDataFilename: vi.fn(),
    setDataQualityReport: vi.fn(),
    setParetoMode: vi.fn(),
    setSeparateParetoData: vi.fn(),
    setSeparateParetoFilename: vi.fn(),
    setMeasureColumns: vi.fn(),
    setMeasureLabel: vi.fn(),
    setAnalysisMode: vi.fn(),
    setYamazumiMapping: vi.fn(),
  };
}

const standardSample: SampleDataset = {
  name: 'Test Sample',
  description: 'A test sample for unit testing',
  icon: 'coffee',
  urlKey: 'test',
  category: 'featured',
  featured: true,
  data: [
    { Machine: 'A', Weight: 10 },
    { Machine: 'A', Weight: 20 },
    { Machine: 'B', Weight: 30 },
  ],
  config: {
    outcome: 'Weight',
    factors: ['Machine'],
    specs: { usl: 50, lsl: 5 },
  },
};

const performanceSample: SampleDataset = {
  name: 'Performance Sample',
  description: 'A multi-measure performance sample',
  icon: 'gauge',
  urlKey: 'perf',
  category: 'featured',
  featured: false,
  data: [
    { Ch1: 10, Ch2: 20, Ch3: 30 },
    { Ch1: 11, Ch2: 21, Ch3: 31 },
  ],
  config: {
    outcome: 'Ch1',
    factors: [],
    specs: { usl: 50, lsl: 5 },
    analysisMode: 'performance' as const,
    measureColumns: ['Ch1', 'Ch2', 'Ch3'],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDataIngestion', () => {
  let mockActions: DataIngestionActions;

  beforeEach(() => {
    mockActions = createMockActions();
    vi.clearAllMocks();
  });

  // ---- Return shape ----

  it('returns the expected shape', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    expect(result.current).toHaveProperty('handleFileUpload');
    expect(result.current).toHaveProperty('handleParetoFileUpload');
    expect(result.current).toHaveProperty('clearParetoFile');
    expect(result.current).toHaveProperty('clearData');
    expect(result.current).toHaveProperty('loadSample');
    expect(result.current).toHaveProperty('applyTimeExtraction');
    expect(typeof result.current.handleFileUpload).toBe('function');
    expect(typeof result.current.clearData).toBe('function');
    expect(typeof result.current.loadSample).toBe('function');
  });

  // ---- clearData ----

  it('clearData resets all state via actions', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.clearData();
    });

    expect(mockActions.setRawData).toHaveBeenCalledWith([]);
    expect(mockActions.setDataFilename).toHaveBeenCalledWith(null);
    expect(mockActions.setOutcome).toHaveBeenCalledWith('');
    expect(mockActions.setFactors).toHaveBeenCalledWith([]);
    expect(mockActions.setSpecs).toHaveBeenCalledWith({});
    expect(mockActions.setFilters).toHaveBeenCalledWith({});
    expect(mockActions.setDataQualityReport).toHaveBeenCalledWith(null);
    expect(mockActions.setParetoMode).toHaveBeenCalledWith('derived');
    expect(mockActions.setSeparateParetoData).toHaveBeenCalledWith(null);
    expect(mockActions.setSeparateParetoFilename).toHaveBeenCalledWith(null);
    expect(mockActions.setMeasureColumns).toHaveBeenCalledWith([]);
    expect(mockActions.setMeasureLabel).toHaveBeenCalledWith('Measure');
  });

  // ---- loadSample (standard) ----

  it('loadSample calls all required actions for a standard sample', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(standardSample);
    });

    expect(mockActions.setRawData).toHaveBeenCalledWith(standardSample.data);
    expect(mockActions.setDataFilename).toHaveBeenCalledWith('Test Sample');
    expect(mockActions.setOutcome).toHaveBeenCalledWith('Weight');
    expect(mockActions.setFactors).toHaveBeenCalledWith(['Machine']);
    expect(mockActions.setSpecs).toHaveBeenCalledWith({ usl: 50, lsl: 5 });
    expect(mockActions.setDataQualityReport).toHaveBeenCalled();
  });

  it('loadSample resets measure state for standard samples', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(standardSample);
    });

    expect(mockActions.setMeasureColumns).toHaveBeenCalledWith([]);
    expect(mockActions.setMeasureLabel).toHaveBeenCalledWith('Channel');
  });

  it('loadSample resets pareto state', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(standardSample);
    });

    expect(mockActions.setParetoMode).toHaveBeenCalledWith('derived');
    expect(mockActions.setSeparateParetoData).toHaveBeenCalledWith(null);
    expect(mockActions.setSeparateParetoFilename).toHaveBeenCalledWith(null);
  });

  // ---- loadSample (performance mode) ----

  it('loadSample enables performance mode for multi-measure samples', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(performanceSample);
    });

    expect(mockActions.setMeasureColumns).toHaveBeenCalledWith(['Ch1', 'Ch2', 'Ch3']);
    expect(mockActions.setMeasureLabel).toHaveBeenCalledWith('Channel');
  });

  it('loadSample does not enable performance mode when fewer than 3 measure columns', () => {
    const twoColumnSample: SampleDataset = {
      ...performanceSample,
      config: {
        ...performanceSample.config,
        analysisMode: 'performance' as const,
        measureColumns: ['Ch1', 'Ch2'],
      },
    };

    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(twoColumnSample);
    });

    expect(mockActions.setMeasureColumns).toHaveBeenCalledWith([]);
  });

  // ---- clearParetoFile ----

  it('clearParetoFile resets pareto state to derived mode', () => {
    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.clearParetoFile();
    });

    expect(mockActions.setSeparateParetoData).toHaveBeenCalledWith(null);
    expect(mockActions.setSeparateParetoFilename).toHaveBeenCalledWith(null);
    expect(mockActions.setParetoMode).toHaveBeenCalledWith('derived');
  });

  // ---- Options / limits ----

  it('accepts custom row limits via options', () => {
    const { result } = renderHook(() =>
      useDataIngestion(mockActions, {
        limits: { rowHardLimit: 100, rowWarningThreshold: 50 },
      })
    );

    // The hook should render without errors and return the standard shape
    expect(result.current.handleFileUpload).toBeDefined();
    expect(result.current.clearData).toBeDefined();
  });

  it('loadSample calls validateData from core', () => {
    const mockedValidateData = vi.mocked(validateData);

    const { result } = renderHook(() => useDataIngestion(mockActions));

    act(() => {
      result.current.loadSample(standardSample);
    });

    expect(mockedValidateData).toHaveBeenCalledWith(standardSample.data, 'Weight');
    expect(mockActions.setDataQualityReport).toHaveBeenCalledWith({ issues: [] });
  });
});
