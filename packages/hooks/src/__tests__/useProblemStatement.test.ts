import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProblemStatement } from '../useProblemStatement';
import type { Hypothesis } from '@variscout/core';

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h-1',
    text: 'Test hypothesis',
    status: 'supported',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    causeRole: 'suspected-cause',
    factor: 'Shift',
    level: 'Night',
    evidence: { etaSquared: 0.34 },
    ...overrides,
  };
}

describe('useProblemStatement', () => {
  it('returns isReady=true when outcome and suspected causes exist', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        hypotheses: [makeHypothesis()],
      })
    );
    expect(result.current.isReady).toBe(true);
    expect(result.current.generatedDraft).toBeTruthy();
  });

  it('returns isReady=false when no outcome', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: null,
        hypotheses: [makeHypothesis()],
      })
    );
    expect(result.current.isReady).toBe(false);
    expect(result.current.generatedDraft).toBeNull();
  });

  it('returns isReady=false when no suspected causes', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        hypotheses: [makeHypothesis({ causeRole: 'ruled-out' })],
      })
    );
    expect(result.current.isReady).toBe(false);
  });

  it('filters hypotheses without factor', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        hypotheses: [makeHypothesis({ factor: undefined })],
      })
    );
    expect(result.current.isReady).toBe(false);
  });

  it('generate() populates draft', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        hypotheses: [makeHypothesis()],
      })
    );
    expect(result.current.draft).toBeNull();
    act(() => result.current.generate());
    expect(result.current.draft).toBeTruthy();
    expect(result.current.draft).toContain('Fill Weight');
  });

  it('accept() calls onStatementChange and clears draft', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        hypotheses: [makeHypothesis()],
        onStatementChange: onChange,
      })
    );
    act(() => result.current.generate());
    const draftText = result.current.draft!;
    act(() => result.current.accept(draftText));
    expect(onChange).toHaveBeenCalledWith(draftText);
    expect(result.current.draft).toBeNull();
  });

  it('dismiss() clears draft without calling onStatementChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        hypotheses: [makeHypothesis()],
        onStatementChange: onChange,
      })
    );
    act(() => result.current.generate());
    act(() => result.current.dismiss());
    expect(result.current.draft).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('includes Cpk values when provided', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        currentCpk: 0.62,
        targetCpk: 1.33,
        hypotheses: [makeHypothesis()],
      })
    );
    expect(result.current.generatedDraft).toContain('0.62');
    expect(result.current.generatedDraft).toContain('1.33');
  });

  it('prefers rSquaredAdj over etaSquared', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        hypotheses: [
          makeHypothesis({
            evidence: { rSquaredAdj: 0.5, etaSquared: 0.3 },
          }),
        ],
      })
    );
    expect(result.current.generatedDraft).toContain('50%');
  });
});
