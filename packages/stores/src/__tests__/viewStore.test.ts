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
