import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getAnalyzeInitialState, useAnalyzeStore } from '@variscout/stores';
import type { Hypothesis } from '@variscout/core';
import { useHasAnalyzeContent } from '../useHasAnalyzeContent';

const sampleHub: Hypothesis = {
  id: 'hub-1',
  name: 'Test hub',
  synthesis: '',
  status: 'proposed',
  findingIds: [],
  createdAt: 1714000000000,
  updatedAt: 1714000000000,
  deletedAt: null,
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

  it('returns true when only findings count is > 0 so mobile can open Wall arrival', () => {
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 3 }));
    expect(result.current).toBe(true);
  });

  it('returns true when both hub and findings exist', () => {
    useAnalyzeStore.setState({ hypotheses: [sampleHub] });
    const { result } = renderHook(() => useHasAnalyzeContent({ findingsCount: 2 }));
    expect(result.current).toBe(true);
  });
});
