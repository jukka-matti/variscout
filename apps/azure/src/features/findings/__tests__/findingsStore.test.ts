import { describe, it, expect, beforeEach } from 'vitest';
import type { Finding } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';
import {
  groupFindingsByChart,
  useFindingsStore,
  type ChartFindings,
  type FindingsStore,
} from '../findingsStore';

beforeEach(() => {
  useFindingsStore.setState({
    highlightedFindingId: null,
    statusFilter: null,
  });
});

describe('findingsStore wrapper', () => {
  it('exposes the app-local singleton actions', () => {
    const state: FindingsStore = useFindingsStore.getState();

    state.setHighlightedFindingId('finding-1');
    expect(useFindingsStore.getState().highlightedFindingId).toBe('finding-1');
    state.setHighlightedFindingId(null);
    expect(useFindingsStore.getState().highlightedFindingId).toBeNull();

    state.setStatusFilter('observed');
    expect(useFindingsStore.getState().statusFilter).toBe('observed');
  });

  it('re-exports chart grouping helper and public type', () => {
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
    const result: ChartFindings = groupFindingsByChart(findings);

    expect(result.boxplot).toHaveLength(2);
    expect(result.pareto).toHaveLength(1);
    expect(result.ichart).toHaveLength(1);
  });
});
