import { describe, it, expect, beforeEach } from 'vitest';
import type { Finding } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';
import {
  groupFindingsByChart,
  useFindingsStore,
  type ChartFindings,
  type FindingsStore,
} from '../findingsStore';

let findingIdCounter = 0;
const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: `f-${++findingIdCounter}`,
  text: 'test finding',
  createdAt: 1714000000000,
  deletedAt: null,
  investigationId: 'general-unassigned',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 1714000000000,
  ...overrides,
});

beforeEach(() => {
  useFindingsStore.setState({
    highlightedFindingId: null,
    statusFilter: null,
  });
});

describe('findingsStore wrapper', () => {
  it('exposes the app-local singleton actions', () => {
    const state: FindingsStore = useFindingsStore.getState();

    state.setHighlightedFindingId('f-1');
    expect(useFindingsStore.getState().highlightedFindingId).toBe('f-1');
    state.setHighlightedFindingId(null);
    expect(useFindingsStore.getState().highlightedFindingId).toBeNull();

    state.setStatusFilter('investigating');
    expect(useFindingsStore.getState().statusFilter).toBe('investigating');
  });

  it('re-exports chart grouping helper and public type', () => {
    const findings = [
      makeFinding({ source: { chart: 'boxplot', category: 'A', timeLens: DEFAULT_TIME_LENS } }),
      makeFinding({ source: { chart: 'pareto', category: 'B', timeLens: DEFAULT_TIME_LENS } }),
      makeFinding(),
    ];
    const result: ChartFindings = groupFindingsByChart(findings);

    expect(result.boxplot).toHaveLength(1);
    expect(result.pareto).toHaveLength(1);
    expect(result.ichart).toHaveLength(0);
  });
});
