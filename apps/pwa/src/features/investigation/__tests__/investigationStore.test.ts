import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';
import type { Question } from '@variscout/core';

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
});
