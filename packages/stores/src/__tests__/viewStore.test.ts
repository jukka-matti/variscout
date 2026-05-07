import { beforeEach, describe, expect, it } from 'vitest';
import { useViewStore } from '../viewStore';

beforeEach(() => {
  useViewStore.setState(useViewStore.getInitialState());
});

describe('useViewStore', () => {
  it('declares STORE_LAYER as view', async () => {
    const mod = await import('../viewStore');
    expect(mod.STORE_LAYER).toBe('view');
  });

  it('initialises all fields to null/empty', () => {
    const s = useViewStore.getState();
    expect(s.highlightRowIndex).toBeNull();
    expect(s.highlightedChartPoint).toBeNull();
    expect(s.highlightedFindingId).toBeNull();
    expect(s.expandedQuestionId).toBeNull();
    expect(s.pendingChartFocus).toBeNull();
    expect(s.piOverflowView).toBeNull();
    expect(s.isDataTableOpen).toBe(false);
    expect(s.focusedQuestionId).toBeNull();
    expect(s.highlightedImprovementIdeaId).toBeNull();
    expect(s.improvementActiveView).toBe('plan');
    expect(s.selectedPoints.size).toBe(0);
    expect(s.selectionIndexMap.size).toBe(0);
  });

  it('setHighlightPoint updates highlightedChartPoint', () => {
    useViewStore.getState().setHighlightPoint(5);
    expect(useViewStore.getState().highlightedChartPoint).toBe(5);
  });

  it('clearTransientSelections empties selectedPoints and selectionIndexMap', () => {
    useViewStore.setState({
      selectedPoints: new Set([1, 2, 3]),
      selectionIndexMap: new Map([[1, 0]]),
    });
    useViewStore.getState().clearTransientSelections();
    expect(useViewStore.getState().selectedPoints.size).toBe(0);
    expect(useViewStore.getState().selectionIndexMap.size).toBe(0);
  });

  it('toggleDataTable flips isDataTableOpen', () => {
    expect(useViewStore.getState().isDataTableOpen).toBe(false);
    useViewStore.getState().toggleDataTable();
    expect(useViewStore.getState().isDataTableOpen).toBe(true);
  });
});

describe('useViewStore.selectedPoints (relocated from projectStore in F4)', () => {
  it('setSelectedPoints stores the set', () => {
    useViewStore.getState().setSelectedPoints(new Set([1, 2, 3]));
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([1, 2, 3]));
  });
});

describe('useViewStore — rich selection actions (spec D1 relocation from projectStore)', () => {
  it('addToSelection adds indices and accumulates on subsequent calls', () => {
    useViewStore.getState().addToSelection([1, 2]);
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([1, 2]));
    useViewStore.getState().addToSelection([3]);
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([1, 2, 3]));
  });

  it('removeFromSelection removes indices; non-existent indices are no-ops', () => {
    useViewStore.setState({ selectedPoints: new Set([1, 2, 3]) });
    useViewStore.getState().removeFromSelection([1]);
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([2, 3]));
    // removing non-existent index leaves state unchanged
    useViewStore.getState().removeFromSelection([99]);
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([2, 3]));
  });

  it('clearSelection clears selectedPoints only — leaves selectionIndexMap untouched', () => {
    useViewStore.setState({
      selectedPoints: new Set([1, 2]),
      selectionIndexMap: new Map([[1, 0]]),
    });
    useViewStore.getState().clearSelection();
    expect(useViewStore.getState().selectedPoints.size).toBe(0);
    expect(useViewStore.getState().selectionIndexMap.size).toBe(1);
  });

  it('togglePointSelection adds index when absent', () => {
    useViewStore.getState().togglePointSelection(5);
    expect(useViewStore.getState().selectedPoints.has(5)).toBe(true);
  });

  it('togglePointSelection removes index when present', () => {
    useViewStore.setState({ selectedPoints: new Set([5]) });
    useViewStore.getState().togglePointSelection(5);
    expect(useViewStore.getState().selectedPoints.has(5)).toBe(false);
  });
});
