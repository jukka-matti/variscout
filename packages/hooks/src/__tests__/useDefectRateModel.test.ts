/**
 * useDefectRateModel — deterministic unit tests (Task 2 / ER-5b).
 *
 * Test strategy:
 *   - Props-in hook, no store reads — no store mocking needed.
 *   - Deterministic datasets (no Math.random).
 *   - Chips sorted by concentration (DESC) — highest contributor first.
 *   - Null propagation: empty rows or no outcome → null.
 *   - D11 exclusion: outcome column itself must not appear as a chip.
 *   - Memoization: same inputs → same reference after rerender.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDefectRateModel } from '../useDefectRateModel';
import type { DataRow } from '@variscout/core';

// ── Locale loader (required by hooks that use useTranslation) ─────────────────
// useDefectRateModel does NOT use translations (pure number hook).
// No locale registration needed here.

// ── Dataset builders ──────────────────────────────────────────────────────────

/**
 * Two-factor dataset where Queue perfectly separates defect rate.
 *   Queue=Billing: rate=1.0 (all defects)
 *   Queue=Claims: rate=0.0 (no defects)
 *   Shift alternates Day/Night equally in each queue → flat
 */
function makeQueueShiftRows(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 10; i++) {
    rows.push({
      Queue: 'Billing',
      Shift: i % 2 === 0 ? 'Day' : 'Night',
      DefectRate: 1.0,
    });
  }
  for (let i = 0; i < 10; i++) {
    rows.push({
      Queue: 'Claims',
      Shift: i % 2 === 0 ? 'Day' : 'Night',
      DefectRate: 0.0,
    });
  }
  return rows;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDefectRateModel', () => {
  const rows = makeQueueShiftRows();
  const factors = ['Queue', 'Shift'];
  const outcomeColumn = 'DefectRate';

  it('returns chips sorted by concentration DESC (Queue before Shift)', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: factors,
        defectOutcome: outcomeColumn,
      })
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.length).toBe(2);
    expect(result.current![0].factor).toBe('Queue');
    expect(result.current![1].factor).toBe('Shift');
  });

  it('returns null for empty workingRows', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: [],
        allFactors: factors,
        defectOutcome: outcomeColumn,
      })
    );
    expect(result.current).toBeNull();
  });

  it('returns null when defectOutcome is null', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: factors,
        defectOutcome: null,
      })
    );
    expect(result.current).toBeNull();
  });

  it('returns null for empty allFactors', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: [],
        defectOutcome: outcomeColumn,
      })
    );
    expect(result.current).toBeNull();
  });

  it('chips carry required fields: factor, concentration, perLevel, isSignificant, topLevel', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: factors,
        defectOutcome: outcomeColumn,
      })
    );
    const chip = result.current![0];
    expect(typeof chip.factor).toBe('string');
    expect(typeof chip.concentration).toBe('number');
    expect(Array.isArray(chip.perLevel)).toBe(true);
    expect(typeof chip.isSignificant).toBe('boolean');
    // topLevel is the most over-concentrated level or null
    // (null is valid when a factor has < 1 qualifyingly over-concentrated level)
    expect(chip.topLevel === null || typeof chip.topLevel === 'object').toBe(true);
  });

  it('D11 exclusion: outcome column must not appear as a chip factor', () => {
    const factorsWithOutcome = [...factors, 'DefectRate'];
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: factorsWithOutcome,
        defectOutcome: outcomeColumn,
      })
    );
    if (result.current !== null) {
      const factorNames = result.current.map(c => c.factor);
      expect(factorNames).not.toContain('DefectRate');
    }
  });

  it('memoization: same inputs return same reference on re-render', () => {
    const stableRows = rows;
    const stableFactors = factors;
    const { result, rerender } = renderHook(() =>
      useDefectRateModel({
        workingRows: stableRows,
        allFactors: stableFactors,
        defectOutcome: outcomeColumn,
      })
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('Queue chip has topLevel pointing to Billing (highest rate level)', () => {
    const { result } = renderHook(() =>
      useDefectRateModel({
        workingRows: rows,
        allFactors: factors,
        defectOutcome: outcomeColumn,
      })
    );
    const queueChip = result.current!.find(c => c.factor === 'Queue');
    expect(queueChip).toBeDefined();
    // topLevel should be the level with the highest rate (Billing=1.0)
    if (queueChip!.topLevel !== null) {
      expect(queueChip!.topLevel.level).toBe('Billing');
    }
  });
});
