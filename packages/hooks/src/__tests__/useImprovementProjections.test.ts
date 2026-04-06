import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImprovementProjections } from '../useImprovementProjections';
import type { Question } from '@variscout/core/findings';

// ============================================================================
// Helpers
// ============================================================================

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    text: 'Test question',
    status: 'open',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useImprovementProjections', () => {
  describe('suspectedCauses', () => {
    it('returns empty array when there are no questions', () => {
      const { result } = renderHook(() => useImprovementProjections([], {}));
      expect(result.current.suspectedCauses).toEqual([]);
    });

    it('returns empty array when questions have no suspected-cause role', () => {
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'contributing' }),
        makeQuestion({ id: 'q2', factor: 'Shift', causeRole: 'ruled-out' }),
        makeQuestion({ id: 'q3', factor: 'Operator' }),
      ];
      const { result } = renderHook(() => useImprovementProjections(questions, {}));
      expect(result.current.suspectedCauses).toEqual([]);
    });

    it('returns empty array when suspected-cause question has no factor', () => {
      const questions = [makeQuestion({ id: 'q1', causeRole: 'suspected-cause' })];
      const { result } = renderHook(() => useImprovementProjections(questions, {}));
      expect(result.current.suspectedCauses).toEqual([]);
    });

    it('returns one entry for a suspected-cause question with a factor', () => {
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' }),
      ];
      const { result } = renderHook(() => useImprovementProjections(questions, { Machine: 1.45 }));
      expect(result.current.suspectedCauses).toHaveLength(1);
      expect(result.current.suspectedCauses[0].factor).toBe('Machine');
      expect(result.current.suspectedCauses[0].projectedCpk).toBe(1.45);
    });

    it('returns undefined projectedCpk when factor is not in the map', () => {
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' }),
      ];
      const { result } = renderHook(() => useImprovementProjections(questions, {}));
      expect(result.current.suspectedCauses[0].projectedCpk).toBeUndefined();
    });

    it('filters out non-suspected-cause questions from mixed list', () => {
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' }),
        makeQuestion({ id: 'q2', factor: 'Shift', causeRole: 'contributing' }),
        makeQuestion({ id: 'q3', factor: 'Operator', causeRole: 'suspected-cause' }),
        makeQuestion({ id: 'q4', factor: 'Line', causeRole: 'ruled-out' }),
      ];
      const projectedCpkMap = { Machine: 1.2, Shift: 0.9, Operator: 1.5, Line: 0.8 };
      const { result } = renderHook(() => useImprovementProjections(questions, projectedCpkMap));
      expect(result.current.suspectedCauses).toHaveLength(2);
      expect(result.current.suspectedCauses.map(sc => sc.factor)).toEqual(['Machine', 'Operator']);
    });

    it('returns multiple entries for multiple suspected-cause questions', () => {
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' }),
        makeQuestion({ id: 'q2', factor: 'Shift', causeRole: 'suspected-cause' }),
      ];
      const projectedCpkMap = { Machine: 1.3, Shift: 1.6 };
      const { result } = renderHook(() => useImprovementProjections(questions, projectedCpkMap));
      expect(result.current.suspectedCauses).toHaveLength(2);
    });
  });

  describe('combinedProjectedCpk', () => {
    it('returns undefined when projectedCpkMap is empty', () => {
      const { result } = renderHook(() => useImprovementProjections([], {}));
      expect(result.current.combinedProjectedCpk).toBeUndefined();
    });

    it('returns the single value when map has one entry', () => {
      const { result } = renderHook(() => useImprovementProjections([], { Machine: 1.45 }));
      expect(result.current.combinedProjectedCpk).toBe(1.45);
    });

    it('returns the maximum when map has multiple entries', () => {
      const { result } = renderHook(() =>
        useImprovementProjections([], { Machine: 1.2, Shift: 1.8, Operator: 0.9 })
      );
      expect(result.current.combinedProjectedCpk).toBe(1.8);
    });

    it('is independent of the questions list — uses all map values', () => {
      // combinedProjectedCpk comes from the map, not filtered by suspected-cause role
      const questions = [
        makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' }),
      ];
      const { result } = renderHook(() =>
        useImprovementProjections(questions, { Machine: 1.2, Shift: 2.0 })
      );
      expect(result.current.combinedProjectedCpk).toBe(2.0);
    });

    it('handles negative Cpk values correctly', () => {
      const { result } = renderHook(() =>
        useImprovementProjections([], { Machine: -0.5, Shift: -0.2 })
      );
      expect(result.current.combinedProjectedCpk).toBe(-0.2);
    });
  });

  describe('reactivity', () => {
    it('updates when questions change', () => {
      let questions: Question[] = [];
      const { result, rerender } = renderHook(
        ({ qs, map }: { qs: Question[]; map: Record<string, number> }) =>
          useImprovementProjections(qs, map),
        { initialProps: { qs: questions, map: {} } }
      );

      expect(result.current.suspectedCauses).toHaveLength(0);

      questions = [makeQuestion({ id: 'q1', factor: 'Machine', causeRole: 'suspected-cause' })];
      rerender({ qs: questions, map: { Machine: 1.5 } });

      expect(result.current.suspectedCauses).toHaveLength(1);
      expect(result.current.suspectedCauses[0].factor).toBe('Machine');
    });

    it('updates combinedProjectedCpk when map changes', () => {
      const { result, rerender } = renderHook(
        ({ map }: { map: Record<string, number> }) => useImprovementProjections([], map),
        { initialProps: { map: {} } }
      );

      expect(result.current.combinedProjectedCpk).toBeUndefined();

      rerender({ map: { Machine: 1.33 } });

      expect(result.current.combinedProjectedCpk).toBe(1.33);
    });
  });
});
