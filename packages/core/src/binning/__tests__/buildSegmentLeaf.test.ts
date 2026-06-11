import { describe, it, expect } from 'vitest';
import { buildSegmentLeaf } from '../buildSegmentLeaf';
import { rowMatchesConditionLeaves } from '../../findings/hypothesisCondition';
import type { BinnedFactorBinding } from '../types';
import type { ConditionLeaf } from '../../findings/hypothesisCondition';

// ---------------------------------------------------------------------------
// Fixture: a binding with two cuts (three segments)
// cuts = [10, 20]
//   segment 0 (first):  v < 10
//   segment 1 (middle): 10 <= v <= 20  (between, inclusive both ends)
//   segment 2 (last):   v >= 20
// ---------------------------------------------------------------------------

const BINDING_TWO_CUTS: BinnedFactorBinding = {
  id: 'b1',
  sourceColumn: 'CycleTime',
  cuts: [10, 20],
  levelNames: ['Low', 'Mid', 'High'],
  detectionMethod: 'gap-ratio-v1',
  detectedAt: '2026-06-11T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Fixture: a binding with a single cut (two segments)
// cuts = [5]
//   segment 0 (first):  v < 5
//   segment 1 (last):   v >= 5
// ---------------------------------------------------------------------------

const BINDING_ONE_CUT: BinnedFactorBinding = {
  id: 'b2',
  sourceColumn: 'Temperature',
  cuts: [5],
  levelNames: ['Cold', 'Hot'],
  detectionMethod: 'manual',
  detectedAt: '2026-06-11T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Leaf shape tests
// ---------------------------------------------------------------------------

describe('buildSegmentLeaf — leaf shape', () => {
  it('first segment (index 0) produces an lt leaf at cuts[0]', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 0);
    expect(leaf).toEqual<ConditionLeaf>({
      kind: 'leaf',
      column: 'CycleTime',
      op: 'lt',
      value: 10,
    });
  });

  it('last segment (index cuts.length) produces a gte leaf at cuts[last]', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 2);
    expect(leaf).toEqual<ConditionLeaf>({
      kind: 'leaf',
      column: 'CycleTime',
      op: 'gte',
      value: 20,
    });
  });

  it('middle segment (index 1 of 2) produces a between leaf with [cuts[0], cuts[1]]', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 1);
    expect(leaf).toEqual<ConditionLeaf>({
      kind: 'leaf',
      column: 'CycleTime',
      op: 'between',
      value: [10, 20],
    });
  });

  it('uses sourceColumn (not the binding id or levelNames) as the leaf column', () => {
    const leaf0 = buildSegmentLeaf(BINDING_TWO_CUTS, 0);
    const leaf2 = buildSegmentLeaf(BINDING_TWO_CUTS, 2);
    expect(leaf0.column).toBe('CycleTime');
    expect(leaf2.column).toBe('CycleTime');
  });

  it('single-cut binding: segment 0 → lt, segment 1 → gte', () => {
    const leafFirst = buildSegmentLeaf(BINDING_ONE_CUT, 0);
    const leafLast = buildSegmentLeaf(BINDING_ONE_CUT, 1);

    expect(leafFirst).toEqual<ConditionLeaf>({
      kind: 'leaf',
      column: 'Temperature',
      op: 'lt',
      value: 5,
    });
    expect(leafLast).toEqual<ConditionLeaf>({
      kind: 'leaf',
      column: 'Temperature',
      op: 'gte',
      value: 5,
    });
  });
});

// ---------------------------------------------------------------------------
// Bounds validation
// ---------------------------------------------------------------------------

describe('buildSegmentLeaf — bounds validation', () => {
  it('throws RangeError for segmentIndex === -1', () => {
    expect(() => buildSegmentLeaf(BINDING_TWO_CUTS, -1)).toThrow(RangeError);
  });

  it('throws RangeError for segmentIndex > cuts.length (e.g. 3 for 2 cuts)', () => {
    expect(() => buildSegmentLeaf(BINDING_TWO_CUTS, 3)).toThrow(RangeError);
  });

  it('throws RangeError for segmentIndex === cuts.length + 1', () => {
    expect(() => buildSegmentLeaf(BINDING_ONE_CUT, 2)).toThrow(RangeError);
  });

  it('RangeError message contains the invalid index and valid range', () => {
    expect(() => buildSegmentLeaf(BINDING_TWO_CUTS, 5)).toThrowError(/5/);
  });

  it('does NOT throw for index === 0 (boundary)', () => {
    expect(() => buildSegmentLeaf(BINDING_TWO_CUTS, 0)).not.toThrow();
  });

  it('does NOT throw for index === cuts.length (boundary)', () => {
    expect(() => buildSegmentLeaf(BINDING_TWO_CUTS, 2)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Round-trip: leaf matches the same rows as applyCuts would assign to the segment.
//
// Uses rowMatchesConditionLeaves (the canonical evaluator) to verify that rows
// in the segment match the leaf and rows outside do not.
//
// Fixture rows for BINDING_TWO_CUTS (cuts = [10, 20]):
//   segment 0 (first, v < 10):  CycleTime = 5, 9
//   segment 1 (middle, 10..20): CycleTime = 10, 15, 20
//   segment 2 (last, v >= 20):  CycleTime = 20, 25, 100
//
// Note: value 20 is at the boundary between segment 1 (middle) and segment 2
// (last). applyCuts routes it to segment 2 (v >= 20 ≡ v == cuts[last] → last).
// The 'between' leaf for segment 1 includes 20 (inclusive upper bound).
// Both segment 1's 'between' and segment 2's 'gte' match value 20.
// This is the documented intentional overlap — see buildSegmentLeaf's note on
// boundary behaviour.  Tests below assert the guaranteed behaviour (in-segment
// rows match; clearly-outside rows don't) and don't test the ambiguous cut-point.
// ---------------------------------------------------------------------------

describe('buildSegmentLeaf — round-trip via rowMatchesConditionLeaves', () => {
  const col = 'CycleTime';

  // Rows clearly in segment 0 (v < 10)
  const inFirstRows = [{ [col]: 5 }, { [col]: 9 }, { [col]: -100 }, { [col]: 0 }];

  // Rows clearly NOT in segment 0 (v >= 10)
  const notInFirstRows = [{ [col]: 10 }, { [col]: 15 }, { [col]: 25 }];

  // Rows clearly NOT in segment 1 (outside 10..20)
  const notInMiddleRows = [{ [col]: 5 }, { [col]: 9 }, { [col]: 21 }, { [col]: 100 }];

  // Rows clearly in segment 2 (v >= 20, strictly above boundary)
  const inLastRows = [{ [col]: 21 }, { [col]: 25 }, { [col]: 100 }];

  // Rows clearly NOT in segment 2 (v < 20)
  const notInLastRows = [{ [col]: 5 }, { [col]: 9 }, { [col]: 10 }, { [col]: 15 }];

  it('first segment leaf matches rows with CycleTime < 10', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 0);
    for (const row of inFirstRows) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(true);
    }
  });

  it('first segment leaf rejects rows with CycleTime >= 10', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 0);
    for (const row of notInFirstRows) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(false);
    }
  });

  it('middle segment leaf matches rows with 10 <= CycleTime <= 20 (between, inclusive)', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 1);
    // Also include the cut-points (inclusive both ends for between)
    const inMiddleIncludingBounds = [
      { [col]: 10 },
      { [col]: 11 },
      { [col]: 15 },
      { [col]: 19 },
      { [col]: 20 },
    ];
    for (const row of inMiddleIncludingBounds) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(true);
    }
  });

  it('middle segment leaf rejects rows clearly outside 10..20', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 1);
    for (const row of notInMiddleRows) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(false);
    }
  });

  it('last segment leaf matches rows with CycleTime >= 20', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 2);
    for (const row of inLastRows) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(true);
    }
    // Cut point itself (20) is >= 20
    expect(rowMatchesConditionLeaves({ [col]: 20 }, [leaf])).toBe(true);
  });

  it('last segment leaf rejects rows with CycleTime < 20', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 2);
    for (const row of notInLastRows) {
      expect(rowMatchesConditionLeaves(row, [leaf])).toBe(false);
    }
  });

  it('first segment leaf rejects rows with a missing column', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 0);
    expect(rowMatchesConditionLeaves({ OtherColumn: 5 }, [leaf])).toBe(false);
  });

  it('last segment leaf rejects null cell values', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 2);
    expect(rowMatchesConditionLeaves({ [col]: null }, [leaf])).toBe(false);
  });

  it('middle segment leaf rejects non-numeric values', () => {
    const leaf = buildSegmentLeaf(BINDING_TWO_CUTS, 1);
    expect(rowMatchesConditionLeaves({ [col]: '15' }, [leaf])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// derivedFrom field does not affect buildSegmentLeaf (it uses sourceColumn)
// ---------------------------------------------------------------------------

describe('buildSegmentLeaf — derivedFrom provenance field is ignored (sourceColumn is used)', () => {
  it('builds leaf on sourceColumn even when derivedFrom is set', () => {
    const bindingWithProvenance: BinnedFactorBinding = {
      id: 'b3',
      sourceColumn: 'Pressure',
      derivedFrom: 'Temperature',
      cuts: [50],
      levelNames: ['Low', 'High'],
      detectionMethod: 'manual',
      detectedAt: '2026-06-11T00:00:00Z',
    };

    const leaf = buildSegmentLeaf(bindingWithProvenance, 0);
    // The leaf column must be sourceColumn, not derivedFrom
    expect(leaf.column).toBe('Pressure');
    expect(leaf.op).toBe('lt');
    expect(leaf.value).toBe(50);
  });
});
