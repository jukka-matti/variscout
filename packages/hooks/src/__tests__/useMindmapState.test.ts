/**
 * Tests for useMindmapState hook
 *
 * IMPORTANT: All props passed to useMindmapState via renderHook must use
 * stable references (module-level constants or refs). Inline arrays like
 * `filterStack: []` create new references on every render, causing infinite
 * effect loops when state changes trigger re-renders.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @variscout/charts — only type-imports needed, avoids loading Visx
vi.mock('@variscout/charts', () => ({}));

import { useMindmapState } from '../useMindmapState';
import { createFilterAction, type FilterAction } from '@variscout/core';

// Small dataset with known factor structure:
// Machine: A (lower mean ~10), B (higher mean ~20) -> high eta-squared
// Shift: Morning (similar), Afternoon (similar) -> low eta-squared
const testData = [
  { Machine: 'A', Shift: 'Morning', Value: 10 },
  { Machine: 'A', Shift: 'Morning', Value: 11 },
  { Machine: 'A', Shift: 'Afternoon', Value: 9 },
  { Machine: 'A', Shift: 'Afternoon', Value: 12 },
  { Machine: 'B', Shift: 'Morning', Value: 20 },
  { Machine: 'B', Shift: 'Morning', Value: 19 },
  { Machine: 'B', Shift: 'Afternoon', Value: 21 },
  { Machine: 'B', Shift: 'Afternoon', Value: 18 },
];

const factors = ['Machine', 'Shift'];

// Stable empty array reference — inline `[]` would create new reference
// on each render, causing infinite effect loops in the hook.
const emptyStack: FilterAction[] = [];

function makeFilterAction(factor: string, values: (string | number)[]): FilterAction {
  return createFilterAction({
    type: 'filter',
    source: 'mindmap',
    factor,
    values,
  });
}

// Pre-built filter stacks (stable references)
const machineAStack = [makeFilterAction('Machine', ['A'])];
const machineABStack = [makeFilterAction('Machine', ['A', 'B'])];
const twoStepStack = [makeFilterAction('Machine', ['A']), makeFilterAction('Shift', ['Morning'])];

describe('useMindmapState', () => {
  it('returns exhausted nodes when data is empty', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: [],
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    expect(result.current.nodes).toHaveLength(2);
    result.current.nodes.forEach(node => {
      expect(node.state).toBe('exhausted');
      expect(node.maxContribution).toBe(0);
      expect(node.isSuggested).toBe(false);
    });
  });

  it('returns exhausted nodes when outcome is empty string', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: '',
        filterStack: emptyStack,
      })
    );

    result.current.nodes.forEach(node => {
      expect(node.state).toBe('exhausted');
    });
  });

  it('returns exhausted nodes when data has fewer than 2 rows', () => {
    const singleRow = [testData[0]];
    const { result } = renderHook(() =>
      useMindmapState({
        data: singleRow,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    result.current.nodes.forEach(node => {
      expect(node.state).toBe('exhausted');
      expect(node.maxContribution).toBe(0);
    });
  });

  it('computes max category contribution for each factor and sets correct node state', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    const shiftNode = result.current.nodes.find(n => n.factor === 'Shift')!;

    // Machine A and B each account for ~50% of Total SS
    expect(machineNode.maxContribution).toBeGreaterThan(0.3);
    expect(machineNode.state).toBe('available');

    // Shift also has meaningful Total SS per category (spread is similar)
    expect(shiftNode.maxContribution).toBeGreaterThan(0.3);
    expect(shiftNode.state).toBe('available');
  });

  it('marks drilled factors as active with filteredValue', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    expect(machineNode.state).toBe('active');
    expect(machineNode.filteredValue).toBe('A');
  });

  it('formats filteredValue for multi-select with 2 values', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineABStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    expect(machineNode.filteredValue).toBe('A, B');
  });

  it('suggests the highest max-contribution available factor above 5% threshold', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    // Exactly one factor should be suggested
    const suggestedNodes = result.current.nodes.filter(n => n.isSuggested);
    expect(suggestedNodes).toHaveLength(1);
    // The suggested factor has the highest max category contribution
    expect(suggestedNodes[0].maxContribution).toBeGreaterThan(0.3);
  });

  it('does not suggest drilled factors', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    expect(machineNode.state).toBe('active');
    expect(machineNode.isSuggested).toBe(false);
  });

  it('builds drillTrail from drillPath factor names', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
      })
    );

    expect(result.current.drillTrail).toEqual(['Machine']);
  });

  it('passes cumulativeVariationPct through from useDrillPath', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
        specs: { usl: 25, lsl: 5 },
      })
    );

    expect(result.current.cumulativeVariationPct).toBeGreaterThan(0);
    expect(typeof result.current.cumulativeVariationPct).toBe('number');
  });

  it('defaults mode to drilldown, can be changed via setMode', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    expect(result.current.mode).toBe('drilldown');

    act(() => {
      result.current.setMode('interactions');
    });

    expect(result.current.mode).toBe('interactions');

    act(() => {
      result.current.setMode('narrative');
    });

    expect(result.current.mode).toBe('narrative');
  });

  it('handleAnnotationChange adds and removes annotations', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
      })
    );

    act(() => {
      result.current.handleAnnotationChange(0, 'Machine A is the root cause');
    });

    expect(result.current.annotations.get(0)).toBe('Machine A is the root cause');
    expect(result.current.narrativeSteps[0].annotation).toBe('Machine A is the root cause');

    act(() => {
      result.current.handleAnnotationChange(0, '');
    });

    expect(result.current.annotations.has(0)).toBe(false);
    expect(result.current.narrativeSteps[0].annotation).toBeUndefined();
  });

  it('interaction edges are undefined initially (lazy computation)', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    expect(result.current.interactionEdges).toBeUndefined();
  });

  it('populates categoryData for available (non-drilled) factors', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: emptyStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    expect(machineNode.categoryData).toBeDefined();
    expect(machineNode.categoryData!.length).toBe(2);

    const catA = machineNode.categoryData!.find(c => c.value === 'A');
    const catB = machineNode.categoryData!.find(c => c.value === 'B');
    expect(catA).toBeDefined();
    expect(catB).toBeDefined();
    expect(catA!.count).toBe(4);
    expect(catB!.count).toBe(4);
    expect(catA!.meanValue).toBeCloseTo(10.5, 0);
    expect(catB!.meanValue).toBeCloseTo(19.5, 0);
  });

  it('drilled factors do not have categoryData', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: machineAStack,
      })
    );

    const machineNode = result.current.nodes.find(n => n.factor === 'Machine')!;
    expect(machineNode.categoryData).toBeUndefined();
  });

  it('narrativeSteps mirror drillPath entries', () => {
    const { result } = renderHook(() =>
      useMindmapState({
        data: testData,
        factors,
        outcome: 'Value',
        filterStack: twoStepStack,
        specs: { usl: 25, lsl: 5 },
      })
    );

    expect(result.current.narrativeSteps).toHaveLength(2);
    expect(result.current.narrativeSteps[0].factor).toBe('Machine');
    expect(result.current.narrativeSteps[1].factor).toBe('Shift');
    expect(result.current.narrativeSteps[0].scopeFraction).toBe(
      result.current.drillPath[0].scopeFraction
    );
    expect(result.current.narrativeSteps[0].countBefore).toBe(
      result.current.drillPath[0].countBefore
    );
    expect(result.current.narrativeSteps[0].countAfter).toBe(
      result.current.drillPath[0].countAfter
    );
  });
});
