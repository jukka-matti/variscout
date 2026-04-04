import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useStagedAnalysis } from '../useStagedAnalysis';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('useStagedAnalysis', () => {
  const sampleData = [
    { weight: 100, stage: 'before' },
    { weight: 105, stage: 'after' },
    { weight: 110, stage: 'before' },
    { weight: 95, stage: 'after' },
  ];

  it('returns filteredData as-is when no stageColumn is set', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: {},
      stageColumn: null,
    });
    const { result } = renderHook(() => useStagedAnalysis());
    expect(result.current.stagedData).toHaveLength(4);
    expect(result.current.stagedStats).toBeNull();
  });

  it('returns stagedStats when stageColumn and outcome are set', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: {},
      stageColumn: 'stage',
      stageOrderMode: 'auto',
      outcome: 'weight',
      specs: {},
    });
    const { result } = renderHook(() => useStagedAnalysis());
    expect(result.current.stagedStats).not.toBeNull();
    // stages is a Map<string, StatsResult>
    const stageNames = Array.from(result.current.stagedStats!.stages.keys());
    expect(stageNames).toContain('before');
    expect(stageNames).toContain('after');
  });

  it('returns null stagedStats when outcome is not set', () => {
    useProjectStore.setState({
      rawData: sampleData,
      filters: {},
      stageColumn: 'stage',
      outcome: null,
    });
    const { result } = renderHook(() => useStagedAnalysis());
    expect(result.current.stagedStats).toBeNull();
  });
});
