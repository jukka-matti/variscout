import { beforeEach, describe, expect, it } from 'vitest';
import { useViewStore, examinedFactorKey } from '../viewStore';

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
    expect(s.pendingChartFocus).toBeNull();
    expect(s.piOverflowView).toBeNull();
    expect(s.isDataTableOpen).toBe(false);
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

describe('useViewStore — relocation assertions (ADR-085 / IM-1)', () => {
  it('does not own focusedQuestionId (Questions retired in ADR-085)', () => {
    const state = useViewStore.getState() as unknown as Record<string, unknown>;
    expect('focusedQuestionId' in state).toBe(false);
    expect('setFocusedQuestionId' in state).toBe(false);
  });

  it('does not own expandedQuestionId (Questions retired in ADR-085)', () => {
    const state = useViewStore.getState() as unknown as Record<string, unknown>;
    expect('expandedQuestionId' in state).toBe(false);
  });
});

describe('useViewStore — factor strip examined-state (ER-2)', () => {
  it('initialises examinedFactors to an empty Set', () => {
    expect(useViewStore.getState().examinedFactors.size).toBe(0);
  });

  it('markFactorExamined adds the `${outcome}::${factor}` key', () => {
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    const { examinedFactors } = useViewStore.getState();
    expect(examinedFactors.has(examinedFactorKey('CycleTime', 'Shift'))).toBe(true);
    expect(examinedFactors.has('CycleTime::Shift')).toBe(true);
    expect(examinedFactors.size).toBe(1);
  });

  it('keys are scoped per outcome — same factor under two outcomes coexist', () => {
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    useViewStore.getState().markFactorExamined('Defects', 'Shift');
    const { examinedFactors } = useViewStore.getState();
    expect(examinedFactors.size).toBe(2);
    expect(examinedFactors.has('CycleTime::Shift')).toBe(true);
    expect(examinedFactors.has('Defects::Shift')).toBe(true);
  });

  it('markFactorExamined is idempotent and preserves Set identity on re-mark', () => {
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    const first = useViewStore.getState().examinedFactors;
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    const second = useViewStore.getState().examinedFactors;
    expect(second.size).toBe(1);
    // Re-marking an existing key must not allocate a new Set (memo-stable).
    expect(second).toBe(first);
  });

  it('clearExaminedFactors empties only the examined set', () => {
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    useViewStore.getState().setSelectedPoints(new Set([1, 2]));
    useViewStore.getState().clearExaminedFactors();
    expect(useViewStore.getState().examinedFactors.size).toBe(0);
    expect(useViewStore.getState().selectedPoints.size).toBe(2);
  });

  it('clearTransientSelections also clears examinedFactors (loadProject / newProject reset path)', () => {
    useViewStore.getState().markFactorExamined('CycleTime', 'Shift');
    useViewStore.getState().markFactorExamined('CycleTime', 'Line');
    expect(useViewStore.getState().examinedFactors.size).toBe(2);
    useViewStore.getState().clearTransientSelections();
    expect(useViewStore.getState().examinedFactors.size).toBe(0);
  });
});
