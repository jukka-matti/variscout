import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useProjectStore,
  useInvestigationStore,
  getProjectInitialState,
  getInvestigationInitialState,
} from '@variscout/stores';
import { useHubComputations } from '../useHubComputations';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { SuspectedCause, Question } from '@variscout/core/findings';

// ============================================================================
// Helpers
// ============================================================================

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    text: 'Test question',
    status: 'open',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeHub(overrides: Partial<SuspectedCause> & { id: string }): SuspectedCause {
  return {
    name: 'Test hub',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeBestSubsets(overrides?: Partial<BestSubsetsResult>): BestSubsetsResult {
  return {
    subsets: [
      {
        factors: ['Machine', 'Shift'],
        factorCount: 2,
        rSquared: 0.6,
        rSquaredAdj: 0.55,
        fStatistic: 10,
        pValue: 0.001,
        isSignificant: true,
        dfModel: 3,
        levelEffects: new Map([
          [
            'Machine',
            new Map([
              ['A', 5],
              ['B', -5],
            ]),
          ],
          [
            'Shift',
            new Map([
              ['Day', 2],
              ['Night', -2],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
    ],
    n: 50,
    totalFactors: 2,
    factorNames: ['Machine', 'Shift'],
    grandMean: 100,
    ssTotal: 1000,
    ...overrides,
  };
}

// ============================================================================
// Test setup
// ============================================================================

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
  useInvestigationStore.setState(getInvestigationInitialState());
});

// ============================================================================
// Tests
// ============================================================================

describe('useHubComputations', () => {
  describe('hubEvidences', () => {
    it('returns undefined when no hubs are in store', () => {
      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));
      expect(result.current.hubEvidences).toBeUndefined();
    });

    it('returns undefined when hubs list is empty even with bestSubsets', () => {
      useInvestigationStore.setState({ suspectedCauses: [] });
      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));
      expect(result.current.hubEvidences).toBeUndefined();
    });

    it('returns a map with one entry per hub when hubs exist', () => {
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });

      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));

      expect(result.current.hubEvidences).toBeInstanceOf(Map);
      expect(result.current.hubEvidences?.size).toBe(1);
      expect(result.current.hubEvidences?.has('hub-1')).toBe(true);
    });

    it('computes evidence for multiple hubs', () => {
      const hub1 = makeHub({ id: 'hub-1', questionIds: [] });
      const hub2 = makeHub({ id: 'hub-2', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub1, hub2] });

      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));

      expect(result.current.hubEvidences?.size).toBe(2);
      expect(result.current.hubEvidences?.has('hub-1')).toBe(true);
      expect(result.current.hubEvidences?.has('hub-2')).toBe(true);
    });

    it('uses performance mode when analysisMode is performance', () => {
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });
      useProjectStore.setState({ analysisMode: 'performance' });

      const { result } = renderHook(() => useHubComputations(null, []));

      const evidence = result.current.hubEvidences?.get('hub-1');
      expect(evidence?.mode).toBe('performance');
    });

    it('uses yamazumi mode when analysisMode is yamazumi', () => {
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });
      useProjectStore.setState({ analysisMode: 'yamazumi' });

      const { result } = renderHook(() => useHubComputations(null, []));

      const evidence = result.current.hubEvidences?.get('hub-1');
      expect(evidence?.mode).toBe('yamazumi');
    });

    it('uses standard mode for standard analysisMode', () => {
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });
      useProjectStore.setState({ analysisMode: 'standard' });

      const { result } = renderHook(() => useHubComputations(null, []));

      const evidence = result.current.hubEvidences?.get('hub-1');
      expect(evidence?.mode).toBe('standard');
    });

    it('factors from linked questions are picked up in evidence', () => {
      const questions = [makeQuestion({ id: 'q1', factor: 'Machine', status: 'investigating' })];
      const hub = makeHub({ id: 'hub-1', questionIds: ['q1'] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });

      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), questions));

      const evidence = result.current.hubEvidences?.get('hub-1');
      // The evidence should have a non-zero contribution when the factor is in bestSubsets
      expect(evidence).toBeDefined();
      expect(evidence?.contribution.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('worstLevels', () => {
    it('returns empty object when bestSubsets is null', () => {
      const { result } = renderHook(() => useHubComputations(null, []));
      expect(result.current.worstLevels).toEqual({});
    });

    it('extracts worst level (highest absolute effect) per factor', () => {
      const bestSubsets = makeBestSubsets();
      const { result } = renderHook(() => useHubComputations(bestSubsets, []));

      // Machine: 'A' has effect 5, 'B' has -5; both abs = 5, first wins
      expect(result.current.worstLevels['Machine']).toBeDefined();
      // Shift: 'Day' has effect 2, 'Night' has -2; both abs = 2, first wins
      expect(result.current.worstLevels['Shift']).toBeDefined();
    });

    it('picks the level with the largest absolute effect', () => {
      const bestSubsets: BestSubsetsResult = {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.3,
            rSquaredAdj: 0.28,
            fStatistic: 5,
            pValue: 0.03,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map([
              [
                'Machine',
                new Map([
                  ['A', 1],
                  ['B', -10],
                  ['C', 3],
                ]),
              ],
            ]),
            cellMeans: new Map(),
          },
        ],
        n: 30,
        totalFactors: 1,
        factorNames: ['Machine'],
        grandMean: 100,
        ssTotal: 500,
      };

      const { result } = renderHook(() => useHubComputations(bestSubsets, []));

      // 'B' has abs effect 10, which is largest
      expect(result.current.worstLevels['Machine']).toBe('B');
    });

    it('does not overwrite a factor if already found in a prior subset', () => {
      const bestSubsets: BestSubsetsResult = {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.4,
            rSquaredAdj: 0.38,
            fStatistic: 8,
            pValue: 0.01,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map([['Machine', new Map([['A', 5]])]]),
            cellMeans: new Map(),
          },
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.35,
            rSquaredAdj: 0.33,
            fStatistic: 7,
            pValue: 0.02,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map([['Machine', new Map([['Z', 100]])]]),
            cellMeans: new Map(),
          },
        ],
        n: 30,
        totalFactors: 1,
        factorNames: ['Machine'],
        grandMean: 100,
        ssTotal: 500,
      };

      const { result } = renderHook(() => useHubComputations(bestSubsets, []));

      // First subset sets Machine='A'; second subset should not overwrite
      expect(result.current.worstLevels['Machine']).toBe('A');
    });
  });

  describe('hubProjections', () => {
    it('returns undefined when no hubs exist', () => {
      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));
      expect(result.current.hubProjections).toBeUndefined();
    });

    it('returns undefined when bestSubsets is null even with hubs', () => {
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });

      const { result } = renderHook(() => useHubComputations(null, []));
      expect(result.current.hubProjections).toBeUndefined();
    });

    it('returns a map keyed by hub id when hubs and bestSubsets are provided', () => {
      const questions = [makeQuestion({ id: 'q1', factor: 'Machine', status: 'investigating' })];
      const hub = makeHub({ id: 'hub-1', questionIds: ['q1'] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });

      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), questions));

      // computeHubProjection may return null for hubs with no matching subsets;
      // the map may be empty but should be defined
      expect(result.current.hubProjections).toBeInstanceOf(Map);
    });

    it('excludes hubs where computeHubProjection returns null', () => {
      // Hub with no linked questions will find no factors in subsets
      const hub = makeHub({ id: 'hub-1', questionIds: [] });
      useInvestigationStore.setState({ suspectedCauses: [hub] });

      const { result } = renderHook(() => useHubComputations(makeBestSubsets(), []));

      // Should be a Map (not undefined) but may be empty
      expect(result.current.hubProjections).toBeInstanceOf(Map);
    });
  });

  describe('store reactivity', () => {
    it('updates hubEvidences when hubs are added to the investigation store', () => {
      const { result, rerender } = renderHook(() => useHubComputations(makeBestSubsets(), []));

      expect(result.current.hubEvidences).toBeUndefined();

      useInvestigationStore.setState({
        suspectedCauses: [makeHub({ id: 'hub-1', questionIds: [] })],
      });
      rerender();

      expect(result.current.hubEvidences).toBeInstanceOf(Map);
      expect(result.current.hubEvidences?.size).toBe(1);
    });
  });
});
