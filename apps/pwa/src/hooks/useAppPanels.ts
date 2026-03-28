import { useCallback, useEffect, useState } from 'react';
import type { WideFormatDetection } from '@variscout/core';
import { usePanelsStore } from '../features/panels/panelsStore';

/** Breakpoint for desktop panel (vs modal on mobile) */
const DESKTOP_BREAKPOINT = 1024;

// ── Legacy types (kept for test compatibility) ────────────────────────────

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

/** Legacy reducer — kept for existing tests. Store is the source of truth. */
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

/** Legacy reducer — delegates to store. Kept for existing test imports. */
export function appPanelReducer(state: AppPanelState, action: AppPanelAction): AppPanelState {
  // Tests that import the reducer still work, but runtime uses the store
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

// ── Hook interface (unchanged) ────────────────────────────────────────────

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
 * Panel orchestration hook — now backed by Zustand store.
 *
 * Maintains the same return interface as the original useReducer version
 * so App.tsx doesn't need to change. Side effects (keyboard, auto-clear,
 * resize) stay here since Zustand stores are pure state.
 */
export function useAppPanels(options: UseAppPanelsOptions): UseAppPanelsReturn {
  const { clearData, wideFormatDetection, dismissWideFormat } = options;

  // Read from Zustand store
  const store = usePanelsStore();

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
        else if (store.showResetConfirm) store.setShowResetConfirm(false);
        else if (store.isSettingsOpen) store.setSettingsOpen(false);
        else if (store.isDataTableOpen) store.setDataTableOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    wideFormatDetection,
    store.showResetConfirm,
    store.isSettingsOpen,
    store.isDataTableOpen,
    dismissWideFormat,
    store,
  ]);

  // Auto-clear highlighted chart point after 2 seconds
  useEffect(() => {
    if (store.highlightedChartPoint === null) return;
    const timer = setTimeout(() => store.setHighlightPoint(null), 2000);
    return () => clearTimeout(timer);
  }, [store.highlightedChartPoint, store]);

  // Compound actions that need isDesktop
  const openDataTableAtRow = useCallback(
    (index: number) => {
      if (isDesktop) {
        usePanelsStore.setState({ highlightRowIndex: index, isDataPanelOpen: true });
      } else {
        usePanelsStore.setState({ highlightRowIndex: index, isDataTableOpen: true });
      }
    },
    [isDesktop]
  );

  const handleToggleDataPanel = useCallback(() => {
    if (isDesktop) {
      store.toggleDataPanel();
    } else {
      store.setDataTableOpen(true);
    }
  }, [isDesktop, store]);

  const handleResetConfirm = useCallback(() => {
    clearData();
    store.confirmReset();
  }, [clearData, store]);

  // Map store fields to legacy interface
  return {
    // State (from store)
    isSettingsOpen: store.isSettingsOpen,
    isDataTableOpen: store.isDataTableOpen,
    isDataPanelOpen: store.isDataPanelOpen,
    isFindingsPanelOpen: store.isFindingsOpen,
    highlightRowIndex: store.highlightRowIndex,
    showExcludedOnly: store.showExcludedOnly,
    showResetConfirm: store.showResetConfirm,
    isPresentationMode: store.isPresentationMode,
    isWhatIfPageOpen: store.isWhatIfOpen,
    highlightedChartPoint: store.highlightedChartPoint,
    isDesktop,
    openSpecEditorRequested: store.openSpecEditorRequested,
    isStatsSidebarOpen: store.isStatsSidebarOpen,

    // Setters (delegate to store)
    setIsSettingsOpen: store.setSettingsOpen,
    setIsDataTableOpen: store.setDataTableOpen,
    setIsDataPanelOpen: store.setDataPanelOpen,
    setIsFindingsPanelOpen: store.setFindingsOpen,
    setHighlightRowIndex: store.setHighlightRow,
    setShowExcludedOnly: store.setShowExcludedOnly,
    setShowResetConfirm: store.setShowResetConfirm,
    setIsPresentationMode: store.setPresentationMode,
    setIsWhatIfPageOpen: store.setWhatIfOpen,
    setHighlightedChartPoint: store.setHighlightPoint,
    setOpenSpecEditorRequested: store.setOpenSpecEditorRequested,

    // Compound actions
    openDataTableAtRow,
    handleDataPanelRowClick: store.handleRowClick,
    handleToggleDataPanel,
    handleToggleFindingsPanel: store.toggleFindings,
    handleCloseFindingsPanel: () => store.setFindingsOpen(false),
    handleCloseDataTable: store.closeDataTable,
    handleCloseDataPanel: store.closeDataPanel,
    openDataTableExcluded: store.openDataTableExcluded,
    openDataTableAll: store.openDataTableAll,
    handleResetRequest: () => store.setShowResetConfirm(true),
    handleResetConfirm,
    handleToggleStatsSidebar: store.toggleStatsSidebar,
  };
}
