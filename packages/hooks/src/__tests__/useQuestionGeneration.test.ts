import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  generateChannelRankingQuestions: vi.fn(() => [
    {
      text: 'Why does Head 1 have Cpk=0.85?',
      factors: ['Head 1'],
      rSquaredAdj: 0.85,
      autoAnswered: false,
      source: 'factor-intel' as const,
      type: 'single-factor' as const,
    },
  ]),
}));

/**
 * Deterministic PRNG (mulberry32) — replaces Math.random for reproducible tests.
 * @see packages/core/src/__tests__/helpers/stressDataGenerator.ts for the canonical implementation.
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeData(n: number): DataRow[] {
  const rng = mulberry32(42);
  return Array.from({ length: n }, (_, i) => ({
    value: 10 + rng() * 5,
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
          ...createQuestion(
            q.text,
            'inv-test-001',
            q.factors.length === 1 ? q.factors[0] : undefined
          ),
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
        ...createQuestion('Does Shift explain variation?', 'general-unassigned', 'Shift'),
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
        ...createQuestion('Does Shift explain variation?', 'general-unassigned', 'Shift'),
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
        ...createQuestion('Is the process in control?', 'inv-test-001'),
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

  describe('performance channel ranking routing', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    function makeChannelData() {
      return [
        { name: 'Head 1', cpk: 0.85 },
        { name: 'Head 2', cpk: 1.42 },
      ];
    }

    it('calls generateChannelRankingQuestions when mode is performance and channelData is provided', async () => {
      const { generateChannelRankingQuestions } = await import('@variscout/core/stats');
      const state = makeMockQuestionsState();

      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
          mode: 'performance',
          channelData: makeChannelData(),
        })
      );

      expect(generateChannelRankingQuestions).toHaveBeenCalledWith(makeChannelData());
      expect(state.generateInitialQuestions).toHaveBeenCalledTimes(1);
    });

    it('falls back to generateQuestionsFromRanking when mode is performance but channelData is empty', async () => {
      const { generateChannelRankingQuestions } = await import('@variscout/core/stats');
      const { generateQuestionsFromRanking } = await import('@variscout/core/stats');
      const state = makeMockQuestionsState();

      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
          mode: 'performance',
          channelData: [],
        })
      );

      expect(generateChannelRankingQuestions).not.toHaveBeenCalled();
      expect(generateQuestionsFromRanking).toHaveBeenCalled();
    });

    it('ignores channelData when mode is not performance', async () => {
      const { generateChannelRankingQuestions } = await import('@variscout/core/stats');
      const { generateQuestionsFromRanking } = await import('@variscout/core/stats');
      const state = makeMockQuestionsState();

      renderHook(() =>
        useQuestionGeneration({
          filteredData: makeData(50),
          outcome: 'value',
          factors: ['Shift', 'Machine'],
          questionsState: state,
          mode: 'standard',
          channelData: makeChannelData(),
        })
      );

      expect(generateChannelRankingQuestions).not.toHaveBeenCalled();
      expect(generateQuestionsFromRanking).toHaveBeenCalled();
    });
  });
});
