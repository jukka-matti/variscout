import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeFeatureStore, buildIdeaImpacts } from '../analyzeStore';
import type { Hypothesis } from '@variscout/core';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useAnalyzeFeatureStore.setState({
    projectionTarget: null,
    expandedHypothesisId: null,
  });
});

describe('analyzeStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useAnalyzeFeatureStore.getState();
      expect(s.projectionTarget).toBeNull();
      expect(s.expandedHypothesisId).toBeNull();
    });
  });

  describe('setProjectionTarget', () => {
    it('sets projection target object', () => {
      const target = {
        hypothesisId: 'h1',
        ideaId: 'idea1',
        ideaText: 'Calibrate head 3',
        hypothesisText: 'Head 3 causes variation',
      };
      useAnalyzeFeatureStore.getState().setProjectionTarget(target);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    });

    it('clears with null', () => {
      useAnalyzeFeatureStore.getState().setProjectionTarget({
        hypothesisId: 'h1',
        ideaId: 'i1',
        ideaText: 'Fix',
        hypothesisText: 'Root cause',
      });
      useAnalyzeFeatureStore.getState().setProjectionTarget(null);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();
    });

    it('overwrites previous target', () => {
      useAnalyzeFeatureStore.getState().setProjectionTarget({
        hypothesisId: 'h1',
        ideaId: 'i1',
        ideaText: 'First',
        hypothesisText: 'First hypothesis',
      });
      const newTarget = {
        hypothesisId: 'h2',
        ideaId: 'i2',
        ideaText: 'Second',
        hypothesisText: 'Second hypothesis',
      };
      useAnalyzeFeatureStore.getState().setProjectionTarget(newTarget);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(newTarget);
    });
  });

  describe('expandToHypothesis', () => {
    it('sets expanded hypothesis id', () => {
      useAnalyzeFeatureStore.getState().expandToHypothesis('h1');
      expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBe('h1');
    });

    it('clears with null', () => {
      useAnalyzeFeatureStore.getState().expandToHypothesis('h1');
      useAnalyzeFeatureStore.getState().expandToHypothesis(null);
      expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBeNull();
    });

    it('changes to different hypothesis', () => {
      useAnalyzeFeatureStore.getState().expandToHypothesis('h1');
      useAnalyzeFeatureStore.getState().expandToHypothesis('h2');
      expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBe('h2');
    });
  });
});

describe('buildIdeaImpacts', () => {
  it('returns empty map when no ideas', () => {
    const hypotheses: Hypothesis[] = [
      {
        id: 'h1',
        name: 'Nozzle wear',
        synthesis: '',
        status: 'proposed',
        findingIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        investigationId: 'general-unassigned',
      },
    ];
    const impacts = buildIdeaImpacts(hypotheses, undefined, null);
    expect(impacts).toEqual({});
  });

  it('computes impacts for hypotheses with ideas', () => {
    const hypotheses: Hypothesis[] = [
      {
        id: 'h1',
        name: 'Nozzle wear',
        synthesis: '',
        status: 'proposed',
        findingIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        investigationId: 'general-unassigned',
        ideas: [{ id: 'i1', text: 'Fix it', createdAt: 1714000000000, deletedAt: null }],
      },
    ];
    const impacts = buildIdeaImpacts(hypotheses, undefined, null);
    expect(impacts).toHaveProperty('i1');
  });

  it('returns empty map for empty hypotheses array', () => {
    expect(buildIdeaImpacts([], undefined, null)).toEqual({});
  });

  it('aggregates ideas across multiple hypotheses', () => {
    const hypotheses: Hypothesis[] = [
      {
        id: 'h1',
        name: 'Cause A',
        synthesis: '',
        status: 'proposed',
        findingIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        investigationId: 'general-unassigned',
        ideas: [{ id: 'i1', text: 'Idea one', createdAt: 1714000000000, deletedAt: null }],
      },
      {
        id: 'h2',
        name: 'Cause B',
        synthesis: '',
        status: 'evidenced',
        findingIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        investigationId: 'general-unassigned',
        ideas: [{ id: 'i2', text: 'Idea two', createdAt: 1714000000000, deletedAt: null }],
      },
    ];
    const impacts = buildIdeaImpacts(hypotheses, undefined, null);
    expect(impacts).toHaveProperty('i1');
    expect(impacts).toHaveProperty('i2');
  });
});
