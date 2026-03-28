import { useReducer, useCallback, useEffect, useState } from 'react';
import type { WideFormatDetection } from '@variscout/core';

/** Breakpoint for desktop panel (vs modal on mobile) */
const DESKTOP_BREAKPOINT = 1024;

// ── Reducer types ──────────────────────────────────────────────────────────

export interface AppPanelState {
  isSettingsOpen: boolean;
  isDataTableOpen: boolean;
  isDataPanelOpen: boolean;
  isFindingsPanelOpen: boolean;
  highlightRowIndex: number | null;
  showExcludedOnly: boolean;
  showResetConfirm: boolean;
  isPresentationMode: boolean;
  isWhatIfPageOpen: boolean;
  openSpecEditorRequested: boolean;
  highlightedChartPoint: number | null;
  isStatsSidebarOpen: boolean;
}

export type AppPanelAction =
  | { type: 'SET_SETTINGS'; value: boolean }
  | { type: 'SET_DATA_TABLE'; value: boolean }
  | { type: 'SET_DATA_PANEL'; value: boolean }
  | { type: 'TOGGLE_DATA_PANEL_DESKTOP' }
  | { type: 'SET_FINDINGS_PANEL'; value: boolean }
  | { type: 'TOGGLE_FINDINGS_PANEL' }
  | { type: 'SET_HIGHLIGHT_ROW'; index: number | null }
  | { type: 'SET_EXCLUDED_ONLY'; value: boolean }
  | { type: 'SET_RESET_CONFIRM'; value: boolean }
  | { type: 'SET_PRESENTATION'; value: boolean }
  | { type: 'SET_WHAT_IF'; value: boolean }
  | { type: 'SET_SPEC_EDITOR_REQUESTED'; value: boolean }
  | { type: 'SET_HIGHLIGHT_POINT'; index: number | null }
  | { type: 'OPEN_DATA_TABLE_AT_ROW_DESKTOP'; index: number }
  | { type: 'OPEN_DATA_TABLE_AT_ROW_MOBILE'; index: number }
  | { type: 'CLOSE_DATA_TABLE' }
  | { type: 'CLOSE_DATA_PANEL' }
  | { type: 'OPEN_DATA_TABLE_EXCLUDED' }
  | { type: 'OPEN_DATA_TABLE_ALL' }
  | { type: 'RESET_CONFIRM' }
  | { type: 'TOGGLE_STATS_SIDEBAR' };

export const initialPanelState: AppPanelState = {
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
};

/** Pure reducer — testable without React. */
export function appPanelReducer(state: AppPanelState, action: AppPanelAction): AppPanelState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return state.isSettingsOpen === action.value
        ? state
        : { ...state, isSettingsOpen: action.value };
    case 'SET_DATA_TABLE':
      return state.isDataTableOpen === action.value
        ? state
        : { ...state, isDataTableOpen: action.value };
    case 'SET_DATA_PANEL':
      return state.isDataPanelOpen === action.value
        ? state
        : { ...state, isDataPanelOpen: action.value };
    case 'TOGGLE_DATA_PANEL_DESKTOP':
      return { ...state, isDataPanelOpen: !state.isDataPanelOpen };
    case 'SET_FINDINGS_PANEL':
      return state.isFindingsPanelOpen === action.value
        ? state
        : { ...state, isFindingsPanelOpen: action.value };
    case 'TOGGLE_FINDINGS_PANEL':
      return { ...state, isFindingsPanelOpen: !state.isFindingsPanelOpen };
    case 'SET_HIGHLIGHT_ROW':
      return { ...state, highlightRowIndex: action.index };
    case 'SET_EXCLUDED_ONLY':
      return { ...state, showExcludedOnly: action.value };
    case 'SET_RESET_CONFIRM':
      return { ...state, showResetConfirm: action.value };
    case 'SET_PRESENTATION':
      return state.isPresentationMode === action.value
        ? state
        : { ...state, isPresentationMode: action.value };
    case 'SET_WHAT_IF':
      return state.isWhatIfPageOpen === action.value
        ? state
        : { ...state, isWhatIfPageOpen: action.value };
    case 'SET_SPEC_EDITOR_REQUESTED':
      return { ...state, openSpecEditorRequested: action.value };
    case 'SET_HIGHLIGHT_POINT':
      return { ...state, highlightedChartPoint: action.index };
    // Compound actions — set multiple fields atomically
    case 'OPEN_DATA_TABLE_AT_ROW_DESKTOP':
      return { ...state, highlightRowIndex: action.index, isDataPanelOpen: true };
    case 'OPEN_DATA_TABLE_AT_ROW_MOBILE':
      return { ...state, highlightRowIndex: action.index, isDataTableOpen: true };
    case 'CLOSE_DATA_TABLE':
      return { ...state, isDataTableOpen: false, highlightRowIndex: null, showExcludedOnly: false };
    case 'CLOSE_DATA_PANEL':
      return { ...state, isDataPanelOpen: false, highlightRowIndex: null };
    case 'OPEN_DATA_TABLE_EXCLUDED':
      return { ...state, showExcludedOnly: true, highlightRowIndex: null, isDataTableOpen: true };
    case 'OPEN_DATA_TABLE_ALL':
      return { ...state, showExcludedOnly: false, highlightRowIndex: null, isDataTableOpen: true };
    case 'RESET_CONFIRM':
      return { ...state, showResetConfirm: false };
    case 'TOGGLE_STATS_SIDEBAR':
      return { ...state, isStatsSidebarOpen: !state.isStatsSidebarOpen };
    default:
      return state;
  }
}

// ── Hook interface ─────────────────────────────────────────────────────────

export interface UseAppPanelsOptions {
  clearData: () => void;
  wideFormatDetection: WideFormatDetection | null;
  dismissWideFormat: () => void;
}

export interface UseAppPanelsReturn {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  isDataTableOpen: boolean;
  setIsDataTableOpen: (v: boolean) => void;
  isDataPanelOpen: boolean;
  setIsDataPanelOpen: (v: boolean) => void;
  isFindingsPanelOpen: boolean;
  setIsFindingsPanelOpen: (v: boolean) => void;
  highlightRowIndex: number | null;
  setHighlightRowIndex: (v: number | null) => void;
  showExcludedOnly: boolean;
  setShowExcludedOnly: (v: boolean) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (v: boolean) => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (v: boolean) => void;
  isWhatIfPageOpen: boolean;
  setIsWhatIfPageOpen: (v: boolean) => void;
  highlightedChartPoint: number | null;
  setHighlightedChartPoint: (v: number | null) => void;
  isDesktop: boolean;
  openSpecEditorRequested: boolean;
  setOpenSpecEditorRequested: (v: boolean) => void;
  openDataTableAtRow: (index: number) => void;
  handleDataPanelRowClick: (index: number) => void;
  handleToggleDataPanel: () => void;
  handleToggleFindingsPanel: () => void;
  handleCloseFindingsPanel: () => void;
  handleCloseDataTable: () => void;
  handleCloseDataPanel: () => void;
  openDataTableExcluded: () => void;
  openDataTableAll: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
  isStatsSidebarOpen: boolean;
  handleToggleStatsSidebar: () => void;
}

/**
 * Manages panel visibility, desktop breakpoint tracking,
 * keyboard shortcuts, and reset confirmation for the PWA shell.
 */
export function useAppPanels(options: UseAppPanelsOptions): UseAppPanelsReturn {
  const { clearData, wideFormatDetection, dismissWideFormat } = options;

  const [state, dispatch] = useReducer(appPanelReducer, initialPanelState);

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  // Track desktop/mobile for panel behavior
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (wideFormatDetection) dismissWideFormat();
        else if (state.showResetConfirm) dispatch({ type: 'SET_RESET_CONFIRM', value: false });
        else if (state.isSettingsOpen) dispatch({ type: 'SET_SETTINGS', value: false });
        else if (state.isDataTableOpen) dispatch({ type: 'SET_DATA_TABLE', value: false });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    wideFormatDetection,
    state.showResetConfirm,
    state.isSettingsOpen,
    state.isDataTableOpen,
    dismissWideFormat,
  ]);

  // Auto-clear highlighted chart point after 2 seconds
  useEffect(() => {
    if (state.highlightedChartPoint === null) return;
    const timer = setTimeout(() => dispatch({ type: 'SET_HIGHLIGHT_POINT', index: null }), 2000);
    return () => clearTimeout(timer);
  }, [state.highlightedChartPoint]);

  // ── Setter wrappers (compatible with existing App.tsx interface) ──────────

  const setIsSettingsOpen = useCallback(
    (v: boolean) => dispatch({ type: 'SET_SETTINGS', value: v }),
    []
  );
  const setIsDataTableOpen = useCallback(
    (v: boolean) => dispatch({ type: 'SET_DATA_TABLE', value: v }),
    []
  );
  const setIsDataPanelOpen = useCallback(
    (v: boolean) => dispatch({ type: 'SET_DATA_PANEL', value: v }),
    []
  );
  const setIsFindingsPanelOpen = useCallback(
    (v: boolean) => dispatch({ type: 'SET_FINDINGS_PANEL', value: v }),
    []
  );
  const setHighlightRowIndex = useCallback(
    (v: number | null) => dispatch({ type: 'SET_HIGHLIGHT_ROW', index: v }),
    []
  );
  const setShowExcludedOnly = useCallback(
    (v: boolean) => dispatch({ type: 'SET_EXCLUDED_ONLY', value: v }),
    []
  );
  const setShowResetConfirm = useCallback(
    (v: boolean) => dispatch({ type: 'SET_RESET_CONFIRM', value: v }),
    []
  );
  const setIsPresentationMode = useCallback(
    (v: boolean) => dispatch({ type: 'SET_PRESENTATION', value: v }),
    []
  );
  const setIsWhatIfPageOpen = useCallback(
    (v: boolean) => dispatch({ type: 'SET_WHAT_IF', value: v }),
    []
  );
  const setOpenSpecEditorRequested = useCallback(
    (v: boolean) => dispatch({ type: 'SET_SPEC_EDITOR_REQUESTED', value: v }),
    []
  );
  const setHighlightedChartPoint = useCallback(
    (v: number | null) => dispatch({ type: 'SET_HIGHLIGHT_POINT', index: v }),
    []
  );

  // ── Compound action callbacks ────────────────────────────────────────────

  const openDataTableAtRow = useCallback(
    (index: number) => {
      dispatch(
        isDesktop
          ? { type: 'OPEN_DATA_TABLE_AT_ROW_DESKTOP', index }
          : { type: 'OPEN_DATA_TABLE_AT_ROW_MOBILE', index }
      );
    },
    [isDesktop]
  );

  const handleDataPanelRowClick = useCallback((index: number) => {
    dispatch({ type: 'SET_HIGHLIGHT_POINT', index });
    // Auto-clear is handled by the useEffect above
  }, []);

  const handleToggleDataPanel = useCallback(() => {
    if (isDesktop) {
      dispatch({ type: 'TOGGLE_DATA_PANEL_DESKTOP' });
    } else {
      dispatch({ type: 'SET_DATA_TABLE', value: true });
    }
  }, [isDesktop]);

  const handleToggleFindingsPanel = useCallback(
    () => dispatch({ type: 'TOGGLE_FINDINGS_PANEL' }),
    []
  );

  const handleToggleStatsSidebar = useCallback(
    () => dispatch({ type: 'TOGGLE_STATS_SIDEBAR' }),
    []
  );

  const handleCloseFindingsPanel = useCallback(
    () => dispatch({ type: 'SET_FINDINGS_PANEL', value: false }),
    []
  );

  const handleCloseDataTable = useCallback(() => dispatch({ type: 'CLOSE_DATA_TABLE' }), []);

  const handleCloseDataPanel = useCallback(() => dispatch({ type: 'CLOSE_DATA_PANEL' }), []);

  const openDataTableExcluded = useCallback(
    () => dispatch({ type: 'OPEN_DATA_TABLE_EXCLUDED' }),
    []
  );

  const openDataTableAll = useCallback(() => dispatch({ type: 'OPEN_DATA_TABLE_ALL' }), []);

  const handleResetRequest = useCallback(
    () => dispatch({ type: 'SET_RESET_CONFIRM', value: true }),
    []
  );

  const handleResetConfirm = useCallback(() => {
    clearData();
    dispatch({ type: 'RESET_CONFIRM' });
  }, [clearData]);

  return {
    ...state,
    isDesktop,
    // Setter wrappers
    setIsSettingsOpen,
    setIsDataTableOpen,
    setIsDataPanelOpen,
    setIsFindingsPanelOpen,
    setHighlightRowIndex,
    setShowExcludedOnly,
    setShowResetConfirm,
    setIsPresentationMode,
    setIsWhatIfPageOpen,
    setHighlightedChartPoint,
    setOpenSpecEditorRequested,
    // Compound action callbacks
    openDataTableAtRow,
    handleDataPanelRowClick,
    handleToggleDataPanel,
    handleToggleFindingsPanel,
    handleCloseFindingsPanel,
    handleCloseDataTable,
    handleCloseDataPanel,
    openDataTableExcluded,
    openDataTableAll,
    handleResetRequest,
    handleResetConfirm,
    isStatsSidebarOpen: state.isStatsSidebarOpen,
    handleToggleStatsSidebar,
  };
}
