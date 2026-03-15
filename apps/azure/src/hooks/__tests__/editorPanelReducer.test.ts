import { describe, it, expect } from 'vitest';
import {
  editorPanelReducer,
  initialPanelState,
  type EditorPanelState,
  type EditorPanelAction,
} from '../useEditorPanels';

/** Helper to apply a sequence of actions to the initial state. */
function applyActions(actions: EditorPanelAction[], start = initialPanelState): EditorPanelState {
  return actions.reduce(editorPanelReducer, start);
}

describe('editorPanelReducer', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      expect(initialPanelState).toEqual({
        isDataPanelOpen: false,
        isDataTableOpen: false,
        isFindingsOpen: false,
        isCoScoutOpen: false,
        isWhatIfOpen: false,
        isPresentationMode: false,
        highlightRowIndex: null,
        highlightedChartPoint: null,
      });
    });
  });

  describe('data panel', () => {
    it('OPEN_DATA_PANEL opens the data panel', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'OPEN_DATA_PANEL' });
      expect(state.isDataPanelOpen).toBe(true);
    });

    it('CLOSE_DATA_PANEL closes the data panel', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isDataPanelOpen: true },
        { type: 'CLOSE_DATA_PANEL' }
      );
      expect(state.isDataPanelOpen).toBe(false);
    });

    it('TOGGLE_DATA_PANEL toggles the data panel', () => {
      const opened = editorPanelReducer(initialPanelState, { type: 'TOGGLE_DATA_PANEL' });
      expect(opened.isDataPanelOpen).toBe(true);

      const closed = editorPanelReducer(opened, { type: 'TOGGLE_DATA_PANEL' });
      expect(closed.isDataPanelOpen).toBe(false);
    });
  });

  describe('data table', () => {
    it('OPEN_DATA_TABLE opens the data table', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'OPEN_DATA_TABLE' });
      expect(state.isDataTableOpen).toBe(true);
    });

    it('CLOSE_DATA_TABLE closes the data table', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isDataTableOpen: true },
        { type: 'CLOSE_DATA_TABLE' }
      );
      expect(state.isDataTableOpen).toBe(false);
    });
  });

  describe('findings panel', () => {
    it('SET_FINDINGS_OPEN opens findings', () => {
      const state = editorPanelReducer(initialPanelState, {
        type: 'SET_FINDINGS_OPEN',
        value: true,
      });
      expect(state.isFindingsOpen).toBe(true);
    });

    it('SET_FINDINGS_OPEN closes findings', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isFindingsOpen: true },
        { type: 'SET_FINDINGS_OPEN', value: false }
      );
      expect(state.isFindingsOpen).toBe(false);
    });

    it('SET_FINDINGS_OPEN returns same reference when value unchanged', () => {
      const before = { ...initialPanelState, isFindingsOpen: true };
      const after = editorPanelReducer(before, { type: 'SET_FINDINGS_OPEN', value: true });
      expect(after).toBe(before);
    });

    it('TOGGLE_FINDINGS toggles findings panel', () => {
      const opened = editorPanelReducer(initialPanelState, { type: 'TOGGLE_FINDINGS' });
      expect(opened.isFindingsOpen).toBe(true);

      const closed = editorPanelReducer(opened, { type: 'TOGGLE_FINDINGS' });
      expect(closed.isFindingsOpen).toBe(false);
    });
  });

  describe('what-if panel', () => {
    it('SET_WHAT_IF_OPEN opens what-if', () => {
      const state = editorPanelReducer(initialPanelState, {
        type: 'SET_WHAT_IF_OPEN',
        value: true,
      });
      expect(state.isWhatIfOpen).toBe(true);
    });

    it('SET_WHAT_IF_OPEN closes what-if', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isWhatIfOpen: true },
        { type: 'SET_WHAT_IF_OPEN', value: false }
      );
      expect(state.isWhatIfOpen).toBe(false);
    });

    it('SET_WHAT_IF_OPEN returns same reference when value unchanged', () => {
      const before = { ...initialPanelState, isWhatIfOpen: false };
      const after = editorPanelReducer(before, { type: 'SET_WHAT_IF_OPEN', value: false });
      expect(after).toBe(before);
    });
  });

  describe('presentation mode', () => {
    it('OPEN_PRESENTATION enters presentation mode', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'OPEN_PRESENTATION' });
      expect(state.isPresentationMode).toBe(true);
    });

    it('CLOSE_PRESENTATION exits presentation mode', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isPresentationMode: true },
        { type: 'CLOSE_PRESENTATION' }
      );
      expect(state.isPresentationMode).toBe(false);
    });
  });

  describe('highlights', () => {
    it('SET_HIGHLIGHT_ROW sets the highlight row index', () => {
      const state = editorPanelReducer(initialPanelState, {
        type: 'SET_HIGHLIGHT_ROW',
        index: 42,
      });
      expect(state.highlightRowIndex).toBe(42);
    });

    it('SET_HIGHLIGHT_ROW clears with null', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, highlightRowIndex: 10 },
        { type: 'SET_HIGHLIGHT_ROW', index: null }
      );
      expect(state.highlightRowIndex).toBeNull();
    });

    it('SET_HIGHLIGHT_POINT sets the highlighted chart point', () => {
      const state = editorPanelReducer(initialPanelState, {
        type: 'SET_HIGHLIGHT_POINT',
        index: 7,
      });
      expect(state.highlightedChartPoint).toBe(7);
    });

    it('SET_HIGHLIGHT_POINT clears with null', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, highlightedChartPoint: 5 },
        { type: 'SET_HIGHLIGHT_POINT', index: null }
      );
      expect(state.highlightedChartPoint).toBeNull();
    });
  });

  describe('POINT_CLICK (compound action)', () => {
    it('sets highlight row AND opens data panel', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'POINT_CLICK', index: 15 });
      expect(state.highlightRowIndex).toBe(15);
      expect(state.isDataPanelOpen).toBe(true);
    });

    it('keeps data panel open if already open', () => {
      const before = { ...initialPanelState, isDataPanelOpen: true };
      const state = editorPanelReducer(before, { type: 'POINT_CLICK', index: 3 });
      expect(state.highlightRowIndex).toBe(3);
      expect(state.isDataPanelOpen).toBe(true);
    });
  });

  describe('ROW_CLICK', () => {
    it('sets highlighted chart point', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'ROW_CLICK', index: 22 });
      expect(state.highlightedChartPoint).toBe(22);
    });
  });

  describe('CoScout panel', () => {
    it('SET_COSCOUT_OPEN opens CoScout', () => {
      const state = editorPanelReducer(initialPanelState, {
        type: 'SET_COSCOUT_OPEN',
        value: true,
      });
      expect(state.isCoScoutOpen).toBe(true);
    });

    it('SET_COSCOUT_OPEN closes CoScout', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isCoScoutOpen: true },
        { type: 'SET_COSCOUT_OPEN', value: false }
      );
      expect(state.isCoScoutOpen).toBe(false);
    });

    it('SET_COSCOUT_OPEN returns same reference when value unchanged', () => {
      const before = { ...initialPanelState, isCoScoutOpen: true };
      const after = editorPanelReducer(before, { type: 'SET_COSCOUT_OPEN', value: true });
      expect(after).toBe(before);
    });

    it('TOGGLE_COSCOUT toggles CoScout panel', () => {
      const opened = editorPanelReducer(initialPanelState, { type: 'TOGGLE_COSCOUT' });
      expect(opened.isCoScoutOpen).toBe(true);

      const closed = editorPanelReducer(opened, { type: 'TOGGLE_COSCOUT' });
      expect(closed.isCoScoutOpen).toBe(false);
    });
  });

  describe('CoScout/findings coexistence', () => {
    it('opening CoScout keeps findings open', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isFindingsOpen: true },
        { type: 'SET_COSCOUT_OPEN', value: true }
      );
      expect(state.isCoScoutOpen).toBe(true);
      expect(state.isFindingsOpen).toBe(true);
    });

    it('opening findings keeps CoScout open', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isCoScoutOpen: true },
        { type: 'SET_FINDINGS_OPEN', value: true }
      );
      expect(state.isFindingsOpen).toBe(true);
      expect(state.isCoScoutOpen).toBe(true);
    });

    it('toggling CoScout open keeps findings open', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isFindingsOpen: true },
        { type: 'TOGGLE_COSCOUT' }
      );
      expect(state.isCoScoutOpen).toBe(true);
      expect(state.isFindingsOpen).toBe(true);
    });

    it('toggling findings open keeps CoScout open', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isCoScoutOpen: true },
        { type: 'TOGGLE_FINDINGS' }
      );
      expect(state.isFindingsOpen).toBe(true);
      expect(state.isCoScoutOpen).toBe(true);
    });

    it('closing CoScout does not affect findings', () => {
      const state = editorPanelReducer(
        { ...initialPanelState, isCoScoutOpen: true, isFindingsOpen: true },
        { type: 'SET_COSCOUT_OPEN', value: false }
      );
      expect(state.isCoScoutOpen).toBe(false);
      expect(state.isFindingsOpen).toBe(true);
    });
  });

  describe('unknown action', () => {
    it('returns same state for unrecognized action type', () => {
      const state = editorPanelReducer(initialPanelState, { type: 'UNKNOWN' } as never);
      expect(state).toBe(initialPanelState);
    });
  });

  describe('multi-step sequences', () => {
    it('open findings → point click → close findings preserves data panel', () => {
      const state = applyActions([
        { type: 'SET_FINDINGS_OPEN', value: true },
        { type: 'POINT_CLICK', index: 5 },
        { type: 'SET_FINDINGS_OPEN', value: false },
      ]);
      expect(state.isFindingsOpen).toBe(false);
      expect(state.isDataPanelOpen).toBe(true);
      expect(state.highlightRowIndex).toBe(5);
    });

    it('does not affect other panels when toggling one', () => {
      const start: EditorPanelState = {
        ...initialPanelState,
        isDataPanelOpen: true,
        isFindingsOpen: true,
      };
      const state = editorPanelReducer(start, { type: 'OPEN_PRESENTATION' });
      expect(state.isDataPanelOpen).toBe(true);
      expect(state.isFindingsOpen).toBe(true);
      expect(state.isPresentationMode).toBe(true);
    });
  });
});
