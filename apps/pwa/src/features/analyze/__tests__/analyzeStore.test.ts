import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeFeatureStore, buildQuestionsMap, buildIdeaImpacts } from '../analyzeStore';
import type { Question } from '@variscout/core';

beforeEach(() => {
  useAnalyzeFeatureStore.setState({
    projectionTarget: null,
    expandedQuestionId: null,
  });
});

describe('analyzeStore', () => {
  it('setProjectionTarget sets and clears', () => {
    const target = {
      questionId: 'q-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      questionText: 'Shift effect',
    };
    useAnalyzeFeatureStore.getState().setProjectionTarget(target);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    useAnalyzeFeatureStore.getState().setProjectionTarget(null);
    expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();
  });

  it('expandToQuestion sets expanded ID', () => {
    useAnalyzeFeatureStore.getState().expandToQuestion('q-42');
    expect(useAnalyzeFeatureStore.getState().expandedQuestionId).toBe('q-42');
  });
});

describe('buildQuestionsMap', () => {
  it('builds map from questions array', () => {
    const questions = [
      { id: 'q-1', text: 'Test', status: 'answered', factor: 'Shift' },
    ] as Question[];
    const map = buildQuestionsMap(questions);
    expect(map).toEqual({
      'q-1': {
        text: 'Test',
        status: 'answered',
        factor: 'Shift',
        level: undefined,
        causeRole: undefined,
      },
    });
  });
});

describe('buildIdeaImpacts', () => {
  it('returns empty map when no ideas', () => {
    const questions = [{ id: 'q1', text: 'test', status: 'open' }] as Question[];
    expect(buildIdeaImpacts(questions, undefined, null)).toEqual({});
  });
});
