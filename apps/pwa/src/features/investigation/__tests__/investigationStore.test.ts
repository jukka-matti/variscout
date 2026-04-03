import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';
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
  it('syncQuestions updates questions', () => {
    const questions = [makeQuestion({ text: 'Shift effect' })];
    useInvestigationStore.getState().syncQuestions(questions);
    expect(useInvestigationStore.getState().questions).toHaveLength(1);
  });

  it('syncQuestionsMap updates display map', () => {
    const map = { 'q-1': { text: 'Test', status: 'answered', factor: 'Shift' } };
    useInvestigationStore.getState().syncQuestionsMap(map);
    expect(useInvestigationStore.getState().questionsMap).toEqual(map);
  });

  it('setProjectionTarget sets and clears', () => {
    const target = {
      questionId: 'q-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      questionText: 'Shift effect',
    };
    useInvestigationStore.getState().setProjectionTarget(target);
    expect(useInvestigationStore.getState().projectionTarget).toEqual(target);
    useInvestigationStore.getState().setProjectionTarget(null);
    expect(useInvestigationStore.getState().projectionTarget).toBeNull();
  });

  it('expandToQuestion sets expanded ID', () => {
    useInvestigationStore.getState().expandToQuestion('q-42');
    expect(useInvestigationStore.getState().expandedQuestionId).toBe('q-42');
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
  });
});
