/**
 * Tests for useStepDefectPareto hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStepDefectPareto } from '../useStepDefectPareto';
import type { DefectStepRollup } from '@variscout/core';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const STEP_A: DefectStepRollup = {
  stepKey: 'Mold',
  defectCount: 42,
};

const STEP_B: DefectStepRollup = {
  stepKey: 'QC',
  defectCount: 18,
};

const STEP_C: DefectStepRollup = {
  stepKey: 'Assembly',
  defectCount: 7,
};

const STEP_WITH_COST: DefectStepRollup = {
  stepKey: 'Trim',
  defectCount: 30,
  costTotal: 1500,
};

const STEP_WITH_COST_AND_DURATION: DefectStepRollup = {
  stepKey: 'Paint',
  defectCount: 25,
  costTotal: 800,
  durationTotal: 3600,
};

const STEP_WITH_DURATION_ONLY: DefectStepRollup = {
  stepKey: 'Cure',
  defectCount: 12,
  durationTotal: 900,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useStepDefectPareto', () => {
  it('returns empty data and hasData=false when perStep is undefined', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: undefined }));
    expect(result.current.data).toEqual([]);
    expect(result.current.hasData).toBe(false);
  });

  it('returns empty data and hasData=false when perStep is empty array', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: [] }));
    expect(result.current.data).toEqual([]);
    expect(result.current.hasData).toBe(false);
  });

  it('maps 3 entries correctly and hasData=true', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: [STEP_A, STEP_B, STEP_C] }));
    expect(result.current.hasData).toBe(true);
    expect(result.current.data).toHaveLength(3);

    expect(result.current.data[0]).toEqual({ category: 'Mold', value: 42 });
    expect(result.current.data[1]).toEqual({ category: 'QC', value: 18 });
    expect(result.current.data[2]).toEqual({ category: 'Assembly', value: 7 });
  });

  it('preserves order from input (P2.1 sorts descending by defectCount)', () => {
    const sorted = [STEP_A, STEP_B, STEP_C]; // already descending
    const { result } = renderHook(() => useStepDefectPareto({ perStep: sorted }));
    expect(result.current.data.map(d => d.category)).toEqual(['Mold', 'QC', 'Assembly']);
  });

  it('includes cost when costTotal is present on a step', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: [STEP_WITH_COST] }));
    expect(result.current.data[0]).toEqual({ category: 'Trim', value: 30, cost: 1500 });
    expect(result.current.data[0].duration).toBeUndefined();
  });

  it('includes cost and duration when both are present', () => {
    const { result } = renderHook(() =>
      useStepDefectPareto({ perStep: [STEP_WITH_COST_AND_DURATION] })
    );
    expect(result.current.data[0]).toEqual({
      category: 'Paint',
      value: 25,
      cost: 800,
      duration: 3600,
    });
  });

  it('includes duration but not cost when only durationTotal is present', () => {
    const { result } = renderHook(() =>
      useStepDefectPareto({ perStep: [STEP_WITH_DURATION_ONLY] })
    );
    expect(result.current.data[0]).toEqual({ category: 'Cure', value: 12, duration: 900 });
    expect(result.current.data[0].cost).toBeUndefined();
  });

  it('omits optional fields when they are undefined on the rollup entry', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: [STEP_A] }));
    const entry = result.current.data[0];
    // Only category and value should be present
    expect(Object.keys(entry)).toEqual(['category', 'value']);
  });

  it('handles a single entry correctly', () => {
    const { result } = renderHook(() => useStepDefectPareto({ perStep: [STEP_B] }));
    expect(result.current.hasData).toBe(true);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual({ category: 'QC', value: 18 });
  });
});
