import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHypotheses } from '../useHypotheses';
import { createHypothesis } from '@variscout/core';
import type { AnovaResult } from '@variscout/core';

const makeAnova = (etaSquared: number): AnovaResult => ({
  groups: [],
  ssb: 0,
  ssw: 0,
  dfBetween: 0,
  dfWithin: 0,
  msb: 0,
  msw: 0,
  fStatistic: 0,
  pValue: 0.05,
  isSignificant: etaSquared > 0.05,
  etaSquared,
  insight: '',
});

describe('useHypotheses', () => {
  it('starts with empty hypotheses', () => {
    const { result } = renderHook(() => useHypotheses());
    expect(result.current.hypotheses).toEqual([]);
  });

  it('starts with initial hypotheses', () => {
    const initial = [createHypothesis('Test', 'Machine')];
    const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
    expect(result.current.hypotheses).toHaveLength(1);
    expect(result.current.hypotheses[0].text).toBe('Test');
  });

  describe('addHypothesis', () => {
    it('adds a hypothesis', () => {
      const { result } = renderHook(() => useHypotheses());
      act(() => {
        result.current.addHypothesis('Night shift training gap');
      });
      expect(result.current.hypotheses).toHaveLength(1);
      expect(result.current.hypotheses[0].text).toBe('Night shift training gap');
    });

    it('adds with factor and level', () => {
      const { result } = renderHook(() => useHypotheses());
      act(() => {
        result.current.addHypothesis('Shift effect', 'Shift', 'Night');
      });
      expect(result.current.hypotheses[0].factor).toBe('Shift');
      expect(result.current.hypotheses[0].level).toBe('Night');
    });

    it('calls onHypothesesChange', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useHypotheses({ onHypothesesChange: onChange }));
      act(() => {
        result.current.addHypothesis('Test');
      });
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('editHypothesis', () => {
    it('updates hypothesis text', () => {
      const initial = [createHypothesis('Original')];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
      act(() => {
        result.current.editHypothesis(initial[0].id, { text: 'Updated' });
      });
      expect(result.current.hypotheses[0].text).toBe('Updated');
    });

    it('updates factor and level', () => {
      const initial = [createHypothesis('Test')];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
      act(() => {
        result.current.editHypothesis(initial[0].id, { factor: 'Machine', level: 'A' });
      });
      expect(result.current.hypotheses[0].factor).toBe('Machine');
      expect(result.current.hypotheses[0].level).toBe('A');
    });
  });

  describe('deleteHypothesis', () => {
    it('removes hypothesis and returns linked finding IDs', () => {
      const h = createHypothesis('Test');
      h.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let unlinked: string[] = [];
      act(() => {
        unlinked = result.current.deleteHypothesis(h.id);
      });
      expect(result.current.hypotheses).toHaveLength(0);
      expect(unlinked).toEqual(['f-1', 'f-2']);
    });
  });

  describe('linkFinding / unlinkFinding', () => {
    it('links a finding to a hypothesis', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.linkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toContain('f-1');
    });

    it('does not duplicate finding links', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.linkFinding(h.id, 'f-1');
        result.current.linkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toEqual(['f-1']);
    });

    it('unlinks a finding from a hypothesis', () => {
      const h = createHypothesis('Test');
      h.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.unlinkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toEqual(['f-2']);
    });
  });

  describe('getHypothesis / getByFactor', () => {
    it('gets a hypothesis by ID', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      expect(result.current.getHypothesis(h.id)?.text).toBe('Test');
    });

    it('returns undefined for unknown ID', () => {
      const { result } = renderHook(() => useHypotheses());
      expect(result.current.getHypothesis('nope')).toBeUndefined();
    });

    it('filters by factor', () => {
      const h1 = createHypothesis('Machine issue', 'Machine');
      const h2 = createHypothesis('Shift issue', 'Shift');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h1, h2] }));
      expect(result.current.getByFactor('Machine')).toHaveLength(1);
      expect(result.current.getByFactor('Machine')[0].text).toBe('Machine issue');
    });
  });

  describe('auto-validation', () => {
    it('sets supported when eta² >= 15%', () => {
      const h = createHypothesis('Machine issue', 'Machine');
      const anova = { Machine: makeAnova(0.2) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('supported');
    });

    it('sets contradicted when eta² < 5%', () => {
      const h = createHypothesis('Weak factor', 'Shift');
      const anova = { Shift: makeAnova(0.03) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('contradicted');
    });

    it('sets partial when 5% <= eta² < 15%', () => {
      const h = createHypothesis('Moderate factor', 'Operator');
      const anova = { Operator: makeAnova(0.1) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('partial');
    });

    it('stays untested when no factor linked', () => {
      const h = createHypothesis('Unknown cause');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('untested');
    });

    it('stays untested when factor has no ANOVA', () => {
      const h = createHypothesis('Missing ANOVA', 'Batch');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('untested');
    });
  });
});
