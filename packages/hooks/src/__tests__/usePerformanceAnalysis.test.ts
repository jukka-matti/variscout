import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { usePerformanceAnalysis } from '../usePerformanceAnalysis';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('usePerformanceAnalysis', () => {
  it('returns null when not in performance mode', () => {
    useProjectStore.setState({
      analysisMode: 'standard',
      rawData: [{ h1: 100, h2: 105 }],
      measureColumns: ['h1', 'h2'],
      specs: { lsl: 90, usl: 110 },
    });
    const { result } = renderHook(() => usePerformanceAnalysis());
    expect(result.current).toBeNull();
  });

  it('returns null when no measure columns are defined', () => {
    useProjectStore.setState({
      analysisMode: 'performance',
      rawData: [{ h1: 100 }],
      measureColumns: [],
      specs: { lsl: 90, usl: 110 },
    });
    const { result } = renderHook(() => usePerformanceAnalysis());
    expect(result.current).toBeNull();
  });

  it('returns null when no specs are defined', () => {
    useProjectStore.setState({
      analysisMode: 'performance',
      rawData: [{ h1: 100, h2: 105 }],
      measureColumns: ['h1', 'h2'],
      specs: {},
    });
    const { result } = renderHook(() => usePerformanceAnalysis());
    expect(result.current).toBeNull();
  });

  it('returns performance data when all conditions are met', () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      h1: 100 + (i % 5),
      h2: 98 + (i % 7),
    }));
    useProjectStore.setState({
      analysisMode: 'performance',
      rawData: data,
      measureColumns: ['h1', 'h2'],
      specs: { lsl: 90, usl: 110 },
    });
    const { result } = renderHook(() => usePerformanceAnalysis());
    expect(result.current).not.toBeNull();
    expect(result.current!.channels).toHaveLength(2);
  });
});
