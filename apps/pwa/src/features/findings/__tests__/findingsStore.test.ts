import { describe, it, expect, beforeEach } from 'vitest';
import { useFindingsStore, groupFindingsByChart } from '../findingsStore';
import type { Finding } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: `f-${Math.random()}`,
  text: 'test finding',
  createdAt: Date.now(),
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [],
  statusChangedAt: Date.now(),
  ...overrides,
});

beforeEach(() => {
  useFindingsStore.setState({
    highlightedFindingId: null,
    statusFilter: null,
  });
});

describe('findingsStore', () => {
  describe('setHighlightedFindingId', () => {
    it('sets and clears highlighted finding', () => {
      useFindingsStore.getState().setHighlightedFindingId('f-1');
      expect(useFindingsStore.getState().highlightedFindingId).toBe('f-1');
      useFindingsStore.getState().setHighlightedFindingId(null);
      expect(useFindingsStore.getState().highlightedFindingId).toBeNull();
    });
  });

  describe('setStatusFilter', () => {
    it('sets status filter', () => {
      useFindingsStore.getState().setStatusFilter('investigating');
      expect(useFindingsStore.getState().statusFilter).toBe('investigating');
    });
  });
});

describe('groupFindingsByChart', () => {
  it('groups findings by source chart type', () => {
    const findings = [
      makeFinding({ source: { chart: 'boxplot', category: 'A', timeLens: DEFAULT_TIME_LENS } }),
      makeFinding({ source: { chart: 'pareto', category: 'B', timeLens: DEFAULT_TIME_LENS } }),
      makeFinding(),
    ];
    const result = groupFindingsByChart(findings);
    expect(result.boxplot).toHaveLength(1);
    expect(result.pareto).toHaveLength(1);
    expect(result.ichart).toHaveLength(0);
  });

  it('returns stable empty arrays for empty input', () => {
    const result = groupFindingsByChart([]);
    expect(result.boxplot).toHaveLength(0);
    expect(result.pareto).toHaveLength(0);
    expect(result.ichart).toHaveLength(0);
  });
});
