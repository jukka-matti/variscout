import { describe, it, expect, beforeEach } from 'vitest';
import type { Hypothesis } from '@variscout/core';
import {
  buildIdeaImpacts,
  useAnalyzeFeatureStore,
  type AnalyzeStore,
  type ProjectionTarget,
} from '../analyzeStore';

beforeEach(() => {
  useAnalyzeFeatureStore.setState({
    projectionTarget: null,
    expandedHypothesisId: null,
  });
});

describe('analyzeStore wrapper', () => {
  it('exposes the app-local singleton actions', () => {
    const state: AnalyzeStore = useAnalyzeFeatureStore.getState();

    state.expandToHypothesis('h-42');
    expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBe('h-42');
    state.expandToHypothesis(null);
    expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBeNull();
  });

  it('re-exports the projection type and idea-impact helper', () => {
    const target: ProjectionTarget = {
      hypothesisId: 'h-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      hypothesisText: 'Shift effect',
    };

    useAnalyzeFeatureStore.getState().setProjectionTarget(target);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    useAnalyzeFeatureStore.getState().setProjectionTarget(null);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();

    const hypotheses = [
      {
        id: 'h-1',
        name: 'Shift effect',
        status: 'proposed',
        synthesis: '',
        findingIds: [],
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
    ] as Hypothesis[];

    expect(buildIdeaImpacts(hypotheses, undefined, null)).toHaveProperty('idea-1');
  });
});
