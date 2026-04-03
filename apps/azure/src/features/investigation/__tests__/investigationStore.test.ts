import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';
import type { SuspectedCause } from '@variscout/core';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useInvestigationStore.setState({
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
      const s = useInvestigationStore.getState();
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
      useInvestigationStore.getState().syncQuestions(questions as never[]);
      expect(useInvestigationStore.getState().questions).toHaveLength(2);
      expect(useInvestigationStore.getState().questions[0]).toEqual(questions[0]);
    });

    it('clears with empty array', () => {
      useInvestigationStore.getState().syncQuestions([{ id: 'q1' }] as never[]);
      useInvestigationStore.getState().syncQuestions([]);
      expect(useInvestigationStore.getState().questions).toEqual([]);
    });

    it('overwrites previous questions', () => {
      useInvestigationStore.getState().syncQuestions([{ id: 'q1' }] as never[]);
      useInvestigationStore.getState().syncQuestions([{ id: 'q2' }, { id: 'q3' }] as never[]);
      expect(useInvestigationStore.getState().questions).toHaveLength(2);
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
      useInvestigationStore.getState().syncQuestionsMap(map as never);
      const result = useInvestigationStore.getState().questionsMap;
      expect(result).toHaveProperty('q1');
      expect(result).toHaveProperty('q2');
    });

    it('clears with empty object', () => {
      useInvestigationStore
        .getState()
        .syncQuestionsMap({ q1: { text: 't', status: 's' } } as never);
      useInvestigationStore.getState().syncQuestionsMap({});
      expect(useInvestigationStore.getState().questionsMap).toEqual({});
    });
  });

  describe('syncIdeaImpacts', () => {
    it('sets idea impacts record', () => {
      const impacts = { idea1: 'high' as const, idea2: 'medium' as const };
      useInvestigationStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationStore.getState().ideaImpacts).toEqual(impacts);
    });

    it('handles undefined values', () => {
      const impacts: Record<string, 'low' | 'medium' | 'high' | undefined> = {
        idea1: undefined,
        idea2: 'low',
      };
      useInvestigationStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationStore.getState().ideaImpacts.idea1).toBeUndefined();
      expect(useInvestigationStore.getState().ideaImpacts.idea2).toBe('low');
    });

    it('clears with empty object', () => {
      useInvestigationStore.getState().syncIdeaImpacts({ idea1: 'high' });
      useInvestigationStore.getState().syncIdeaImpacts({});
      expect(useInvestigationStore.getState().ideaImpacts).toEqual({});
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
      useInvestigationStore.getState().setProjectionTarget(target);
      expect(useInvestigationStore.getState().projectionTarget).toEqual(target);
    });

    it('clears with null', () => {
      useInvestigationStore.getState().setProjectionTarget({
        questionId: 'q1',
        ideaId: 'i1',
        ideaText: 'Fix',
        questionText: 'Root cause',
      });
      useInvestigationStore.getState().setProjectionTarget(null);
      expect(useInvestigationStore.getState().projectionTarget).toBeNull();
    });

    it('overwrites previous target', () => {
      useInvestigationStore.getState().setProjectionTarget({
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
      useInvestigationStore.getState().setProjectionTarget(newTarget);
      expect(useInvestigationStore.getState().projectionTarget).toEqual(newTarget);
    });
  });

  describe('expandToQuestion', () => {
    it('sets expanded question id', () => {
      useInvestigationStore.getState().expandToQuestion('q1');
      expect(useInvestigationStore.getState().expandedQuestionId).toBe('q1');
    });

    it('clears with null', () => {
      useInvestigationStore.getState().expandToQuestion('q1');
      useInvestigationStore.getState().expandToQuestion(null);
      expect(useInvestigationStore.getState().expandedQuestionId).toBeNull();
    });

    it('changes to different question', () => {
      useInvestigationStore.getState().expandToQuestion('q1');
      useInvestigationStore.getState().expandToQuestion('q2');
      expect(useInvestigationStore.getState().expandedQuestionId).toBe('q2');
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
      useInvestigationStore.getState().syncSuspectedCauses([hub]);
      expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(1);
      expect(useInvestigationStore.getState().suspectedCauses[0].name).toBe('Nozzle wear');
    });

    it('should clear suspected causes', () => {
      useInvestigationStore.getState().syncSuspectedCauses([]);
      expect(useInvestigationStore.getState().suspectedCauses).toEqual([]);
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
      useInvestigationStore.getState().syncSuspectedCauses([hub1]);
      useInvestigationStore.getState().syncSuspectedCauses([hub1, hub2]);
      expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(2);
      expect(useInvestigationStore.getState().suspectedCauses[1].name).toBe('Second cause');
    });
  });
});
