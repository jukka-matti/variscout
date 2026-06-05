import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImprovementProjections } from '../useImprovementProjections';
import type { Hypothesis } from '@variscout/core/findings';

// ============================================================================
// Helpers
// ============================================================================

function makeHub(overrides: Partial<Hypothesis> & { id: string }): Hypothesis {
  return {
    name: 'Test hub',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useImprovementProjections', () => {
  describe('hypotheses', () => {
    it('returns empty array when there are no hubs', () => {
      const { result } = renderHook(() => useImprovementProjections([], {}));
      expect(result.current.hypotheses).toEqual([]);
    });

    it('returns empty array when no hubs are selectedForImprovement', () => {
      const hubs = [
        makeHub({ id: 'h1', name: 'Machine', selectedForImprovement: false }),
        makeHub({ id: 'h2', name: 'Shift', selectedForImprovement: false }),
      ];
      const { result } = renderHook(() => useImprovementProjections(hubs, {}));
      expect(result.current.hypotheses).toEqual([]);
    });

    it('returns empty array when selectedForImprovement hub is refuted', () => {
      const hubs = [
        makeHub({ id: 'h1', name: 'Machine', selectedForImprovement: true, status: 'refuted' }),
      ];
      const { result } = renderHook(() => useImprovementProjections(hubs, {}));
      expect(result.current.hypotheses).toEqual([]);
    });

    it('returns projectedCpkMap entries when at least one active hub exists', () => {
      const hubs = [
        makeHub({
          id: 'h1',
          name: 'Machine',
          selectedForImprovement: true,
          status: 'evidence-survived-test',
        }),
      ];
      const { result } = renderHook(() => useImprovementProjections(hubs, { Machine: 1.45 }));
      expect(result.current.hypotheses).toHaveLength(1);
      expect(result.current.hypotheses[0].factor).toBe('Machine');
      expect(result.current.hypotheses[0].projectedCpk).toBe(1.45);
    });

    it('returns all map entries when at least one active hub exists (map drives output)', () => {
      // The hook returns ALL projectedCpkMap entries when there is ≥1 active hub —
      // the hub list acts as a gate, not a filter on factors.
      const hubs = [
        makeHub({
          id: 'h1',
          name: 'Machine',
          selectedForImprovement: true,
          status: 'evidence-survived-test',
        }),
      ];
      const { result } = renderHook(() =>
        useImprovementProjections(hubs, { Machine: 1.2, Shift: 0.9 })
      );
      expect(result.current.hypotheses).toHaveLength(2);
      expect(result.current.hypotheses.map(h => h.factor)).toContain('Machine');
      expect(result.current.hypotheses.map(h => h.factor)).toContain('Shift');
    });

    it('returns empty array when no active hubs even if map has entries', () => {
      const hubs = [
        makeHub({ id: 'h1', name: 'Machine', selectedForImprovement: false }),
        makeHub({ id: 'h2', name: 'Shift', selectedForImprovement: true, status: 'refuted' }),
      ];
      const { result } = renderHook(() =>
        useImprovementProjections(hubs, { Machine: 1.2, Shift: 0.9 })
      );
      expect(result.current.hypotheses).toHaveLength(0);
    });

    it('returns entries from map with correct projectedCpk values', () => {
      const hubs = [
        makeHub({
          id: 'h1',
          name: 'Machine',
          selectedForImprovement: true,
          status: 'evidence-survived-test',
        }),
        makeHub({ id: 'h2', name: 'Shift', selectedForImprovement: true, status: 'proposed' }),
      ];
      const projectedCpkMap = { Machine: 1.3, Shift: 1.6 };
      const { result } = renderHook(() => useImprovementProjections(hubs, projectedCpkMap));
      expect(result.current.hypotheses).toHaveLength(2);
      const machineEntry = result.current.hypotheses.find(h => h.factor === 'Machine');
      expect(machineEntry?.projectedCpk).toBe(1.3);
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

    it('is independent of the hubs list — uses all map values', () => {
      // combinedProjectedCpk comes from the map, not filtered by hub selection
      const hubs = [
        makeHub({
          id: 'h1',
          name: 'Machine',
          selectedForImprovement: true,
          status: 'evidence-survived-test',
        }),
      ];
      const { result } = renderHook(() =>
        useImprovementProjections(hubs, { Machine: 1.2, Shift: 2.0 })
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
    it('updates when hubs change', () => {
      let hubs: Hypothesis[] = [];
      const { result, rerender } = renderHook(
        ({ hs, map }: { hs: Hypothesis[]; map: Record<string, number> }) =>
          useImprovementProjections(hs, map),
        { initialProps: { hs: hubs, map: {} } }
      );

      expect(result.current.hypotheses).toHaveLength(0);

      hubs = [
        makeHub({
          id: 'h1',
          name: 'Machine',
          selectedForImprovement: true,
          status: 'evidence-survived-test',
        }),
      ];
      rerender({ hs: hubs, map: { Machine: 1.5 } });

      expect(result.current.hypotheses).toHaveLength(1);
      expect(result.current.hypotheses[0].factor).toBe('Machine');
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
