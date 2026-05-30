import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeFeatureStore, buildIdeaImpacts } from '../analyzeStore';
import type { Hypothesis } from '@variscout/core';

beforeEach(() => {
  useAnalyzeFeatureStore.setState({
    projectionTarget: null,
    expandedHypothesisId: null,
  });
});

describe('analyzeStore', () => {
  it('setProjectionTarget sets and clears', () => {
    // IM-1: ProjectionTarget is now keyed by hypothesisId (was questionId).
    const target = {
      hypothesisId: 'h-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      hypothesisText: 'Shift effect',
    };
    useAnalyzeFeatureStore.getState().setProjectionTarget(target);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    useAnalyzeFeatureStore.getState().setProjectionTarget(null);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();
  });

  it('expandToHypothesis sets expanded ID', () => {
    // IM-1: expandToHypothesis replaced expandToQuestion (hypothesisId not questionId).
    useAnalyzeFeatureStore.getState().expandToHypothesis('h-42');
    expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBe('h-42');
  });
});

// buildQuestionsMap was removed in IM-1 (ADR-085). No replacement needed —
// the Wall renders hypotheses directly from useAnalyzeStore.scopes.

describe('buildIdeaImpacts', () => {
  it('returns empty map when no ideas', () => {
    // IM-1: buildIdeaImpacts now takes Hypothesis[] (was Question[]).
    const hypotheses = [
      {
        id: 'h-1',
        name: 'Nozzle wear',
        status: 'open' as const,
        synthesis: '',
        findingIds: [],
        investigationId: 'inv-1',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
        // no ideas array → empty impact map
      },
    ] as unknown as Hypothesis[];
    expect(buildIdeaImpacts(hypotheses, undefined, null)).toEqual({});
  });

  it('returns impact entries keyed by idea ID when ideas present', () => {
    const hypotheses = [
      {
        id: 'h-1',
        name: 'Shift effect',
        status: 'open' as const,
        synthesis: '',
        findingIds: [],
        investigationId: 'inv-1',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
        ideas: [
          {
            id: 'idea-1',
            text: 'Train operators',
            createdAt: 1,
            deletedAt: null,
          },
        ],
      },
    ] as unknown as Hypothesis[];
    const impacts = buildIdeaImpacts(hypotheses, undefined, null);
    // The idea appears in the map (impact value is undefined without target/stats).
    expect('idea-1' in impacts).toBe(true);
  });
});
