import { useCallback, useEffect, useState } from 'react';
import type { WideFormatDetection } from '@variscout/core';
import { usePanelsStore } from '../features/panels/panelsStore';

/** Breakpoint for desktop panel (vs modal on mobile) */
const DESKTOP_BREAKPOINT = 1024;

// ── Hook interface ────────────────────────────────────────────────────────

export interface UseAppPanelsOptions {
  clearData: () => void;
  wideFormatDetection: WideFormatDetection | null;
  dismissWideFormat: () => void;
}

export interface UseAppPanelsReturn {
  activeView: 'frame' | 'analysis' | 'investigation' | 'improvement' | 'report';
  showFrame: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  isDataTableOpen: boolean;
  setIsDataTableOpen: (v: boolean) => void;
  isFindingsPanelOpen: boolean;
  setIsFindingsPanelOpen: (v: boolean) => void;
  highlightRowIndex: number | null;
  setHighlightRowIndex: (v: number | null) => void;
  showExcludedOnly: boolean;
  setShowExcludedOnly: (v: boolean) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (v: boolean) => void;
  isWhatIfPageOpen: boolean;
  setIsWhatIfPageOpen: (v: boolean) => void;
  highlightedChartPoint: number | null;
  setHighlightedChartPoint: (v: number | null) => void;
  isDesktop: boolean;
  openSpecEditorRequested: boolean;
  setOpenSpecEditorRequested: (v: boolean) => void;
  openDataTableAtRow: (index: number) => void;
  handleToggleFindingsPanel: () => void;
  handleCloseFindingsPanel: () => void;
  handleCloseDataTable: () => void;
  openDataTableExcluded: () => void;
  openDataTableAll: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
  isPISidebarOpen: boolean;
  handleTogglePISidebar: () => void;
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
        usePanelsStore.setState({ highlightRowIndex: index, isPISidebarOpen: true });
      } else {
        usePanelsStore.setState({ highlightRowIndex: index, isDataTableOpen: true });
      }
    },
    [isDesktop]
  );

  const handleResetConfirm = useCallback(() => {
    clearData();
    store.confirmReset();
  }, [clearData, store]);

  // Map store fields to legacy interface
  return {
    // Workspace navigation
    activeView: store.activeView,
    showFrame: store.showFrame,
    showAnalysis: store.showAnalysis,
    showInvestigation: store.showInvestigation,
    showImprovement: store.showImprovement,
    showReport: store.showReport,

    // State (from store)
    isSettingsOpen: store.isSettingsOpen,
    isDataTableOpen: store.isDataTableOpen,
    isFindingsPanelOpen: store.isFindingsOpen,
    highlightRowIndex: store.highlightRowIndex,
    showExcludedOnly: store.showExcludedOnly,
    showResetConfirm: store.showResetConfirm,
    isWhatIfPageOpen: store.isWhatIfOpen,
    highlightedChartPoint: store.highlightedChartPoint,
    isDesktop,
    openSpecEditorRequested: store.openSpecEditorRequested,
    isPISidebarOpen: store.isPISidebarOpen,

    // Setters (delegate to store)
    setIsSettingsOpen: store.setSettingsOpen,
    setIsDataTableOpen: store.setDataTableOpen,
    setIsFindingsPanelOpen: store.setFindingsOpen,
    setHighlightRowIndex: store.setHighlightRow,
    setShowExcludedOnly: store.setShowExcludedOnly,
    setShowResetConfirm: store.setShowResetConfirm,
    setIsWhatIfPageOpen: store.setWhatIfOpen,
    setHighlightedChartPoint: store.setHighlightPoint,
    setOpenSpecEditorRequested: store.setOpenSpecEditorRequested,

    // Compound actions
    openDataTableAtRow,
    handleToggleFindingsPanel: store.toggleFindings,
    handleCloseFindingsPanel: () => store.setFindingsOpen(false),
    handleCloseDataTable: store.closeDataTable,
    openDataTableExcluded: store.openDataTableExcluded,
    openDataTableAll: store.openDataTableAll,
    handleResetRequest: () => store.setShowResetConfirm(true),
    handleResetConfirm,
    handleTogglePISidebar: store.togglePISidebar,
  };
}
