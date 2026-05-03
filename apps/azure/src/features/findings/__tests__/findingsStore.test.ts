import { describe, it, expect, beforeEach } from 'vitest';
import type { Finding } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';
import { useFindingsStore, groupFindingsByChart } from '../findingsStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useFindingsStore.setState({
    highlightedFindingId: null,
    statusFilter: null,
  });
});

describe('findingsStore', () => {
  describe('initial state', () => {
    it('has null highlight and null filter', () => {
      const s = useFindingsStore.getState();
      expect(s.highlightedFindingId).toBeNull();
      expect(s.statusFilter).toBeNull();
    });
  });

  describe('setHighlightedFindingId', () => {
    it('sets the highlighted finding ID', () => {
      useFindingsStore.getState().setHighlightedFindingId('finding-1');
      expect(useFindingsStore.getState().highlightedFindingId).toBe('finding-1');
    });

    it('clears the highlighted finding ID with null', () => {
      useFindingsStore.getState().setHighlightedFindingId('finding-1');
      useFindingsStore.getState().setHighlightedFindingId(null);
      expect(useFindingsStore.getState().highlightedFindingId).toBeNull();
    });

    it('overwrites a previous highlight', () => {
      useFindingsStore.getState().setHighlightedFindingId('finding-1');
      useFindingsStore.getState().setHighlightedFindingId('finding-2');
      expect(useFindingsStore.getState().highlightedFindingId).toBe('finding-2');
    });
  });

  describe('setStatusFilter', () => {
    it('sets the status filter', () => {
      useFindingsStore.getState().setStatusFilter('observed');
      expect(useFindingsStore.getState().statusFilter).toBe('observed');
    });

    it('clears the status filter with null', () => {
      useFindingsStore.getState().setStatusFilter('observed');
      useFindingsStore.getState().setStatusFilter(null);
      expect(useFindingsStore.getState().statusFilter).toBeNull();
    });
  });
});

describe('groupFindingsByChart', () => {
  it('groups findings by chart source', () => {
    const findings = [
      {
        id: '1',
        text: 'boxplot finding',
        source: { chart: 'boxplot', category: '', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '2',
        text: 'pareto finding',
        source: { chart: 'pareto', category: '', timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '3',
        text: 'ichart finding',
        source: { chart: 'ichart', anchorX: 0, anchorY: 0, timeLens: DEFAULT_TIME_LENS },
      },
      {
        id: '4',
        text: 'another boxplot',
        source: { chart: 'boxplot', category: '', timeLens: DEFAULT_TIME_LENS },
      },
    ] as Finding[];

    const result = groupFindingsByChart(findings);
    expect(result.boxplot).toHaveLength(2);
    expect(result.pareto).toHaveLength(1);
    expect(result.ichart).toHaveLength(1);
    expect(result.boxplot[0].id).toBe('1');
    expect(result.boxplot[1].id).toBe('4');
    expect(result.pareto[0].id).toBe('2');
    expect(result.ichart[0].id).toBe('3');
  });

  it('returns empty arrays for an empty input', () => {
    const result = groupFindingsByChart([]);
    expect(result).toEqual({ boxplot: [], pareto: [], ichart: [] });
  });

  it('does not group findings without a source', () => {
    const findings = [
      { id: '1', text: 'no source' },
      { id: '2', text: 'null source', source: undefined },
    ] as Finding[];

    const result = groupFindingsByChart(findings);
    expect(result.boxplot).toHaveLength(0);
    expect(result.pareto).toHaveLength(0);
    expect(result.ichart).toHaveLength(0);
  });
});
