import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuestionReactivity } from '../useQuestionReactivity';
import type { Question } from '@variscout/core';

const makeQuestion = (factor: string, status = 'open' as const): Question => ({
  id: `q-${factor}`,
  text: `Does ${factor} affect outcome?`,
  factor,
  status,
  linkedFindingIds: [],
  createdAt: 1714000000000,
  updatedAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
  questionSource: 'factor-intel',
});

describe('useQuestionReactivity', () => {
  it('returns null when no active factor', () => {
    const { result } = renderHook(() =>
      useQuestionReactivity({
        questions: [makeQuestion('Shift')],
        activeFactor: null,
      })
    );
    expect(result.current.activeQuestionId).toBeNull();
  });

  it('returns matching question id when factor is active', () => {
    const { result } = renderHook(() =>
      useQuestionReactivity({
        questions: [makeQuestion('Shift'), makeQuestion('Head')],
        activeFactor: 'Shift',
      })
    );
    expect(result.current.activeQuestionId).toBe('q-Shift');
  });

  it('returns null when active factor has no matching question', () => {
    const { result } = renderHook(() =>
      useQuestionReactivity({
        questions: [makeQuestion('Shift')],
        activeFactor: 'Unknown',
      })
    );
    expect(result.current.activeQuestionId).toBeNull();
  });
});
