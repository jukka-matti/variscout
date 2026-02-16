/**
 * Tests for useRegressionState hook
 *
 * Tests mode switching, column selection, predictor toggles,
 * categorical column management, model reduction history,
 * and modal state.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegressionState } from '../useRegressionState';

const numericColumns = ['Temperature', 'Pressure', 'Humidity', 'Speed', 'Viscosity'];

describe('useRegressionState', () => {
  // ===========================================================================
  // Mode
  // ===========================================================================

  it('default mode is "simple"', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    expect(result.current.mode).toBe('simple');
  });

  it('setMode switches to "advanced"', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    act(() => result.current.setMode('advanced'));
    expect(result.current.mode).toBe('advanced');

    act(() => result.current.setMode('simple'));
    expect(result.current.mode).toBe('simple');
  });

  // ===========================================================================
  // Auto-selection
  // ===========================================================================

  it('auto-selects first N columns from numericColumns', () => {
    const { result } = renderHook(() =>
      useRegressionState({ numericColumns, maxSimpleColumns: 3 })
    );

    expect(result.current.selectedXColumns).toEqual(['Temperature', 'Pressure', 'Humidity']);
  });

  it('auto-selects up to maxSimpleColumns (default 4)', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    expect(result.current.selectedXColumns).toHaveLength(4);
    expect(result.current.selectedXColumns).toEqual([
      'Temperature',
      'Pressure',
      'Humidity',
      'Speed',
    ]);
  });

  // ===========================================================================
  // toggleXColumn
  // ===========================================================================

  it('toggleXColumn removes a selected column', () => {
    const { result } = renderHook(() =>
      useRegressionState({ numericColumns, maxSimpleColumns: 4 })
    );

    act(() => result.current.toggleXColumn('Temperature'));
    expect(result.current.selectedXColumns).not.toContain('Temperature');
  });

  it('toggleXColumn adds a column when under max', () => {
    const { result } = renderHook(() =>
      useRegressionState({ numericColumns, maxSimpleColumns: 4 })
    );

    // Remove one first
    act(() => result.current.toggleXColumn('Temperature'));
    // Now add Viscosity
    act(() => result.current.toggleXColumn('Viscosity'));
    expect(result.current.selectedXColumns).toContain('Viscosity');
  });

  it('toggleXColumn respects max column limit', () => {
    const { result } = renderHook(() =>
      useRegressionState({ numericColumns, maxSimpleColumns: 4 })
    );

    // Already at max (4 selected), trying to add 5th should be no-op
    act(() => result.current.toggleXColumn('Viscosity'));
    expect(result.current.selectedXColumns).toHaveLength(4);
    expect(result.current.selectedXColumns).not.toContain('Viscosity');
  });

  // ===========================================================================
  // Advanced mode: toggleAdvPredictor
  // ===========================================================================

  it('toggleAdvPredictor adds and removes predictors', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    act(() => result.current.toggleAdvPredictor('Temperature'));
    expect(result.current.advSelectedPredictors).toContain('Temperature');

    act(() => result.current.toggleAdvPredictor('Temperature'));
    expect(result.current.advSelectedPredictors).not.toContain('Temperature');
  });

  it('toggleAdvPredictor cleans up categoricalColumns on remove', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    // Add predictor, mark as categorical, then remove predictor
    act(() => result.current.toggleAdvPredictor('Temperature'));
    act(() => result.current.toggleCategorical('Temperature'));
    expect(result.current.categoricalColumns.has('Temperature')).toBe(true);

    act(() => result.current.toggleAdvPredictor('Temperature'));
    expect(result.current.categoricalColumns.has('Temperature')).toBe(false);
  });

  // ===========================================================================
  // toggleCategorical
  // ===========================================================================

  it('toggleCategorical toggles set membership', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    act(() => result.current.toggleCategorical('Pressure'));
    expect(result.current.categoricalColumns.has('Pressure')).toBe(true);

    act(() => result.current.toggleCategorical('Pressure'));
    expect(result.current.categoricalColumns.has('Pressure')).toBe(false);
  });

  // ===========================================================================
  // Model reduction
  // ===========================================================================

  it('addReductionStep + updateLastStepAdjR2After + clearReductionHistory', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    const step = {
      term: 'Temperature',
      pValue: 0.45,
      adjR2Before: 0.82,
      adjR2After: 0,
    };

    act(() => result.current.addReductionStep(step));
    expect(result.current.reductionHistory).toHaveLength(1);
    expect(result.current.reductionHistory[0].term).toBe('Temperature');

    act(() => result.current.updateLastStepAdjR2After(0.8));
    expect(result.current.reductionHistory[0].adjR2After).toBe(0.8);

    act(() => result.current.clearReductionHistory());
    expect(result.current.reductionHistory).toHaveLength(0);
  });

  // ===========================================================================
  // Modal state
  // ===========================================================================

  it('setExpandedChart updates modal state', () => {
    const { result } = renderHook(() => useRegressionState({ numericColumns }));

    expect(result.current.expandedChart).toBeNull();

    act(() => result.current.setExpandedChart('Temperature'));
    expect(result.current.expandedChart).toBe('Temperature');

    act(() => result.current.setExpandedChart(null));
    expect(result.current.expandedChart).toBeNull();
  });
});
