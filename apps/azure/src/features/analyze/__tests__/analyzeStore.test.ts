import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeFeatureStore, buildQuestionsMap, buildIdeaImpacts } from '../analyzeStore';
import type { Question } from '@variscout/core';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useAnalyzeFeatureStore.setState({
    projectionTarget: null,
    expandedQuestionId: null,
  });
});

describe('analyzeStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useAnalyzeFeatureStore.getState();
      expect(s.projectionTarget).toBeNull();
      expect(s.expandedQuestionId).toBeNull();
    });
  });

  describe('setProjectionTarget', () => {
    it('sets projection target object', () => {
      const target = {
        questionId: 'q1',
        ideaId: 'idea1',
        ideaText: 'Calibrate head 3',
        questionText: 'Head 3 causes variation',
      };
      useAnalyzeFeatureStore.getState().setProjectionTarget(target);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(target);
    });

    it('clears with null', () => {
      useAnalyzeFeatureStore.getState().setProjectionTarget({
        questionId: 'q1',
        ideaId: 'i1',
        ideaText: 'Fix',
        questionText: 'Root cause',
      });
      useAnalyzeFeatureStore.getState().setProjectionTarget(null);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toBeNull();
    });

    it('overwrites previous target', () => {
      useAnalyzeFeatureStore.getState().setProjectionTarget({
        questionId: 'q1',
        ideaId: 'i1',
        ideaText: 'First',
        questionText: 'First question',
      });
      const newTarget = {
        questionId: 'q2',
        ideaId: 'i2',
        ideaText: 'Second',
        questionText: 'Second question',
      };
      useAnalyzeFeatureStore.getState().setProjectionTarget(newTarget);
      expect(useAnalyzeFeatureStore.getState().projectionTarget).toEqual(newTarget);
    });
  });

  describe('expandToQuestion', () => {
    it('sets expanded question id', () => {
      useAnalyzeFeatureStore.getState().expandToQuestion('q1');
      expect(useAnalyzeFeatureStore.getState().expandedQuestionId).toBe('q1');
    });

    it('clears with null', () => {
      useAnalyzeFeatureStore.getState().expandToQuestion('q1');
      useAnalyzeFeatureStore.getState().expandToQuestion(null);
      expect(useAnalyzeFeatureStore.getState().expandedQuestionId).toBeNull();
    });

    it('changes to different question', () => {
      useAnalyzeFeatureStore.getState().expandToQuestion('q1');
      useAnalyzeFeatureStore.getState().expandToQuestion('q2');
      expect(useAnalyzeFeatureStore.getState().expandedQuestionId).toBe('q2');
    });
  });
});

describe('buildQuestionsMap', () => {
  it('builds map from questions array', () => {
    const questions = [
      {
        id: 'q1',
        text: 'Head 3 causes variation',
        status: 'investigating',
        factor: 'Head',
        level: '3',
      },
      {
        id: 'q2',
        text: 'Temperature drift',
        status: 'answered',
        causeRole: 'suspected-cause' as const,
      },
    ] as Question[];
    const map = buildQuestionsMap(questions);
    expect(map).toHaveProperty('q1');
    expect(map).toHaveProperty('q2');
    expect(map.q1.factor).toBe('Head');
    expect(map.q2.causeRole).toBe('suspected-cause');
  });

  it('returns empty map for empty array', () => {
    expect(buildQuestionsMap([])).toEqual({});
  });
});

describe('buildIdeaImpacts', () => {
  it('returns empty map when no ideas', () => {
    const questions = [{ id: 'q1', text: 'test', status: 'open' }] as Question[];
    const impacts = buildIdeaImpacts(questions, undefined, null);
    expect(impacts).toEqual({});
  });

  it('computes impacts for questions with ideas', () => {
    const questions = [
      {
        id: 'q1',
        text: 'test',
        status: 'investigating',
        ideas: [{ id: 'i1', text: 'Fix it', createdAt: 1714000000000, deletedAt: null }],
      },
    ] as Question[];
    const impacts = buildIdeaImpacts(questions, undefined, null);
    expect(impacts).toHaveProperty('i1');
  });
});
