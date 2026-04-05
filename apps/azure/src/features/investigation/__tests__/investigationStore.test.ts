import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationFeatureStore } from '../investigationStore';
import type { SuspectedCause } from '@variscout/core';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useInvestigationFeatureStore.setState({
    questions: [],
    questionsMap: {},
    ideaImpacts: {},
    projectionTarget: null,
    expandedQuestionId: null,
    suspectedCauses: [],
  });
});

describe('investigationStore', () => {
  describe('initial state', () => {
    it('has correct defaults for all 6 fields', () => {
      const s = useInvestigationFeatureStore.getState();
      expect(s.questions).toEqual([]);
      expect(s.questionsMap).toEqual({});
      expect(s.ideaImpacts).toEqual({});
      expect(s.projectionTarget).toBeNull();
      expect(s.expandedQuestionId).toBeNull();
      expect(s.suspectedCauses).toEqual([]);
    });
  });

  describe('syncQuestions', () => {
    it('sets questions array', () => {
      const questions = [
        { id: 'q1', text: 'Head 3 causes variation', status: 'investigating' },
        { id: 'q2', text: 'Temperature drift', status: 'answered' },
      ];
      useInvestigationFeatureStore.getState().syncQuestions(questions as never[]);
      expect(useInvestigationFeatureStore.getState().questions).toHaveLength(2);
      expect(useInvestigationFeatureStore.getState().questions[0]).toEqual(questions[0]);
    });

    it('clears with empty array', () => {
      useInvestigationFeatureStore.getState().syncQuestions([{ id: 'q1' }] as never[]);
      useInvestigationFeatureStore.getState().syncQuestions([]);
      expect(useInvestigationFeatureStore.getState().questions).toEqual([]);
    });

    it('overwrites previous questions', () => {
      useInvestigationFeatureStore.getState().syncQuestions([{ id: 'q1' }] as never[]);
      useInvestigationFeatureStore
        .getState()
        .syncQuestions([{ id: 'q2' }, { id: 'q3' }] as never[]);
      expect(useInvestigationFeatureStore.getState().questions).toHaveLength(2);
    });
  });

  describe('syncQuestionsMap', () => {
    it('sets map of question display data', () => {
      const map = {
        q1: {
          text: 'Head 3 causes variation',
          status: 'investigating',
          factor: 'Head',
          level: '3',
        },
        q2: {
          text: 'Temperature drift',
          status: 'answered',
          causeRole: 'suspected-cause' as const,
        },
      };
      useInvestigationFeatureStore.getState().syncQuestionsMap(map as never);
      const result = useInvestigationFeatureStore.getState().questionsMap;
      expect(result).toHaveProperty('q1');
      expect(result).toHaveProperty('q2');
    });

    it('clears with empty object', () => {
      useInvestigationFeatureStore
        .getState()
        .syncQuestionsMap({ q1: { text: 't', status: 's' } } as never);
      useInvestigationFeatureStore.getState().syncQuestionsMap({});
      expect(useInvestigationFeatureStore.getState().questionsMap).toEqual({});
    });
  });

  describe('syncIdeaImpacts', () => {
    it('sets idea impacts record', () => {
      const impacts = { idea1: 'high' as const, idea2: 'medium' as const };
      useInvestigationFeatureStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationFeatureStore.getState().ideaImpacts).toEqual(impacts);
    });

    it('handles undefined values', () => {
      const impacts: Record<string, 'low' | 'medium' | 'high' | undefined> = {
        idea1: undefined,
        idea2: 'low',
      };
      useInvestigationFeatureStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationFeatureStore.getState().ideaImpacts.idea1).toBeUndefined();
      expect(useInvestigationFeatureStore.getState().ideaImpacts.idea2).toBe('low');
    });

    it('clears with empty object', () => {
      useInvestigationFeatureStore.getState().syncIdeaImpacts({ idea1: 'high' });
      useInvestigationFeatureStore.getState().syncIdeaImpacts({});
      expect(useInvestigationFeatureStore.getState().ideaImpacts).toEqual({});
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

  describe('syncSuspectedCauses', () => {
    it('should sync suspected causes', () => {
      const hub: SuspectedCause = {
        id: 'h1',
        name: 'Nozzle wear',
        synthesis: 'test',
        questionIds: ['q1'],
        findingIds: [],
        status: 'suspected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useInvestigationFeatureStore.getState().syncSuspectedCauses([hub]);
      expect(useInvestigationFeatureStore.getState().suspectedCauses).toHaveLength(1);
      expect(useInvestigationFeatureStore.getState().suspectedCauses[0].name).toBe('Nozzle wear');
    });

    it('should clear suspected causes', () => {
      useInvestigationFeatureStore.getState().syncSuspectedCauses([]);
      expect(useInvestigationFeatureStore.getState().suspectedCauses).toEqual([]);
    });

    it('overwrites previous hubs', () => {
      const hub1: SuspectedCause = {
        id: 'h1',
        name: 'First cause',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'suspected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const hub2: SuspectedCause = {
        id: 'h2',
        name: 'Second cause',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useInvestigationFeatureStore.getState().syncSuspectedCauses([hub1]);
      useInvestigationFeatureStore.getState().syncSuspectedCauses([hub1, hub2]);
      expect(useInvestigationFeatureStore.getState().suspectedCauses).toHaveLength(2);
      expect(useInvestigationFeatureStore.getState().suspectedCauses[1].name).toBe('Second cause');
    });
  });
});
