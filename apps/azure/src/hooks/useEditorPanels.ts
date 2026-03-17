import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import type { DisplayOptions, ViewState } from '@variscout/hooks';

type BoolSetter = React.Dispatch<React.SetStateAction<boolean>>;

// ── Reducer types ──────────────────────────────────────────────────────────

export interface EditorPanelState {
  isDataPanelOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isPresentationMode: boolean;
  isReportOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
}

export type EditorPanelAction =
  | { type: 'OPEN_DATA_PANEL' }
  | { type: 'CLOSE_DATA_PANEL' }
  | { type: 'TOGGLE_DATA_PANEL' }
  | { type: 'OPEN_DATA_TABLE' }
  | { type: 'CLOSE_DATA_TABLE' }
  | { type: 'SET_FINDINGS_OPEN'; value: boolean }
  | { type: 'TOGGLE_FINDINGS' }
  | { type: 'SET_COSCOUT_OPEN'; value: boolean }
  | { type: 'TOGGLE_COSCOUT' }
  | { type: 'SET_WHAT_IF_OPEN'; value: boolean }
  | { type: 'OPEN_PRESENTATION' }
  | { type: 'CLOSE_PRESENTATION' }
  | { type: 'OPEN_REPORT' }
  | { type: 'CLOSE_REPORT' }
  | { type: 'SET_HIGHLIGHT_ROW'; index: number | null }
  | { type: 'SET_HIGHLIGHT_POINT'; index: number | null }
  | { type: 'POINT_CLICK'; index: number }
  | { type: 'ROW_CLICK'; index: number };

/** Pure reducer — testable without React. */
export function editorPanelReducer(
  state: EditorPanelState,
  action: EditorPanelAction
): EditorPanelState {
  switch (action.type) {
    case 'OPEN_DATA_PANEL':
      return { ...state, isDataPanelOpen: true };
    case 'CLOSE_DATA_PANEL':
      return { ...state, isDataPanelOpen: false };
    case 'TOGGLE_DATA_PANEL':
      return { ...state, isDataPanelOpen: !state.isDataPanelOpen };
    case 'OPEN_DATA_TABLE':
      return { ...state, isDataTableOpen: true };
    case 'CLOSE_DATA_TABLE':
      return { ...state, isDataTableOpen: false };
    case 'SET_FINDINGS_OPEN':
      if (state.isFindingsOpen === action.value) return state;
      return { ...state, isFindingsOpen: action.value };
    case 'TOGGLE_FINDINGS':
      return { ...state, isFindingsOpen: !state.isFindingsOpen };
    case 'SET_COSCOUT_OPEN':
      if (state.isCoScoutOpen === action.value) return state;
      return { ...state, isCoScoutOpen: action.value };
    case 'TOGGLE_COSCOUT':
      return { ...state, isCoScoutOpen: !state.isCoScoutOpen };
    case 'SET_WHAT_IF_OPEN':
      return state.isWhatIfOpen === action.value ? state : { ...state, isWhatIfOpen: action.value };
    case 'OPEN_PRESENTATION':
      return { ...state, isPresentationMode: true, isReportOpen: false };
    case 'CLOSE_PRESENTATION':
      return { ...state, isPresentationMode: false };
    case 'OPEN_REPORT':
      return { ...state, isReportOpen: true, isPresentationMode: false };
    case 'CLOSE_REPORT':
      return { ...state, isReportOpen: false };
    case 'SET_HIGHLIGHT_ROW':
      return { ...state, highlightRowIndex: action.index };
    case 'SET_HIGHLIGHT_POINT':
      return { ...state, highlightedChartPoint: action.index };
    case 'POINT_CLICK':
      return {
        ...state,
        highlightRowIndex: action.index,
        isDataPanelOpen: true,
      };
    case 'ROW_CLICK':
      return { ...state, highlightedChartPoint: action.index };
    default:
      return state;
  }
}

export const initialPanelState: EditorPanelState = {
  isDataPanelOpen: false,
  isDataTableOpen: false,
  isFindingsOpen: false,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isPresentationMode: false,
  isReportOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
};

// ── Hook ───────────────────────────────────────────────────────────────────

export interface UseEditorPanelsOptions {
  displayOptions: DisplayOptions;
  setDisplayOptions: (opts: DisplayOptions) => void;
  /** Persisted view state from project load */
  viewState?: ViewState | null;
  /** Report view state changes for persistence */
  onViewStateChange?: (partial: Partial<ViewState>) => void;
}

export interface UseEditorPanelsReturn {
  isDataPanelOpen: boolean;
  setIsDataPanelOpen: BoolSetter;
  isDataTableOpen: boolean;
  setIsDataTableOpen: BoolSetter;
  isFindingsOpen: boolean;
  setIsFindingsOpen: BoolSetter;
  isCoScoutOpen: boolean;
  setIsCoScoutOpen: BoolSetter;
  isWhatIfOpen: boolean;
  setIsWhatIfOpen: BoolSetter;
  isPresentationMode: boolean;
  setIsPresentationMode: BoolSetter;
  isReportOpen: boolean;
  setIsReportOpen: BoolSetter;
  highlightRowIndex: number | null;
  setHighlightRowIndex: (v: number | null) => void;
  highlightedChartPoint: number | null;
  setHighlightedChartPoint: (v: number | null) => void;
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
}

/**
 * Manages panel visibility and chart/table highlight sync for the Azure Editor.
 *
 * Uses a reducer for predictable state transitions. Persistence for findings/whatIf
 * is handled via a useEffect side effect (replacing the old dual-setter wrapper pattern).
 */
export function useEditorPanels(options: UseEditorPanelsOptions): UseEditorPanelsReturn {
  const { viewState, onViewStateChange } = options;

  const [state, dispatch] = useReducer(editorPanelReducer, {
    ...initialPanelState,
    isFindingsOpen: viewState?.isFindingsOpen ?? false,
    isWhatIfOpen: viewState?.isWhatIfOpen ?? false,
  });

  // Persistence side effect: report findings/whatIf changes to view state
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip initial render to avoid persisting the initial values back
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onViewStateChange?.({
      isFindingsOpen: state.isFindingsOpen,
      isWhatIfOpen: state.isWhatIfOpen,
    });
  }, [state.isFindingsOpen, state.isWhatIfOpen, onViewStateChange]);

  // Row click highlight timeout side effect
  useEffect(() => {
    if (state.highlightedChartPoint === null) return;
    const timer = setTimeout(() => dispatch({ type: 'SET_HIGHLIGHT_POINT', index: null }), 2000);
    return () => clearTimeout(timer);
  }, [state.highlightedChartPoint]);

  // BoolSetter-compatible wrappers for backward compatibility with Editor.tsx
  // These support both direct values and functional updates (prev => !prev)
  const setIsDataPanelOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      // For functional updates, we need to use a dispatch that reads current state.
      // Since reducer is synchronous, we use TOGGLE for the prev => !prev pattern.
      dispatch({ type: 'TOGGLE_DATA_PANEL' });
    } else {
      dispatch(value ? { type: 'OPEN_DATA_PANEL' } : { type: 'CLOSE_DATA_PANEL' });
    }
  }, []);

  const setIsDataTableOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      // No toggle usage exists in Editor.tsx for data table, but handle gracefully
      // by dispatching based on the function's intent (not supported for arbitrary functions)
      dispatch({ type: 'OPEN_DATA_TABLE' });
    } else {
      dispatch(value ? { type: 'OPEN_DATA_TABLE' } : { type: 'CLOSE_DATA_TABLE' });
    }
  }, []);

  const setIsFindingsOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      dispatch({ type: 'TOGGLE_FINDINGS' });
    } else {
      dispatch({ type: 'SET_FINDINGS_OPEN', value });
    }
  }, []);

  const setIsCoScoutOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      dispatch({ type: 'TOGGLE_COSCOUT' });
    } else {
      dispatch({ type: 'SET_COSCOUT_OPEN', value });
    }
  }, []);

  const setIsWhatIfOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      // No toggle usage in Editor.tsx, but handle as toggle for safety
      dispatch({ type: 'SET_WHAT_IF_OPEN', value: true });
    } else {
      dispatch({ type: 'SET_WHAT_IF_OPEN', value });
    }
  }, []);

  const setIsPresentationMode: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      // No toggle usage in Editor.tsx
      dispatch({ type: 'OPEN_PRESENTATION' });
    } else {
      dispatch(value ? { type: 'OPEN_PRESENTATION' } : { type: 'CLOSE_PRESENTATION' });
    }
  }, []);

  const setIsReportOpen: BoolSetter = useCallback(value => {
    if (typeof value === 'function') {
      dispatch({ type: 'OPEN_REPORT' });
    } else {
      dispatch(value ? { type: 'OPEN_REPORT' } : { type: 'CLOSE_REPORT' });
    }
  }, []);

  const setHighlightRowIndex = useCallback((index: number | null) => {
    dispatch({ type: 'SET_HIGHLIGHT_ROW', index });
  }, []);

  const setHighlightedChartPoint = useCallback((index: number | null) => {
    dispatch({ type: 'SET_HIGHLIGHT_POINT', index });
  }, []);

  const handlePointClick = useCallback((index: number) => {
    dispatch({ type: 'POINT_CLICK', index });
  }, []);

  const handleRowClick = useCallback((index: number) => {
    dispatch({ type: 'ROW_CLICK', index });
  }, []);

  return {
    isDataPanelOpen: state.isDataPanelOpen,
    setIsDataPanelOpen,
    isDataTableOpen: state.isDataTableOpen,
    setIsDataTableOpen,
    isFindingsOpen: state.isFindingsOpen,
    setIsFindingsOpen,
    isCoScoutOpen: state.isCoScoutOpen,
    setIsCoScoutOpen,
    isWhatIfOpen: state.isWhatIfOpen,
    setIsWhatIfOpen,
    isPresentationMode: state.isPresentationMode,
    setIsPresentationMode,
    isReportOpen: state.isReportOpen,
    setIsReportOpen,
    highlightRowIndex: state.highlightRowIndex,
    setHighlightRowIndex,
    highlightedChartPoint: state.highlightedChartPoint,
    setHighlightedChartPoint,
    handlePointClick,
    handleRowClick,
  };
}
