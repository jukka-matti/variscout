import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionGeneration } from '../useQuestionGeneration';
import type { Question, DataRow } from '@variscout/core';
import { createQuestion } from '@variscout/core';

// Mock @variscout/core/stats to avoid real computation in tests
vi.mock('@variscout/core/stats', () => ({
  computeBestSubsets: vi.fn(() => ({
    subsets: [
      { factors: ['Shift'], factorCount: 1, rSquaredAdj: 0.34 },
      { factors: ['Machine'], factorCount: 1, rSquaredAdj: 0.18 },
      { factors: ['Operator'], factorCount: 1, rSquaredAdj: 0.03 },
    ],
    totalFactors: 3,
    n: 100,
  })),
  computeMainEffects: vi.fn(() => ({
    factors: [
      {
        factor: 'Shift',
        etaSquared: 0.34,
        worstLevel: 'Night',
        bestLevel: 'Day',
        effectRange: 2.5,
        pValue: 0.001,
      },
    ],
    significantCount: 1,
  })),
  computeInteractionEffects: vi.fn(() => ({
    interactions: [],
    significantCount: 0,
  })),
  generateQuestionsFromRanking: vi.fn(() => [
    {
      text: 'Does Shift explain variation?',
      factors: ['Shift'],
      rSquaredAdj: 0.34,
      autoAnswered: false,
      source: 'factor-intel' as const,
      type: 'single-factor' as const,
    },
    {
      text: 'Does Machine explain variation?',
      factors: ['Machine'],
      rSquaredAdj: 0.18,
      autoAnswered: false,
      source: 'factor-intel' as const,
      type: 'single-factor' as const,
    },
    {
      text: 'Does Operator matter?',
      factors: ['Operator'],
      rSquaredAdj: 0.03,
      autoAnswered: true,
      autoStatus: 'ruled-out' as const,
      source: 'factor-intel' as const,
      type: 'single-factor' as const,
    },
  ]),
  generateFollowUpQuestions: vi.fn(() => []),
}));

function makeData(n: number): DataRow[] {
  return Array.from({ length: n }, (_, i) => ({
    value: 10 + Math.random() * 5,
    Shift: i % 2 === 0 ? 'Day' : 'Night',
    Machine: `M${(i % 3) + 1}`,
  }));
}

function makeMockQuestionsState(initialQuestions: Question[] = []) {
  let questions = [...initialQuestions];
  return {
    get questions() {
      return questions;
    },
    generateInitialQuestions: vi.fn(generatedQuestions => {
      const created: Question[] = generatedQuestions.map(
        (q: {
          text: string;
          factors: string[];
          rSquaredAdj: number;
          autoAnswered?: boolean;
          source: string;
        }) => ({
          ...createQuestion(q.text, q.factors.length === 1 ? q.factors[0] : undefined),
          questionSource: q.source,
          evidence: { rSquaredAdj: q.rSquaredAdj },
          status: q.autoAnswered ? 'ruled-out' : 'open',
        })
      );
      questions = [...questions, ...created];
      return created;
    }),
    setFocusedQuestion: vi.fn(),
  };
}

describe('useQuestionGeneration', () => {
  describe('hasFactorIntelligence', () => {
    it('returns false when fewer than 2 factors', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift'],
          questionsState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
      expect(result.current.bestSubsets).toBeNull();
      expect(result.current.questions).toEqual([]);
    });

    it('returns false when no outcome', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: null,
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
    });

    it('returns false when no data', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: [],
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
    });

    it('returns false when enabled is false', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
          enabled: false,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
      expect(result.current.bestSubsets).toBeNull();
    });

    it('returns true with ≥2 factors + outcome + data', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(true);
      expect(result.current.bestSubsets).not.toBeNull();
    });
  });

  describe('question generation', () => {
    it('generates questions from Factor Intelligence on first render', () => {
      const state = makeMockQuestionsState();
      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      expect(state.generateInitialQuestions).toHaveBeenCalledTimes(1);
    });

    it('does not regenerate on subsequent renders with same data', () => {
      const state = makeMockQuestionsState();
      const data = makeData(50);
      const { rerender } = renderHook(() =>
        useQuestionGeneration({
          filteredData: data,
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      // Force a rerender
      rerender();

      // Should only have been called once (fingerprint prevents re-generation)
      expect(state.generateInitialQuestions).toHaveBeenCalledTimes(1);
    });

    it('skips generation when persisted questions already exist', () => {
      const existingQuestion = {
        ...createQuestion('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
        evidence: { rSquaredAdj: 0.34 },
      };
      const state = makeMockQuestionsState([existingQuestion]);

      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      // Should NOT generate — questions already loaded from persistence
      expect(state.generateInitialQuestions).not.toHaveBeenCalled();
    });

    it('filters questions to factor-intel source only', () => {
      const manualQuestion = createQuestion('Manual theory', 'Operator');
      const fiQuestion = {
        ...createQuestion('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };
      const state = makeMockQuestionsState([manualQuestion, fiQuestion]);

      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      // Should only include the factor-intel question, not the manual one
      expect(result.current.questions).toHaveLength(1);
      expect(result.current.questions[0].questionSource).toBe('factor-intel');
    });
  });

  describe('handleQuestionClick', () => {
    it('sets factorRequest with factor and incrementing seq', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      const question = {
        ...createQuestion('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };

      act(() => {
        result.current.handleQuestionClick(question);
      });

      expect(result.current.factorRequest).toEqual({ factor: 'Shift', seq: 1 });
      expect(state.setFocusedQuestion).toHaveBeenCalledWith(question.id);
    });

    it('increments seq on repeated clicks (same factor still triggers)', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      const question = {
        ...createQuestion('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };

      act(() => result.current.handleQuestionClick(question));
      expect(result.current.factorRequest?.seq).toBe(1);

      act(() => result.current.handleQuestionClick(question));
      expect(result.current.factorRequest?.seq).toBe(2);
      expect(result.current.factorRequest?.factor).toBe('Shift');
    });

    it('does not set factorRequest for questions without a factor', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
        })
      );

      const question = {
        ...createQuestion('Is the process in control?'),
        questionSource: 'factor-intel' as const,
      };

      act(() => result.current.handleQuestionClick(question));

      expect(result.current.factorRequest).toBeNull();
      // Should still set focused question
      expect(state.setFocusedQuestion).toHaveBeenCalledWith(question.id);
    });
  });

  describe('isFollowUpAlreadyPresent (via deduplication)', () => {
    it('returns empty questions when not enough factors', () => {
      const state = makeMockQuestionsState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift'],
          questionsState: state,
        })
      );

      expect(result.current.questions).toEqual([]);
    });
  });
});
