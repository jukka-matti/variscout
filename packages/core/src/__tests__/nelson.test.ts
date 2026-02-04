import { describe, it, expect } from 'vitest';
import { getNelsonRule2ViolationPoints, getNelsonRule2Sequences } from '../stats';

describe('Nelson Rule 2 Detection', () => {
  it('should return empty set for datasets with fewer than 9 points', () => {
    const violations = getNelsonRule2ViolationPoints([1, 2, 3, 4, 5, 6, 7, 8], 0);
    expect(violations.size).toBe(0);
  });

  it('should detect 9 consecutive points above mean', () => {
    // Mean is 0, all points above
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(9);
    for (let i = 0; i < 9; i++) {
      expect(violations.has(i)).toBe(true);
    }
  });

  it('should detect 9 consecutive points below mean', () => {
    // Mean is 0, all points below
    const values = [-1, -2, -3, -4, -5, -6, -7, -8, -9];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(9);
    for (let i = 0; i < 9; i++) {
      expect(violations.has(i)).toBe(true);
    }
  });

  it('should not detect violations with random data crossing mean', () => {
    // Data alternates above and below mean
    const values = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(0);
  });

  it('should detect exactly 9 points when run is exactly 9', () => {
    // 5 points below, then 9 above
    const values = [-1, -2, -3, -4, -5, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(9);
    // Points 5-13 should be flagged
    for (let i = 5; i < 14; i++) {
      expect(violations.has(i)).toBe(true);
    }
    // Points 0-4 should not be flagged
    for (let i = 0; i < 5; i++) {
      expect(violations.has(i)).toBe(false);
    }
  });

  it('should detect extended runs (>9 points) and mark all', () => {
    // 12 points all above mean
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(12);
    for (let i = 0; i < 12; i++) {
      expect(violations.has(i)).toBe(true);
    }
  });

  it('should break run when point equals mean', () => {
    // 6 points above, then exact mean, then 6 points above = no violations
    const values = [1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(0);
  });

  it('should detect multiple separate runs', () => {
    // 9 below, 2 above, 9 below
    const values = [
      -1,
      -2,
      -3,
      -4,
      -5,
      -6,
      -7,
      -8,
      -9, // Run 1 (indices 0-8)
      1,
      2, // Break
      -1,
      -2,
      -3,
      -4,
      -5,
      -6,
      -7,
      -8,
      -9, // Run 2 (indices 11-19)
    ];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(18);
    // First run (0-8)
    for (let i = 0; i <= 8; i++) {
      expect(violations.has(i)).toBe(true);
    }
    // Second run (11-19)
    for (let i = 11; i <= 19; i++) {
      expect(violations.has(i)).toBe(true);
    }
    // Break points (9-10)
    expect(violations.has(9)).toBe(false);
    expect(violations.has(10)).toBe(false);
  });

  it('should not flag run of 8 points', () => {
    // 8 points all above - not enough
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(0);
  });

  it('should handle run that ends at array end', () => {
    // 3 random, then 9 above at the end
    const values = [-1, 0, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const violations = getNelsonRule2ViolationPoints(values, 0);

    expect(violations.size).toBe(9);
    for (let i = 3; i < 12; i++) {
      expect(violations.has(i)).toBe(true);
    }
  });

  it('should work with non-zero mean', () => {
    // Mean is 100, all values above 100
    const values = [101, 102, 103, 104, 105, 106, 107, 108, 109];
    const violations = getNelsonRule2ViolationPoints(values, 100);

    expect(violations.size).toBe(9);
  });

  it('should handle negative mean correctly', () => {
    // Mean is -10, all values above -10 (but negative)
    const values = [-9, -8, -7, -6, -5, -4, -3, -2, -1];
    const violations = getNelsonRule2ViolationPoints(values, -10);

    expect(violations.size).toBe(9);
  });

  it('should handle floating point values', () => {
    // Mean is 10.5, all values above
    const values = [10.6, 10.7, 10.8, 10.9, 11.0, 11.1, 11.2, 11.3, 11.4];
    const violations = getNelsonRule2ViolationPoints(values, 10.5);

    expect(violations.size).toBe(9);
  });

  it('should return empty set for empty array', () => {
    const violations = getNelsonRule2ViolationPoints([], 0);
    expect(violations.size).toBe(0);
  });
});

describe('Nelson Rule 2 Sequence Detection', () => {
  it('should return empty array for datasets with fewer than 9 points', () => {
    const sequences = getNelsonRule2Sequences([1, 2, 3, 4, 5, 6, 7, 8], 0);
    expect(sequences).toEqual([]);
  });

  it('should detect single sequence of 9 consecutive points above mean', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 8,
      side: 'above',
    });
  });

  it('should detect single sequence of 9 consecutive points below mean', () => {
    const values = [-1, -2, -3, -4, -5, -6, -7, -8, -9];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 8,
      side: 'below',
    });
  });

  it('should return empty array when data crosses mean frequently', () => {
    const values = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
    const sequences = getNelsonRule2Sequences(values, 0);
    expect(sequences).toEqual([]);
  });

  it('should detect exactly one sequence when run is exactly 9', () => {
    const values = [-1, -2, -3, -4, -5, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 5,
      endIndex: 13,
      side: 'above',
    });
  });

  it('should detect extended runs (>9 points) as single sequence', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 11,
      side: 'above',
    });
  });

  it('should detect multiple separate sequences', () => {
    const values = [
      -1,
      -2,
      -3,
      -4,
      -5,
      -6,
      -7,
      -8,
      -9, // Sequence 1 (below)
      1,
      2, // Break
      -1,
      -2,
      -3,
      -4,
      -5,
      -6,
      -7,
      -8,
      -9, // Sequence 2 (below)
    ];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(2);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 8,
      side: 'below',
    });
    expect(sequences[1]).toEqual({
      startIndex: 11,
      endIndex: 19,
      side: 'below',
    });
  });

  it('should detect sequences with different sides (above and below)', () => {
    const values = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9, // Above mean
      0, // At mean (breaks run)
      -1,
      -2,
      -3,
      -4,
      -5,
      -6,
      -7,
      -8,
      -9, // Below mean
    ];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(2);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 8,
      side: 'above',
    });
    expect(sequences[1]).toEqual({
      startIndex: 10,
      endIndex: 18,
      side: 'below',
    });
  });

  it('should break sequence when point equals mean', () => {
    const values = [1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6];
    const sequences = getNelsonRule2Sequences(values, 0);
    expect(sequences).toEqual([]);
  });

  it('should not detect run of 8 points', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    const sequences = getNelsonRule2Sequences(values, 0);
    expect(sequences).toEqual([]);
  });

  it('should handle sequence at end of array', () => {
    const values = [-1, 0, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const sequences = getNelsonRule2Sequences(values, 0);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 3,
      endIndex: 11,
      side: 'above',
    });
  });

  it('should work with non-zero mean', () => {
    const values = [101, 102, 103, 104, 105, 106, 107, 108, 109];
    const sequences = getNelsonRule2Sequences(values, 100);

    expect(sequences).toHaveLength(1);
    expect(sequences[0]).toEqual({
      startIndex: 0,
      endIndex: 8,
      side: 'above',
    });
  });

  it('should return empty array for empty input', () => {
    const sequences = getNelsonRule2Sequences([], 0);
    expect(sequences).toEqual([]);
  });
});
