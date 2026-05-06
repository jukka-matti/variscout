import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProcessContext, Question, SuspectedCause } from '@variscout/core';
import { useCurrentUnderstanding } from '../useCurrentUnderstanding';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    text: 'Does Shift explain the high fill weight?',
    status: 'answered',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    causeRole: 'suspected-cause',
    factor: 'Shift',
    level: 'Night',
    evidence: { etaSquared: 0.34 },
    ...overrides,
  };
}

function makeHub(overrides: Partial<SuspectedCause> = {}): SuspectedCause {
  return {
    id: 'hub-1',
    name: 'Changeover setup',
    synthesis: 'The first hour after changeover shows the highest mean shift.',
    questionIds: ['q-1'],
    findingIds: [],
    selectedForImprovement: false,
    status: 'suspected',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

describe('useCurrentUnderstanding', () => {
  it('derives current understanding from process context, stats, live statement, and hubs', () => {
    const processContext: ProcessContext = {
      issueStatement: 'Fill weight is too high on Line 3.',
      problemStatement: 'Mean fill weight is high on Line 3 night shift.',
      targetMetric: 'cpk',
      targetValue: 1.33,
    };

    const { result } = renderHook(() =>
      useCurrentUnderstanding({
        processContext,
        stats: { cpk: 0.87, mean: 503.1, stdDev: 2.7 },
        problemStatement: {
          liveStatement: 'Draft: mean fill weight is high on Line 3 night shift.',
          draft: null,
          generatedDraft: null,
        },
        questions: [makeQuestion()],
        suspectedCauseHubs: [makeHub()],
      })
    );

    expect(result.current.problemCondition).toEqual({
      metric: 'cpk',
      currentValue: 0.87,
      targetValue: 1.33,
      targetDirection: 'maximize',
      status: 'below-target',
      summary: 'Cpk is 0.87 against target 1.33.',
    });
    expect(result.current.currentUnderstanding?.approvedProblemStatement).toBe(
      'Mean fill weight is high on Line 3 night shift.'
    );
    expect(result.current.currentUnderstanding?.liveProblemStatementDraft).toBe(
      'Draft: mean fill weight is high on Line 3 night shift.'
    );
    expect(result.current.currentUnderstanding?.activeSuspectedMechanisms).toEqual([
      {
        id: 'hub-1',
        name: 'Changeover setup',
        synthesis: 'The first hour after changeover shows the highest mean shift.',
      },
    ]);
    expect(result.current.currentUnderstanding?.summary).toContain(
      'Problem condition: Cpk is 0.87 against target 1.33.'
    );
  });

  it('does not call the update callback again when derived text and condition are unchanged', () => {
    const onCurrentUnderstandingChange = vi.fn();
    const processContext: ProcessContext = {
      issueStatement: 'Fill weight is too high.',
      targetMetric: 'cpk',
      targetValue: 1.33,
    };

    const { result, rerender } = renderHook(
      ({ context }) =>
        useCurrentUnderstanding({
          processContext: context,
          stats: { cpk: 0.87 },
          questions: [makeQuestion()],
          onCurrentUnderstandingChange,
        }),
      { initialProps: { context: processContext } }
    );

    expect(onCurrentUnderstandingChange).toHaveBeenCalledTimes(1);

    rerender({
      context: {
        ...processContext,
        currentUnderstanding: result.current.currentUnderstanding,
        problemCondition: result.current.problemCondition,
      },
    });

    expect(onCurrentUnderstandingChange).toHaveBeenCalledTimes(1);

    rerender({
      context: {
        ...processContext,
        issueStatement: 'Fill weight is too high after changeover.',
        currentUnderstanding: result.current.currentUnderstanding,
        problemCondition: result.current.problemCondition,
      },
    });

    expect(onCurrentUnderstandingChange).toHaveBeenCalledTimes(2);
  });

  it('uses suspected-cause questions as mechanisms before hubs are named', () => {
    const { result } = renderHook(() =>
      useCurrentUnderstanding({
        processContext: {
          issueStatement: 'Yield dips at night.',
          targetMetric: 'yield',
          targetValue: 98,
        },
        stats: { yield: 92 },
        questions: [
          makeQuestion({
            factor: 'Shift',
            level: 'Night',
            text: 'Night shift has lower yield',
            evidence: { rSquaredAdj: 0.22 },
          }),
        ],
      })
    );

    expect(result.current.currentUnderstanding?.activeSuspectedMechanisms).toEqual([
      {
        id: 'q-1',
        name: 'Shift = Night',
        synthesis: 'Night shift has lower yield',
        evidenceLabel: 'R2adj 22%',
      },
    ]);
  });
});
