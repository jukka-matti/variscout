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

  it('stagedStats stage order matches stagedData order (drive-by fix: mode-aware order passed through)', () => {
    // With day-part values, auto mode should apply natural order Morning→Afternoon→Evening
    const dayPartData = [
      { measurement: 10, shift: 'Afternoon' },
      { measurement: 12, shift: 'Morning' },
      { measurement: 8, shift: 'Evening' },
      { measurement: 11, shift: 'Afternoon' },
      { measurement: 9, shift: 'Morning' },
    ];
    useProjectStore.setState({
      rawData: dayPartData,
      filters: {},
      stageColumn: 'shift',
      stageOrderMode: 'auto',
      outcome: 'measurement',
      specs: {},
    });
    const { result } = renderHook(() => useStagedAnalysis());
    expect(result.current.stagedStats).not.toBeNull();
    // stageOrder in stagedStats should match the natural-vocab order
    expect(result.current.stagedStats!.stageOrder).toEqual(['Morning', 'Afternoon', 'Evening']);
    // stagedData should also be ordered Morning first, then Afternoon, then Evening
    const shiftValues = result.current.stagedData.map(r => r['shift']);
    const firstShift = shiftValues[0];
    const lastShift = shiftValues[shiftValues.length - 1];
    expect(firstShift).toBe('Morning');
    expect(lastShift).toBe('Evening');
  });

  it('data-order mode bypasses natural vocab ordering in stagedStats', () => {
    const dayPartData = [
      { measurement: 10, shift: 'Afternoon' },
      { measurement: 12, shift: 'Morning' },
      { measurement: 8, shift: 'Evening' },
    ];
    useProjectStore.setState({
      rawData: dayPartData,
      filters: {},
      stageColumn: 'shift',
      stageOrderMode: 'data-order',
      outcome: 'measurement',
      specs: {},
    });
    const { result } = renderHook(() => useStagedAnalysis());
    // data-order must preserve Afternoon→Morning→Evening (first occurrence)
    expect(result.current.stagedStats!.stageOrder).toEqual(['Afternoon', 'Morning', 'Evening']);
  });
});
