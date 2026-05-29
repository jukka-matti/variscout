import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { useScopeIsEmpty } from '../useScopeIsEmpty';

describe('useScopeIsEmpty', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('returns true when no scope fields are set', () => {
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(true);
  });

  it('returns false when yColumn is set', () => {
    useAnalysisScopeStore.getState().setY('yield');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when boxplotFactor is set', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when stepId is set', () => {
    useAnalysisScopeStore.getState().setStepId('step-1');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });

  it('returns false when categoricalFilters is non-empty', () => {
    useAnalysisScopeStore.getState().addCategoricalValue('vessel', 'A');
    const { result } = renderHook(() => useScopeIsEmpty());
    expect(result.current).toBe(false);
  });
});
