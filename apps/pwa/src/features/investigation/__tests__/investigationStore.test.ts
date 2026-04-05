import { describe, it, expect, beforeEach } from 'vitest';
import {
  useInvestigationFeatureStore,
  buildQuestionsMap,
  buildIdeaImpacts,
} from '../investigationStore';
import type { Question } from '@variscout/core';

beforeEach(() => {
  useInvestigationFeatureStore.setState({
    projectionTarget: null,
    expandedQuestionId: null,
  });
});

describe('investigationStore', () => {
  it('setProjectionTarget sets and clears', () => {
    const target = {
      questionId: 'q-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      questionText: 'Shift effect',
    };
    useInvestigationFeatureStore.getState().setProjectionTarget(target);
    expect(useInvestigationFeatureStore.getState().projectionTarget).toEqual(target);
    useInvestigationFeatureStore.getState().setProjectionTarget(null);
    expect(useInvestigationFeatureStore.getState().projectionTarget).toBeNull();
  });

  it('expandToQuestion sets expanded ID', () => {
    useInvestigationFeatureStore.getState().expandToQuestion('q-42');
    expect(useInvestigationFeatureStore.getState().expandedQuestionId).toBe('q-42');
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
