import { describe, it, expect } from 'vitest';
import { applyFilters } from '../variation';

// =============================================================================
// Test Data
// =============================================================================

/**
 * Multi-level drill data for testing filtering.
 */
const multiLevelData = [
  // Day shift - Machine A (Weight: 100-102), Machine B (Weight: 110-112)
  { Shift: 'Day', Machine: 'A', Operator: 'X', Weight: 100 },
  { Shift: 'Day', Machine: 'A', Operator: 'X', Weight: 101 },
  { Shift: 'Day', Machine: 'A', Operator: 'Y', Weight: 101 },
  { Shift: 'Day', Machine: 'A', Operator: 'Y', Weight: 102 },
  { Shift: 'Day', Machine: 'B', Operator: 'X', Weight: 110 },
  { Shift: 'Day', Machine: 'B', Operator: 'X', Weight: 111 },
  { Shift: 'Day', Machine: 'B', Operator: 'Y', Weight: 111 },
  { Shift: 'Day', Machine: 'B', Operator: 'Y', Weight: 112 },
  // Night shift - Machine A (Weight: 150-152), Machine B (Weight: 160-162)
  { Shift: 'Night', Machine: 'A', Operator: 'X', Weight: 150 },
  { Shift: 'Night', Machine: 'A', Operator: 'X', Weight: 151 },
  { Shift: 'Night', Machine: 'A', Operator: 'Y', Weight: 151 },
  { Shift: 'Night', Machine: 'A', Operator: 'Y', Weight: 152 },
  { Shift: 'Night', Machine: 'B', Operator: 'X', Weight: 160 },
  { Shift: 'Night', Machine: 'B', Operator: 'X', Weight: 161 },
  { Shift: 'Night', Machine: 'B', Operator: 'Y', Weight: 161 },
  { Shift: 'Night', Machine: 'B', Operator: 'Y', Weight: 162 },
];

// =============================================================================
// applyFilters() Tests
// =============================================================================

describe('applyFilters', () => {
  const testData = [
    { Shift: 'Day', Machine: 'A', Value: 1 },
    { Shift: 'Day', Machine: 'B', Value: 2 },
    { Shift: 'Night', Machine: 'A', Value: 3 },
    { Shift: 'Night', Machine: 'B', Value: 4 },
  ];

  it('should filter by single column', () => {
    const result = applyFilters(testData, { Shift: ['Day'] });

    expect(result).toHaveLength(2);
    expect(result.every(row => row.Shift === 'Day')).toBe(true);
  });

  it('should filter by multiple columns (AND logic)', () => {
    const result = applyFilters(testData, {
      Shift: ['Day'],
      Machine: ['A'],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Shift: 'Day', Machine: 'A', Value: 1 });
  });

  it('should return all data for empty filters object', () => {
    const result = applyFilters(testData, {});

    expect(result).toHaveLength(4);
  });

  it('should return all data for filter with empty values array', () => {
    const result = applyFilters(testData, { Shift: [] });

    expect(result).toHaveLength(4);
  });

  it('should return empty array when no rows match', () => {
    const result = applyFilters(testData, { Shift: ['Evening'] });

    expect(result).toHaveLength(0);
  });

  it('should handle multiple values for single column (OR within column)', () => {
    const result = applyFilters(testData, { Shift: ['Day', 'Night'] });

    expect(result).toHaveLength(4);
  });

  it('should handle numeric filter values', () => {
    const numericData = [
      { Category: 1, Value: 10 },
      { Category: 2, Value: 20 },
      { Category: 1, Value: 15 },
    ];

    const result = applyFilters(numericData, { Category: [1] });

    expect(result).toHaveLength(2);
    expect(result.every(row => row.Category === 1)).toBe(true);
  });

  it('should return empty array for empty input data', () => {
    const result = applyFilters([], { Shift: ['Day'] });

    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Filter Integration', () => {
  it('should correctly filter data for multi-level drill', () => {
    // Apply filter to drill into Night shift
    const filteredData = applyFilters(multiLevelData, { Shift: ['Night'] });
    expect(filteredData).toHaveLength(8);

    // Further filter to Machine A
    const deepFiltered = applyFilters(filteredData, { Machine: ['A'] });
    expect(deepFiltered).toHaveLength(4);
    expect(deepFiltered.every(row => row.Shift === 'Night' && row.Machine === 'A')).toBe(true);
  });
});
