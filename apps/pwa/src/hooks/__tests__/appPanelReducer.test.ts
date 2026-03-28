import { describe, it, expect } from 'vitest';
import {
  appPanelReducer,
  initialPanelState,
  type AppPanelState,
  type AppPanelAction,
} from '../useAppPanels';

/** Helper to apply a sequence of actions to the initial state. */
function applyActions(actions: AppPanelAction[], start = initialPanelState): AppPanelState {
  return actions.reduce(appPanelReducer, start);
}

describe('appPanelReducer', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      expect(initialPanelState).toEqual({
        isSettingsOpen: false,
        isDataTableOpen: false,
        isDataPanelOpen: false,
        isFindingsPanelOpen: false,
        highlightRowIndex: null,
        showExcludedOnly: false,
        showResetConfirm: false,
        isPresentationMode: false,
        isWhatIfPageOpen: false,
        openSpecEditorRequested: false,
        highlightedChartPoint: null,
        isStatsSidebarOpen: false,
      });
    });
  });

  describe('simple setters', () => {
    it('SET_SETTINGS opens/closes settings', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_SETTINGS', value: true });
      expect(s1.isSettingsOpen).toBe(true);
      const s2 = appPanelReducer(s1, { type: 'SET_SETTINGS', value: false });
      expect(s2.isSettingsOpen).toBe(false);
    });

    it('SET_SETTINGS returns same reference when value unchanged', () => {
      const state = appPanelReducer(initialPanelState, { type: 'SET_SETTINGS', value: false });
      expect(state).toBe(initialPanelState);
    });

    it('SET_DATA_TABLE opens/closes data table', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_DATA_TABLE', value: true });
      expect(s1.isDataTableOpen).toBe(true);
    });

    it('SET_DATA_PANEL opens/closes data panel', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_DATA_PANEL', value: true });
      expect(s1.isDataPanelOpen).toBe(true);
    });

    it('SET_FINDINGS_PANEL opens/closes findings panel', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_FINDINGS_PANEL', value: true });
      expect(s1.isFindingsPanelOpen).toBe(true);
    });

    it('SET_PRESENTATION enters/exits presentation mode', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_PRESENTATION', value: true });
      expect(s1.isPresentationMode).toBe(true);
      const s2 = appPanelReducer(s1, { type: 'SET_PRESENTATION', value: false });
      expect(s2.isPresentationMode).toBe(false);
    });

    it('SET_WHAT_IF opens/closes what-if page', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_WHAT_IF', value: true });
      expect(s1.isWhatIfPageOpen).toBe(true);
    });

    it('SET_EXCLUDED_ONLY toggles excluded filter', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_EXCLUDED_ONLY', value: true });
      expect(s1.showExcludedOnly).toBe(true);
    });

    it('SET_RESET_CONFIRM shows/hides confirm dialog', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'SET_RESET_CONFIRM', value: true });
      expect(s1.showResetConfirm).toBe(true);
    });

    it('SET_SPEC_EDITOR_REQUESTED sets request flag', () => {
      const s1 = appPanelReducer(initialPanelState, {
        type: 'SET_SPEC_EDITOR_REQUESTED',
        value: true,
      });
      expect(s1.openSpecEditorRequested).toBe(true);
    });
  });

  describe('highlight actions', () => {
    it('SET_HIGHLIGHT_ROW sets row index', () => {
      const state = appPanelReducer(initialPanelState, { type: 'SET_HIGHLIGHT_ROW', index: 5 });
      expect(state.highlightRowIndex).toBe(5);
    });

    it('SET_HIGHLIGHT_ROW clears with null', () => {
      const state = applyActions([
        { type: 'SET_HIGHLIGHT_ROW', index: 5 },
        { type: 'SET_HIGHLIGHT_ROW', index: null },
      ]);
      expect(state.highlightRowIndex).toBeNull();
    });

    it('SET_HIGHLIGHT_POINT sets chart point index', () => {
      const state = appPanelReducer(initialPanelState, { type: 'SET_HIGHLIGHT_POINT', index: 3 });
      expect(state.highlightedChartPoint).toBe(3);
    });
  });

  describe('toggle actions', () => {
    it('TOGGLE_DATA_PANEL_DESKTOP toggles data panel', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'TOGGLE_DATA_PANEL_DESKTOP' });
      expect(s1.isDataPanelOpen).toBe(true);
      const s2 = appPanelReducer(s1, { type: 'TOGGLE_DATA_PANEL_DESKTOP' });
      expect(s2.isDataPanelOpen).toBe(false);
    });

    it('TOGGLE_FINDINGS_PANEL toggles findings panel', () => {
      const s1 = appPanelReducer(initialPanelState, { type: 'TOGGLE_FINDINGS_PANEL' });
      expect(s1.isFindingsPanelOpen).toBe(true);
      const s2 = appPanelReducer(s1, { type: 'TOGGLE_FINDINGS_PANEL' });
      expect(s2.isFindingsPanelOpen).toBe(false);
    });
  });

  describe('compound actions', () => {
    it('OPEN_DATA_TABLE_AT_ROW_DESKTOP sets highlight and opens data panel', () => {
      const state = appPanelReducer(initialPanelState, {
        type: 'OPEN_DATA_TABLE_AT_ROW_DESKTOP',
        index: 7,
      });
      expect(state.highlightRowIndex).toBe(7);
      expect(state.isDataPanelOpen).toBe(true);
      expect(state.isDataTableOpen).toBe(false); // not mobile
    });

    it('OPEN_DATA_TABLE_AT_ROW_MOBILE sets highlight and opens data table', () => {
      const state = appPanelReducer(initialPanelState, {
        type: 'OPEN_DATA_TABLE_AT_ROW_MOBILE',
        index: 3,
      });
      expect(state.highlightRowIndex).toBe(3);
      expect(state.isDataTableOpen).toBe(true);
      expect(state.isDataPanelOpen).toBe(false);
    });

    it('CLOSE_DATA_TABLE clears table, highlight, and excluded filter', () => {
      const state = applyActions([
        { type: 'SET_DATA_TABLE', value: true },
        { type: 'SET_HIGHLIGHT_ROW', index: 5 },
        { type: 'SET_EXCLUDED_ONLY', value: true },
        { type: 'CLOSE_DATA_TABLE' },
      ]);
      expect(state.isDataTableOpen).toBe(false);
      expect(state.highlightRowIndex).toBeNull();
      expect(state.showExcludedOnly).toBe(false);
    });

    it('CLOSE_DATA_PANEL clears panel and highlight', () => {
      const state = applyActions([
        { type: 'SET_DATA_PANEL', value: true },
        { type: 'SET_HIGHLIGHT_ROW', index: 2 },
        { type: 'CLOSE_DATA_PANEL' },
      ]);
      expect(state.isDataPanelOpen).toBe(false);
      expect(state.highlightRowIndex).toBeNull();
    });

    it('OPEN_DATA_TABLE_EXCLUDED opens table with excluded filter', () => {
      const state = appPanelReducer(initialPanelState, { type: 'OPEN_DATA_TABLE_EXCLUDED' });
      expect(state.isDataTableOpen).toBe(true);
      expect(state.showExcludedOnly).toBe(true);
      expect(state.highlightRowIndex).toBeNull();
    });

    it('OPEN_DATA_TABLE_ALL opens table without excluded filter', () => {
      const state = appPanelReducer(
        { ...initialPanelState, showExcludedOnly: true },
        { type: 'OPEN_DATA_TABLE_ALL' }
      );
      expect(state.isDataTableOpen).toBe(true);
      expect(state.showExcludedOnly).toBe(false);
      expect(state.highlightRowIndex).toBeNull();
    });

    it('RESET_CONFIRM clears the confirm dialog', () => {
      const state = applyActions([
        { type: 'SET_RESET_CONFIRM', value: true },
        { type: 'RESET_CONFIRM' },
      ]);
      expect(state.showResetConfirm).toBe(false);
    });
  });

  describe('reference equality optimization', () => {
    it('SET_PRESENTATION returns same reference when value unchanged', () => {
      const state = { ...initialPanelState, isPresentationMode: true };
      const next = appPanelReducer(state, { type: 'SET_PRESENTATION', value: true });
      expect(next).toBe(state);
    });

    it('SET_WHAT_IF returns same reference when value unchanged', () => {
      const state = { ...initialPanelState, isWhatIfPageOpen: true };
      const next = appPanelReducer(state, { type: 'SET_WHAT_IF', value: true });
      expect(next).toBe(state);
    });

    it('SET_FINDINGS_PANEL returns same reference when value unchanged', () => {
      const next = appPanelReducer(initialPanelState, { type: 'SET_FINDINGS_PANEL', value: false });
      expect(next).toBe(initialPanelState);
    });
  });

  describe('coexisting panels', () => {
    it('findings and data panel can both be open', () => {
      const state = applyActions([
        { type: 'SET_FINDINGS_PANEL', value: true },
        { type: 'SET_DATA_PANEL', value: true },
      ]);
      expect(state.isFindingsPanelOpen).toBe(true);
      expect(state.isDataPanelOpen).toBe(true);
    });

    it('settings does not close other panels', () => {
      const state = applyActions([
        { type: 'SET_FINDINGS_PANEL', value: true },
        { type: 'SET_SETTINGS', value: true },
      ]);
      expect(state.isFindingsPanelOpen).toBe(true);
      expect(state.isSettingsOpen).toBe(true);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const state = appPanelReducer(initialPanelState, { type: 'UNKNOWN' } as never);
      expect(state).toBe(initialPanelState);
    });
  });
});
