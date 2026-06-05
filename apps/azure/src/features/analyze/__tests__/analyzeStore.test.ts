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

    state.expandToHypothesis('h1');
    expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBe('h1');
    state.expandToHypothesis(null);
    expect(useAnalyzeFeatureStore.getState().expandedHypothesisId).toBeNull();
  });

  it('re-exports the projection type and idea-impact helper', () => {
    const target: ProjectionTarget = {
      hypothesisId: 'h1',
      ideaId: 'idea1',
      ideaText: 'Calibrate head 3',
      hypothesisText: 'Head 3 causes variation',
    };

    useAnalyzeFeatureStore.getState().setProjectionTarget(target);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    useAnalyzeFeatureStore.getState().setProjectionTarget(null);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();

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
        ideas: [{ id: 'i1', text: 'Fix it', createdAt: 1714000000000, deletedAt: null }],
      },
    ];

    expect(buildIdeaImpacts(hypotheses, undefined, null)).toHaveProperty('i1');
  });
});
