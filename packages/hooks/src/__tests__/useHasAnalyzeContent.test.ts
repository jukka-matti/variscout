import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getAnalyzeInitialState, useAnalyzeStore } from '@variscout/stores';
import type { Question, Hypothesis } from '@variscout/core';
import { useHasAnalyzeContent } from '../useHasAnalyzeContent';

const sampleHub: Hypothesis = {
  id: 'hub-1',
  name: 'Test hub',
  synthesis: '',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  createdAt: 1714000000000,
  updatedAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
};

const sampleQuestion: Question = {
  id: 'q-1',
  text: 'Test question',
  status: 'open',
  linkedFindingIds: [],
  createdAt: 1714000000000,
  updatedAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
};

describe('useHasAnalyzeContent', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('returns false when graph is empty and findings count is 0', () => {
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 0 }));
    expect(result.current).toBe(false);
  });

  it('returns true when at least one hub exists', () => {
    useAnalyzeStore.setState({ hypotheses: [sampleHub] });
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 0 }));
    expect(result.current).toBe(true);
  });

  it('returns true when at least one question exists', () => {
    useAnalyzeStore.setState({ questions: [sampleQuestion] });
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 0 }));
    expect(result.current).toBe(true);
  });

  it('returns false when only findings count is > 0 because overlay has no standalone finding visual', () => {
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 3 }));
    expect(result.current).toBe(false);
  });
});
