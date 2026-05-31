import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import type { CausalLink, Hypothesis, ProcessContext } from '@variscout/core';
import {
  getAnalyzeInitialState,
  getProjectInitialState,
  useAnalyzeStore,
  useProjectStore,
} from '@variscout/stores';
import { useStoreDataIngestionActions } from '../useStoreDataIngestionActions';

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
}

const expectedActionKeys = [
  'setRawData',
  'setOutcome',
  'setFactors',
  'setSpecs',
  'setFilters',
  'setDataFilename',
  'setDataQualityReport',
  'setParetoMode',
  'setSeparateParetoData',
  'setSeparateParetoFilename',
  'setMeasureColumns',
  'setMeasureLabel',
  'setAnalysisMode',
  'setDefectMapping',
  'setFindings',
  'setCategories',
  'setHypotheses',
  'setCausalLinks',
  'setProcessContext',
  'getProcessContext',
  'setSubgroupConfig',
  'setDisplayOptions',
  'getDisplayOptions',
] as const;

describe('useStoreDataIngestionActions', () => {
  beforeEach(() => {
    resetStores();
  });

  it('returns the full DataIngestionActions surface', () => {
    const { result } = renderHook(() => useStoreDataIngestionActions());

    expect(Object.keys(result.current).sort()).toEqual([...expectedActionKeys].sort());
  });

  it('binds representative project-store setters', () => {
    const { result } = renderHook(() => useStoreDataIngestionActions());

    act(() => {
      result.current.setRawData([{ Machine: 'A', Weight: 42 }]);
      result.current.setOutcome('Weight');
      result.current.setFactors(['Machine']);
      result.current.setDataFilename('sample.csv');
    });

    expect(useProjectStore.getState().rawData).toEqual([{ Machine: 'A', Weight: 42 }]);
    expect(useProjectStore.getState().outcome).toBe('Weight');
    expect(useProjectStore.getState().factors).toEqual(['Machine']);
    expect(useProjectStore.getState().dataFilename).toBe('sample.csv');
  });

  it('binds analyze-store replacement actions', () => {
    const { result } = renderHook(() => useStoreDataIngestionActions());
    const hypothesis: Hypothesis = {
      id: 'h-1',
      name: 'Shift effect',
      synthesis: 'Night shift may be driving variation',
      findingIds: [],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      investigationId: 'inv-test-001',
    };
    const causalLink: CausalLink = {
      id: 'link-1',
      fromFactor: 'Shift',
      toFactor: 'Weight',
      whyStatement: 'Night shift changes fill behavior',
      direction: 'drives',
      evidenceType: 'data',
      findingIds: [],
      hypothesisId: 'h-1',
      source: 'analyst',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };

    act(() => {
      result.current.setHypotheses?.([hypothesis]);
      result.current.setCausalLinks?.([causalLink]);
    });

    expect(useAnalyzeStore.getState().hypotheses).toEqual([hypothesis]);
    expect(useAnalyzeStore.getState().causalLinks).toEqual([causalLink]);
  });

  it('binds process context and display option readers to current project-store state', () => {
    const { result } = renderHook(() => useStoreDataIngestionActions());
    const processContext: ProcessContext = {
      processMap: {
        nodes: [
          { id: 'step-1', label: 'Fill', x: 0, y: 0, type: 'process' },
          { id: 'step-2', label: 'Inspect', x: 100, y: 0, type: 'process' },
        ],
        edges: [{ id: 'edge-1', from: 'step-1', to: 'step-2' }],
      },
      targetMetric: 'cpk',
      targetValue: 1.33,
      targetDirection: 'maximize',
    };

    act(() => {
      result.current.setProcessContext?.(processContext);
      result.current.setDisplayOptions?.({ showViolin: true, showControlLimits: false });
    });

    expect(result.current.getProcessContext?.()).toEqual(processContext);
    expect(result.current.getDisplayOptions?.()).toMatchObject({
      showViolin: true,
      showControlLimits: false,
    });
  });
});
