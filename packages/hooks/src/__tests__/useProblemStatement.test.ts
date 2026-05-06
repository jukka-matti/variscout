import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProblemStatement } from '../useProblemStatement';
import type { Question } from '@variscout/core';
import type { LocationFactor } from '../useProblemStatement';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'h-1',
    text: 'Test question',
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

describe('useProblemStatement', () => {
  it('returns isReady=true when outcome and suspected causes exist', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        questions: [makeQuestion()],
      })
    );
    expect(result.current.isReady).toBe(true);
    expect(result.current.generatedDraft).toBeTruthy();
  });

  it('returns isReady=false when no outcome', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: null,
        questions: [makeQuestion()],
      })
    );
    expect(result.current.isReady).toBe(false);
    expect(result.current.generatedDraft).toBeNull();
  });

  it('returns isReady=false when no suspected causes', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        questions: [makeQuestion({ causeRole: 'ruled-out' })],
      })
    );
    expect(result.current.isReady).toBe(false);
  });

  it('filters questions without factor', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        questions: [makeQuestion({ factor: undefined })],
      })
    );
    expect(result.current.isReady).toBe(false);
  });

  it('generate() populates draft', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Fill Weight',
        questions: [makeQuestion()],
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
        questions: [makeQuestion()],
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
        questions: [makeQuestion()],
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
        questions: [makeQuestion()],
      })
    );
    expect(result.current.generatedDraft).toContain('0.62');
    expect(result.current.generatedDraft).toContain('1.33');
  });

  it('prefers rSquaredAdj over etaSquared', () => {
    const { result } = renderHook(() =>
      useProblemStatement({
        outcome: 'Weight',
        questions: [
          makeQuestion({
            evidence: { rSquaredAdj: 0.5, etaSquared: 0.3 },
          }),
        ],
      })
    );
    expect(result.current.generatedDraft).toContain('50%');
  });

  // Early formation tests — Watson Q1+Q2+Q3 without suspected causes
  describe('early formation (isFormable)', () => {
    const locationFactor: LocationFactor = { factor: 'Shift', level: 'Night', evidence: 0.42 };

    it('isFormable is true when outcome + characteristicType + locationFactor all present', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.isFormable).toBe(true);
    });

    it('isFormable is false without outcome', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: null,
          characteristicType: 'nominal',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.isFormable).toBe(false);
    });

    it('isFormable is false without characteristicType', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.isFormable).toBe(false);
    });

    it('isFormable is false without locationFactor', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          questions: [],
        })
      );
      expect(result.current.isFormable).toBe(false);
    });

    it('q1Ready is true when outcome is set', () => {
      const { result } = renderHook(() =>
        useProblemStatement({ outcome: 'Fill Weight', questions: [] })
      );
      expect(result.current.q1Ready).toBe(true);
    });

    it('q1Ready is false when outcome is null', () => {
      const { result } = renderHook(() => useProblemStatement({ outcome: null, questions: [] }));
      expect(result.current.q1Ready).toBe(false);
    });

    it('q2Ready is true when characteristicType is set', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'smaller',
          questions: [],
        })
      );
      expect(result.current.q2Ready).toBe(true);
    });

    it('q2Ready is false when characteristicType is absent', () => {
      const { result } = renderHook(() =>
        useProblemStatement({ outcome: 'Fill Weight', questions: [] })
      );
      expect(result.current.q2Ready).toBe(false);
    });

    it('hasScope is true when locationFactor is set', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.hasScope).toBe(true);
    });

    it('hasScope is false when locationFactor is absent and no suspected causes', () => {
      const { result } = renderHook(() =>
        useProblemStatement({ outcome: 'Fill Weight', questions: [] })
      );
      expect(result.current.hasScope).toBe(false);
    });

    it('hasScope is true when there are suspected causes (backward compat)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          questions: [makeQuestion()],
        })
      );
      expect(result.current.hasScope).toBe(true);
    });

    it('liveStatement is set when isFormable is true', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.liveStatement).toBeTruthy();
      expect(result.current.liveStatement).toContain('Fill Weight');
      expect(result.current.liveStatement).toContain('Shift');
    });

    it('liveStatement is null when isFormable is false', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          questions: [],
        })
      );
      expect(result.current.liveStatement).toBeNull();
    });

    it('liveStatement uses characteristicType to resolve direction (larger → Increase)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Yield',
          characteristicType: 'larger',
          locationFactor: { factor: 'Machine' },
          questions: [],
        })
      );
      expect(result.current.liveStatement).toContain('Increase');
    });

    it('liveStatement uses characteristicType to resolve direction (smaller → Decrease)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Defect Rate',
          characteristicType: 'smaller',
          locationFactor: { factor: 'Line' },
          questions: [],
        })
      );
      expect(result.current.liveStatement).toContain('Decrease');
    });

    it('liveStatement includes suspected causes after locationFactor', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          locationFactor,
          questions: [makeQuestion({ factor: 'Operator', causeRole: 'suspected-cause' })],
        })
      );
      expect(result.current.liveStatement).toContain('Shift');
      expect(result.current.liveStatement).toContain('Operator');
    });

    it('liveStatement skips suspected causes that duplicate locationFactor factor name', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          locationFactor,
          questions: [makeQuestion({ factor: 'Shift', causeRole: 'suspected-cause' })],
        })
      );
      // Should contain Shift only once (from locationFactor)
      const statement = result.current.liveStatement ?? '';
      const shiftCount = (statement.match(/Shift/g) ?? []).length;
      expect(shiftCount).toBe(1);
    });

    it('legacy isReady still requires suspected causes (backward compat)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          characteristicType: 'nominal',
          locationFactor,
          questions: [],
        })
      );
      // isFormable is true (Q1+Q2+Q3), but isReady is false (no question suspected causes)
      expect(result.current.isFormable).toBe(true);
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('canGenerateDraft', () => {
    const locationFactor: LocationFactor = { factor: 'Shift', level: 'Night', evidence: 0.42 };

    it('canGenerateDraft should be true when q1Ready and hasScope (early path)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.q1Ready).toBe(true);
      expect(result.current.hasScope).toBe(true);
      expect(result.current.canGenerateDraft).toBe(true);
    });

    it('canGenerateDraft should be true from legacy path (suspected cause questions)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          questions: [makeQuestion()],
        })
      );
      expect(result.current.q1Ready).toBe(true);
      expect(result.current.hasScope).toBe(true);
      expect(result.current.canGenerateDraft).toBe(true);
    });

    it('canGenerateDraft should be false without outcome', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: null,
          locationFactor,
          questions: [],
        })
      );
      expect(result.current.q1Ready).toBe(false);
      expect(result.current.canGenerateDraft).toBe(false);
    });

    it('canGenerateDraft should be false without scope (no locationFactor, no suspected causes)', () => {
      const { result } = renderHook(() =>
        useProblemStatement({
          outcome: 'Fill Weight',
          questions: [],
        })
      );
      expect(result.current.hasScope).toBe(false);
      expect(result.current.canGenerateDraft).toBe(false);
    });
  });
});
