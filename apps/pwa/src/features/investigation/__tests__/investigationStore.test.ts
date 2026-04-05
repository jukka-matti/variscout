import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationFeatureStore } from '../investigationStore';
import type { Question, SuspectedCause } from '@variscout/core';

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: `q-${Math.random()}`,
  text: 'test question',
  status: 'open',
  linkedFindingIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

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
  it('syncQuestions updates questions', () => {
    const questions = [makeQuestion({ text: 'Shift effect' })];
    useInvestigationFeatureStore.getState().syncQuestions(questions);
    expect(useInvestigationFeatureStore.getState().questions).toHaveLength(1);
  });

  it('syncQuestionsMap updates display map', () => {
    const map = { 'q-1': { text: 'Test', status: 'answered', factor: 'Shift' } };
    useInvestigationFeatureStore.getState().syncQuestionsMap(map);
    expect(useInvestigationFeatureStore.getState().questionsMap).toEqual(map);
  });

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
  });
});
