import { describe, it, expect, beforeEach } from 'vitest';
import type { Finding } from '@variscout/core';
import { useFindingsStore } from '../findingsStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useFindingsStore.setState({
    findings: [],
    highlightedFindingId: null,
    chartFindings: { boxplot: [], pareto: [], ichart: [] },
    statusFilter: null,
  });
});

describe('findingsStore', () => {
  describe('initial state', () => {
    it('has empty findings, null highlight, empty chart groups, and null filter', () => {
      const s = useFindingsStore.getState();
      expect(s.findings).toEqual([]);
      expect(s.highlightedFindingId).toBeNull();
      expect(s.chartFindings).toEqual({ boxplot: [], pareto: [], ichart: [] });
      expect(s.statusFilter).toBeNull();
    });
  });

  describe('syncFindings', () => {
    it('syncs an empty array', () => {
      const empty: Finding[] = [];
      useFindingsStore.getState().syncFindings(empty);
      const s = useFindingsStore.getState();
      expect(s.findings).toBe(empty);
      expect(s.chartFindings).toEqual({ boxplot: [], pareto: [], ichart: [] });
    });

    it('groups findings by chart source', () => {
      const findings = [
        { id: '1', text: 'boxplot finding', source: { chart: 'boxplot' } },
        { id: '2', text: 'pareto finding', source: { chart: 'pareto' } },
        { id: '3', text: 'ichart finding', source: { chart: 'ichart' } },
        { id: '4', text: 'another boxplot', source: { chart: 'boxplot' } },
      ] as Finding[];

      useFindingsStore.getState().syncFindings(findings);
      const s = useFindingsStore.getState();
      expect(s.findings).toBe(findings);
      expect(s.chartFindings.boxplot).toHaveLength(2);
      expect(s.chartFindings.pareto).toHaveLength(1);
      expect(s.chartFindings.ichart).toHaveLength(1);
      expect(s.chartFindings.boxplot[0].id).toBe('1');
      expect(s.chartFindings.boxplot[1].id).toBe('4');
      expect(s.chartFindings.pareto[0].id).toBe('2');
      expect(s.chartFindings.ichart[0].id).toBe('3');
    });

    it('does not group findings without a source', () => {
      const findings = [
        { id: '1', text: 'no source' },
        { id: '2', text: 'null source', source: undefined },
      ] as Finding[];

      useFindingsStore.getState().syncFindings(findings);
      const s = useFindingsStore.getState();
      expect(s.findings).toBe(findings);
      expect(s.chartFindings.boxplot).toHaveLength(0);
      expect(s.chartFindings.pareto).toHaveLength(0);
      expect(s.chartFindings.ichart).toHaveLength(0);
    });

    it('skips recomputation when same reference is passed', () => {
      const findings = [{ id: '1', text: 'test', source: { chart: 'boxplot' } }] as Finding[];

      useFindingsStore.getState().syncFindings(findings);
      const chartFindingsAfterFirst = useFindingsStore.getState().chartFindings;

      // Sync same reference again
      useFindingsStore.getState().syncFindings(findings);
      const chartFindingsAfterSecond = useFindingsStore.getState().chartFindings;

      // Should be the exact same object (no recomputation)
      expect(chartFindingsAfterSecond).toBe(chartFindingsAfterFirst);
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
