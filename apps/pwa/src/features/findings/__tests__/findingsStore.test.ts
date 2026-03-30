import { describe, it, expect, beforeEach } from 'vitest';
import { useFindingsStore } from '../findingsStore';
import type { Finding } from '@variscout/core';

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
    findings: [],
    highlightedFindingId: null,
    chartFindings: { boxplot: [], pareto: [], ichart: [] },
    statusFilter: null,
  });
});

describe('findingsStore', () => {
  describe('syncFindings', () => {
    it('updates findings and recomputes chartFindings', () => {
      const findings = [
        makeFinding({ source: { chart: 'boxplot', category: 'A' } }),
        makeFinding({ source: { chart: 'pareto', category: 'B' } }),
        makeFinding(),
      ];
      useFindingsStore.getState().syncFindings(findings);
      const s = useFindingsStore.getState();
      expect(s.findings).toHaveLength(3);
      expect(s.chartFindings.boxplot).toHaveLength(1);
      expect(s.chartFindings.pareto).toHaveLength(1);
      expect(s.chartFindings.ichart).toHaveLength(0);
    });

    it('skips update when same array reference (referential equality)', () => {
      const findings = [makeFinding()];
      useFindingsStore.getState().syncFindings(findings);
      const before = useFindingsStore.getState().chartFindings;
      useFindingsStore.getState().syncFindings(findings);
      expect(useFindingsStore.getState().chartFindings).toBe(before);
    });
  });

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
