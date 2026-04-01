import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionGeneration } from '../useQuestionGeneration';
import type { Hypothesis, DataRow } from '@variscout/core';
import { createHypothesis } from '@variscout/core';

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

function makeMockHypothesesState(initialHypotheses: Hypothesis[] = []) {
  let hypotheses = [...initialHypotheses];
  return {
    get hypotheses() {
      return hypotheses;
    },
    generateInitialQuestions: vi.fn(questions => {
      const created: Hypothesis[] = questions.map(
        (q: {
          text: string;
          factors: string[];
          rSquaredAdj: number;
          autoAnswered?: boolean;
          source: string;
        }) => ({
          ...createHypothesis(q.text, q.factors.length === 1 ? q.factors[0] : undefined),
          questionSource: q.source,
          evidence: { rSquaredAdj: q.rSquaredAdj },
          status: q.autoAnswered ? 'contradicted' : 'untested',
        })
      );
      hypotheses = [...hypotheses, ...created];
      return created;
    }),
    setFocusedQuestion: vi.fn(),
  };
}

describe('useQuestionGeneration', () => {
  describe('hasFactorIntelligence', () => {
    it('returns false when fewer than 2 factors', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift'],
          hypothesesState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
      expect(result.current.bestSubsets).toBeNull();
      expect(result.current.questions).toEqual([]);
    });

    it('returns false when no outcome', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: null,
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
    });

    it('returns false when no data', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: [],
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
    });

    it('returns false when enabled is false', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
          enabled: false,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(false);
      expect(result.current.bestSubsets).toBeNull();
    });

    it('returns true with ≥2 factors + outcome + data', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      expect(result.current.hasFactorIntelligence).toBe(true);
      expect(result.current.bestSubsets).not.toBeNull();
    });
  });

  describe('question generation', () => {
    it('generates questions from Factor Intelligence on first render', () => {
      const state = makeMockHypothesesState();
      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      expect(state.generateInitialQuestions).toHaveBeenCalledTimes(1);
    });

    it('does not regenerate on subsequent renders with same data', () => {
      const state = makeMockHypothesesState();
      const data = makeData(50);
      const { rerender } = renderHook(() =>
        useQuestionGeneration({
          filteredData: data,
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      // Force a rerender
      rerender();

      // Should only have been called once (fingerprint prevents re-generation)
      expect(state.generateInitialQuestions).toHaveBeenCalledTimes(1);
    });

    it('skips generation when persisted questions already exist', () => {
      const existingQuestion = {
        ...createHypothesis('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
        evidence: { rSquaredAdj: 0.34 },
      };
      const state = makeMockHypothesesState([existingQuestion]);

      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      // Should NOT generate — questions already loaded from persistence
      expect(state.generateInitialQuestions).not.toHaveBeenCalled();
    });

    it('filters questions to factor-intel source only', () => {
      const manualHypothesis = createHypothesis('Manual theory', 'Operator');
      const fiQuestion = {
        ...createHypothesis('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };
      const state = makeMockHypothesesState([manualHypothesis, fiQuestion]);

      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      // Should only include the factor-intel question, not the manual one
      expect(result.current.questions).toHaveLength(1);
      expect(result.current.questions[0].questionSource).toBe('factor-intel');
    });
  });

  describe('handleQuestionClick', () => {
    it('sets factorRequest with factor and incrementing seq', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      const question = {
        ...createHypothesis('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };

      act(() => {
        result.current.handleQuestionClick(question);
      });

      expect(result.current.factorRequest).toEqual({ factor: 'Shift', seq: 1 });
      expect(state.setFocusedQuestion).toHaveBeenCalledWith(question.id);
    });

    it('increments seq on repeated clicks (same factor still triggers)', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      const question = {
        ...createHypothesis('Does Shift explain variation?', 'Shift'),
        questionSource: 'factor-intel' as const,
      };

      act(() => result.current.handleQuestionClick(question));
      expect(result.current.factorRequest?.seq).toBe(1);

      act(() => result.current.handleQuestionClick(question));
      expect(result.current.factorRequest?.seq).toBe(2);
      expect(result.current.factorRequest?.factor).toBe('Shift');
    });

    it('does not set factorRequest for questions without a factor', () => {
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          hypothesesState: state,
        })
      );

      const question = {
        ...createHypothesis('Is the process in control?'),
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
      const state = makeMockHypothesesState();
      const { result } = renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift'],
          hypothesesState: state,
        })
      );

      expect(result.current.questions).toEqual([]);
    });
  });
});
