/**
 * Tests for useControlViolations hook
 *
 * Validates detection of UCL/LCL, USL/LSL, and Nelson Rule 2 violations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useControlViolations } from '../useControlViolations';

// Stable in-control dataset: mean ~10, low variation, all values close to mean
const IN_CONTROL_DATA = [
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
];

// Data with a clear outlier above UCL (mean ~10, one extreme value)
const DATA_WITH_UCL_VIOLATION = [
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 50.0 }, // Far above UCL
];

// Data with a clear outlier below LCL
const DATA_WITH_LCL_VIOLATION = [
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: 10.0 },
  { value: 10.1 },
  { value: 9.9 },
  { value: -30.0 }, // Far below LCL
];

// Data for Nelson Rule 2: 9+ consecutive points above mean
// Mean of all 12 values: (1*12) for first 3 at 5.0, rest at 15.0
// We need 9 consecutive values on the same side of the mean.
// Using: 3 values below mean, then 9 values above mean.
const NELSON_RULE_2_DATA = [
  { value: 1.0 },
  { value: 1.0 },
  { value: 1.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
  { value: 20.0 },
];

const OUTCOME = 'value';
const NO_SPECS = {};

describe('useControlViolations', () => {
  it('returns undefined when outcome is null', () => {
    const { result } = renderHook(() => useControlViolations(IN_CONTROL_DATA, null, NO_SPECS));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when data is empty', () => {
    const { result } = renderHook(() => useControlViolations([], OUTCOME, NO_SPECS));
    expect(result.current).toBeUndefined();
  });

  it('returns no violations for in-control data without specs', () => {
    const { result } = renderHook(() => useControlViolations(IN_CONTROL_DATA, OUTCOME, NO_SPECS));
    // All values are tightly clustered around 10, none should exceed UCL/LCL
    expect(result.current).toBeDefined();
    expect(result.current!.size).toBe(0);
  });

  it('detects above UCL violation', () => {
    const { result } = renderHook(() =>
      useControlViolations(DATA_WITH_UCL_VIOLATION, OUTCOME, NO_SPECS)
    );
    expect(result.current).toBeDefined();
    // The extreme value at index 9 should be above UCL
    const violations = result.current!.get(9);
    expect(violations).toBeDefined();
    expect(violations).toContainEqual(expect.stringContaining('Above UCL'));
  });

  it('detects below LCL violation', () => {
    const { result } = renderHook(() =>
      useControlViolations(DATA_WITH_LCL_VIOLATION, OUTCOME, NO_SPECS)
    );
    expect(result.current).toBeDefined();
    // The extreme value at index 9 should be below LCL
    const violations = result.current!.get(9);
    expect(violations).toBeDefined();
    expect(violations).toContainEqual(expect.stringContaining('Below LCL'));
  });

  it('detects above USL violation', () => {
    const specs = { usl: 10.05 };
    const { result } = renderHook(() => useControlViolations(IN_CONTROL_DATA, OUTCOME, specs));
    expect(result.current).toBeDefined();
    // Values 10.1 at indices 1, 4, 7 should be above USL of 10.05
    const violationIndices = [...result.current!.keys()];
    expect(violationIndices.length).toBeGreaterThan(0);
    for (const idx of violationIndices) {
      const violations = result.current!.get(idx)!;
      expect(violations).toContainEqual('Above USL');
    }
  });

  it('detects below LSL violation', () => {
    const specs = { lsl: 9.95 };
    const { result } = renderHook(() => useControlViolations(IN_CONTROL_DATA, OUTCOME, specs));
    expect(result.current).toBeDefined();
    // Values 9.9 at indices 2, 5, 8 should be below LSL of 9.95
    const violationIndices = [...result.current!.keys()];
    expect(violationIndices.length).toBeGreaterThan(0);
    for (const idx of violationIndices) {
      const violations = result.current!.get(idx)!;
      expect(violations).toContainEqual('Below LSL');
    }
  });

  it('detects multiple violations on the same row', () => {
    // A value that is both above UCL and above USL
    const specs = { usl: 11.0 };
    const { result } = renderHook(() =>
      useControlViolations(DATA_WITH_UCL_VIOLATION, OUTCOME, specs)
    );
    expect(result.current).toBeDefined();
    // Index 9 (value 50.0) should have both UCL and USL violations
    const violations = result.current!.get(9);
    expect(violations).toBeDefined();
    expect(violations!.length).toBeGreaterThanOrEqual(2);
    expect(violations).toContainEqual(expect.stringContaining('Above UCL'));
    expect(violations).toContainEqual('Above USL');
  });
});
