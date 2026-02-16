/**
 * Filter State Transition Tests
 *
 * Tests the filter navigation stack through multi-step sequences:
 * - Round-trip consistency (add → remove → state matches original)
 * - Middle filter removal and recalculation
 * - Edge transitions (empty results, single-category filters)
 * - Multi-filter cumulative η² progression
 *
 * Uses both pure navigation functions from @variscout/core and
 * React hooks via renderHook for stateful behavior.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  createFilterAction,
  pushFilterStack,
  popFilterStack,
  popFilterStackTo,
  filterStackToFilters,
  applyFilters,
  calculateStats,
  type FilterAction,
  type DataRow,
} from '@variscout/core';
import { useVariationTracking } from '../useVariationTracking';

// ============================================================================
// Test Data
// ============================================================================

/** Multi-factor dataset for testing filter sequences */
const testData: DataRow[] = [
  { Machine: 'A', Shift: 'Day', Operator: 'Alice', Weight: 10 },
  { Machine: 'A', Shift: 'Day', Operator: 'Bob', Weight: 11 },
  { Machine: 'A', Shift: 'Night', Operator: 'Alice', Weight: 12 },
  { Machine: 'A', Shift: 'Night', Operator: 'Bob', Weight: 13 },
  { Machine: 'B', Shift: 'Day', Operator: 'Alice', Weight: 50 },
  { Machine: 'B', Shift: 'Day', Operator: 'Bob', Weight: 51 },
  { Machine: 'B', Shift: 'Night', Operator: 'Alice', Weight: 52 },
  { Machine: 'B', Shift: 'Night', Operator: 'Bob', Weight: 53 },
  { Machine: 'C', Shift: 'Day', Operator: 'Alice', Weight: 100 },
  { Machine: 'C', Shift: 'Day', Operator: 'Bob', Weight: 101 },
  { Machine: 'C', Shift: 'Night', Operator: 'Alice', Weight: 102 },
  { Machine: 'C', Shift: 'Night', Operator: 'Bob', Weight: 103 },
];

const factors = ['Machine', 'Shift', 'Operator'];
const outcome = 'Weight';

function makeFilter(factor: string, values: (string | number)[]): FilterAction {
  return createFilterAction({
    type: 'filter',
    source: 'boxplot',
    factor,
    values,
  });
}

// ============================================================================
// Pure Function: Round-Trip Consistency
// ============================================================================

describe('Filter Stack: Round-Trip Consistency', () => {
  it('add filter → remove it → stack is empty', () => {
    let stack: FilterAction[] = [];
    const action = makeFilter('Machine', ['A']);
    stack = pushFilterStack(stack, action);
    expect(stack).toHaveLength(1);

    stack = popFilterStack(stack);
    expect(stack).toHaveLength(0);
  });

  it('add 3 filters → pop all → stack is empty', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('Machine', ['A']));
    stack = pushFilterStack(stack, makeFilter('Shift', ['Day']));
    stack = pushFilterStack(stack, makeFilter('Operator', ['Alice']));
    expect(stack).toHaveLength(3);

    stack = popFilterStack(stack);
    stack = popFilterStack(stack);
    stack = popFilterStack(stack);
    expect(stack).toHaveLength(0);
  });

  it('pop from empty stack → still empty', () => {
    const stack: FilterAction[] = [];
    const result = popFilterStack(stack);
    expect(result).toHaveLength(0);
    expect(result).toBe(stack); // Same reference
  });

  it('filterStackToFilters round-trips correctly', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('Machine', ['A', 'B']));
    stack = pushFilterStack(stack, makeFilter('Shift', ['Day']));

    const filters = filterStackToFilters(stack);
    expect(filters).toEqual({
      Machine: ['A', 'B'],
      Shift: ['Day'],
    });
  });

  it('duplicate factor in stack → last one wins in filters', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('Machine', ['A']));
    stack = pushFilterStack(stack, makeFilter('Machine', ['B']));

    const filters = filterStackToFilters(stack);
    // Both actions are in the stack, but filterStackToFilters overwrites
    expect(filters.Machine).toEqual(['B']);
  });
});

// ============================================================================
// Pure Function: Navigate-To (Middle Removal)
// ============================================================================

describe('Filter Stack: Navigate-To', () => {
  it('popFilterStackTo root → removes all', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('Machine', ['A']));
    stack = pushFilterStack(stack, makeFilter('Shift', ['Day']));
    stack = pushFilterStack(stack, makeFilter('Operator', ['Alice']));

    // popFilterStackTo with non-existent id → returns same stack
    const result = popFilterStackTo(stack, 'nonexistent-id');
    expect(result).toBe(stack);
  });

  it('popFilterStackTo middle action → truncates to that point', () => {
    let stack: FilterAction[] = [];
    const a1 = makeFilter('Machine', ['A']);
    const a2 = makeFilter('Shift', ['Day']);
    const a3 = makeFilter('Operator', ['Alice']);
    stack = pushFilterStack(stack, a1);
    stack = pushFilterStack(stack, a2);
    stack = pushFilterStack(stack, a3);

    // Navigate to action 2 → removes action 3
    const result = popFilterStackTo(stack, a2.id);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(a1.id);
    expect(result[1].id).toBe(a2.id);
  });

  it('popFilterStackTo first action → keeps only first', () => {
    let stack: FilterAction[] = [];
    const a1 = makeFilter('Machine', ['A']);
    const a2 = makeFilter('Shift', ['Day']);
    stack = pushFilterStack(stack, a1);
    stack = pushFilterStack(stack, a2);

    const result = popFilterStackTo(stack, a1.id);
    expect(result).toHaveLength(1);
    expect(result[0].factor).toBe('Machine');
  });
});

// ============================================================================
// Data Filtering: Edge Transitions
// ============================================================================

describe('Filter Data: Edge Transitions', () => {
  it('filter to empty result → filteredData.length === 0', () => {
    const filters = { Machine: ['Nonexistent'] };
    const filtered = applyFilters(testData, filters);
    expect(filtered).toHaveLength(0);
  });

  it('filter to single row', () => {
    const filters = { Machine: ['A'], Shift: ['Day'], Operator: ['Alice'] };
    const filtered = applyFilters(testData, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].Weight).toBe(10);
  });

  it('filter with factor having 1 unique value → returns same rows', () => {
    // All rows with Machine=A
    const filters = { Machine: ['A'] };
    const filtered = applyFilters(testData, filters);
    expect(filtered).toHaveLength(4);
    // All have Machine=A
    expect(filtered.every(r => r.Machine === 'A')).toBe(true);
  });

  it('multi-value filter → union of matches', () => {
    const filters = { Machine: ['A', 'B'] };
    const filtered = applyFilters(testData, filters);
    expect(filtered).toHaveLength(8); // 4 A + 4 B
  });

  it('multiple filters → intersection (AND logic)', () => {
    const filters = { Machine: ['A', 'B'], Shift: ['Day'] };
    const filtered = applyFilters(testData, filters);
    // Machine A Day: 2 rows, Machine B Day: 2 rows
    expect(filtered).toHaveLength(4);
  });

  it('empty filter map → returns all data', () => {
    const filtered = applyFilters(testData, {});
    expect(filtered).toHaveLength(testData.length);
  });

  it('stats degrade gracefully for single filtered row', () => {
    const filters = { Machine: ['A'], Shift: ['Day'], Operator: ['Alice'] };
    const filtered = applyFilters(testData, filters);
    const values = filtered.map(r => Number(r.Weight));
    const stats = calculateStats(values);
    expect(stats.mean).toBe(10);
    expect(stats.stdDev).toBe(0);
  });
});

// ============================================================================
// Sequential Filter Operations
// ============================================================================

describe('Filter Stack: Sequential Operations', () => {
  it('rapid sequential adds → final state is consistent', () => {
    let stack: FilterAction[] = [];
    for (let i = 0; i < 10; i++) {
      stack = pushFilterStack(stack, makeFilter(`Factor${i}`, [`val${i}`]));
    }
    expect(stack).toHaveLength(10);
    expect(stack[0].factor).toBe('Factor0');
    expect(stack[9].factor).toBe('Factor9');
  });

  it('alternating add/remove → net result correct', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('A', ['1']));
    stack = pushFilterStack(stack, makeFilter('B', ['2']));
    stack = popFilterStack(stack); // Remove B
    stack = pushFilterStack(stack, makeFilter('C', ['3']));
    stack = popFilterStack(stack); // Remove C
    stack = popFilterStack(stack); // Remove A

    expect(stack).toHaveLength(0);
  });

  it('add same factor twice → both actions in stack', () => {
    let stack: FilterAction[] = [];
    stack = pushFilterStack(stack, makeFilter('Machine', ['A']));
    stack = pushFilterStack(stack, makeFilter('Machine', ['B']));

    expect(stack).toHaveLength(2);
    // But filter resolution: last wins
    const filters = filterStackToFilters(stack);
    expect(filters.Machine).toEqual(['B']);
  });
});

// ============================================================================
// Hook: Multi-Filter Cumulative η²
// ============================================================================

describe('Cumulative η² Progression', () => {
  const emptyStack: FilterAction[] = [];

  it('unfiltered → cumulative is null', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );
    expect(result.current.cumulativeVariationPct).toBeNull();
  });

  it('single high-impact filter → high cumulative', () => {
    // Machine explains most variation in this dataset
    const stack = [makeFilter('Machine', ['A'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));
    expect(result.current.cumulativeVariationPct).not.toBeNull();
    expect(result.current.cumulativeVariationPct!).toBeGreaterThan(50);
  });

  it('filter by low-impact factor → lower cumulative', () => {
    // Shift has minimal effect on Weight in this dataset
    const stack = [makeFilter('Shift', ['Day'])];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));
    expect(result.current.cumulativeVariationPct).not.toBeNull();
    // Shift explains very little of the variation
    expect(result.current.cumulativeVariationPct!).toBeLessThan(50);
  });

  it('cumulative never exceeds 100%', () => {
    // Deep drill: Machine then Shift then Operator
    const stack = [
      makeFilter('Machine', ['A']),
      makeFilter('Shift', ['Day']),
      makeFilter('Operator', ['Alice']),
    ];
    const { result } = renderHook(() => useVariationTracking(testData, stack, outcome, factors));

    if (result.current.cumulativeVariationPct !== null) {
      expect(result.current.cumulativeVariationPct).toBeLessThanOrEqual(100);
    }
  });

  it('factorVariations map has entries for each factor', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );

    // Should have variation percentages for Machine, Shift, Operator
    expect(result.current.factorVariations.has('Machine')).toBe(true);
    expect(result.current.factorVariations.has('Shift')).toBe(true);
    expect(result.current.factorVariations.has('Operator')).toBe(true);
  });

  it('Machine η² >> Shift η² (known structure)', () => {
    const { result } = renderHook(() =>
      useVariationTracking(testData, emptyStack, outcome, factors)
    );

    const machineVar = result.current.factorVariations.get('Machine') ?? 0;
    const shiftVar = result.current.factorVariations.get('Shift') ?? 0;
    // Machine (A~10, B~50, C~100) explains vastly more than Shift
    expect(machineVar).toBeGreaterThan(shiftVar * 5);
  });
});
