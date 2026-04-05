import { describe, it, expect, beforeEach } from 'vitest';
import {
  useInvestigationFeatureStore,
  buildQuestionsMap,
  buildIdeaImpacts,
} from '../investigationStore';
import type { Question } from '@variscout/core';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useInvestigationFeatureStore.setState({
    projectionTarget: null,
    expandedQuestionId: null,
  });
});

describe('investigationStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useInvestigationFeatureStore.getState();
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
      useInvestigationFeatureStore.getState().setProjectionTarget(target);
      expect(useInvestigationFeatureStore.getState().projectionTarget).toEqual(target);
    });

    it('clears with null', () => {
      useInvestigationFeatureStore.getState().setProjectionTarget({
        questionId: 'q1',
        ideaId: 'i1',
        ideaText: 'Fix',
        questionText: 'Root cause',
      });
      useInvestigationFeatureStore.getState().setProjectionTarget(null);
      expect(useInvestigationFeatureStore.getState().projectionTarget).toBeNull();
    });

    it('overwrites previous target', () => {
      useInvestigationFeatureStore.getState().setProjectionTarget({
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
      useInvestigationFeatureStore.getState().setProjectionTarget(newTarget);
      expect(useInvestigationFeatureStore.getState().projectionTarget).toEqual(newTarget);
    });
  });

  describe('expandToQuestion', () => {
    it('sets expanded question id', () => {
      useInvestigationFeatureStore.getState().expandToQuestion('q1');
      expect(useInvestigationFeatureStore.getState().expandedQuestionId).toBe('q1');
    });

    it('clears with null', () => {
      useInvestigationFeatureStore.getState().expandToQuestion('q1');
      useInvestigationFeatureStore.getState().expandToQuestion(null);
      expect(useInvestigationFeatureStore.getState().expandedQuestionId).toBeNull();
    });

    it('changes to different question', () => {
      useInvestigationFeatureStore.getState().expandToQuestion('q1');
      useInvestigationFeatureStore.getState().expandToQuestion('q2');
      expect(useInvestigationFeatureStore.getState().expandedQuestionId).toBe('q2');
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
        ideas: [{ id: 'i1', text: 'Fix it', createdAt: '' }],
      },
    ] as Question[];
    const impacts = buildIdeaImpacts(questions, undefined, null);
    expect(impacts).toHaveProperty('i1');
  });
});
