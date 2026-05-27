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
  activeView:
    | 'home'
    | 'frame'
    | 'analysis'
    | 'investigation'
    | 'improvement'
    | 'projects'
    | 'report'
    | 'charter'
    | 'sustainment';
  showFrame: () => void;
  showHome: () => void;
  showExplore: () => void;
  showAnalyze: () => void;
  showImprovement: () => void;
  showProjects: (projectId?: string) => void;
  showReport: () => void;
  showCharter: () => void;
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
  sustainmentTargetId: string | null;
  selectedProjectId: string | null;
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
 * Panel orchestration hook — backed by Zustand store.
 *
 * Maintains the same return interface as the original useReducer version
 * so App.tsx doesn't need to change. Side effects (keyboard, auto-clear,
 * resize) stay here since Zustand stores are pure state.
 *
 * Uses individual field selectors (never bare usePanelsStore()) to prevent
 * whole-store subscriptions from causing unnecessary re-renders and to
 * avoid React 19 "setState-in-render" warnings triggered by store-snapshot
 * tearing detection in concurrent / Strict Mode.
 */
export function useAppPanels(options: UseAppPanelsOptions): UseAppPanelsReturn {
  const { clearData, wideFormatDetection, dismissWideFormat } = options;

  // ── State fields (individual selectors — never bare usePanelsStore()) ──
  const activeView = usePanelsStore(s => s.activeView);
  const isSettingsOpen = usePanelsStore(s => s.isSettingsOpen);
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);
  const isFindingsOpen = usePanelsStore(s => s.isFindingsOpen);
  const highlightRowIndex = usePanelsStore(s => s.highlightRowIndex);
  const showExcludedOnly = usePanelsStore(s => s.showExcludedOnly);
  const showResetConfirm = usePanelsStore(s => s.showResetConfirm);
  const isWhatIfOpen = usePanelsStore(s => s.isWhatIfOpen);
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);
  const isPISidebarOpen = usePanelsStore(s => s.isPISidebarOpen);
  const openSpecEditorRequested = usePanelsStore(s => s.openSpecEditorRequested);
  const sustainmentTargetId = usePanelsStore(s => s.sustainmentTargetId);
  const selectedProjectId = usePanelsStore(s => s.selectedProjectId);

  // ── Action selectors (stable function references from the store) ──────
  const showFrame = usePanelsStore(s => s.showFrame);
  const showHome = usePanelsStore(s => s.showHome);
  const showExplore = usePanelsStore(s => s.showExplore);
  const showAnalyze = usePanelsStore(s => s.showAnalyze);
  const showImprovement = usePanelsStore(s => s.showImprovement);
  const showProjects = usePanelsStore(s => s.showProjects);
  const showReport = usePanelsStore(s => s.showReport);
  const showCharter = usePanelsStore(s => s.showCharter);
  const setSettingsOpen = usePanelsStore(s => s.setSettingsOpen);
  const setDataTableOpen = usePanelsStore(s => s.setDataTableOpen);
  const setFindingsOpen = usePanelsStore(s => s.setFindingsOpen);
  const toggleFindings = usePanelsStore(s => s.toggleFindings);
  const setWhatIfOpen = usePanelsStore(s => s.setWhatIfOpen);
  const togglePISidebar = usePanelsStore(s => s.togglePISidebar);
  const setHighlightRow = usePanelsStore(s => s.setHighlightRow);
  const setHighlightPoint = usePanelsStore(s => s.setHighlightPoint);
  const setShowExcludedOnly = usePanelsStore(s => s.setShowExcludedOnly);
  const setShowResetConfirm = usePanelsStore(s => s.setShowResetConfirm);
  const setOpenSpecEditorRequested = usePanelsStore(s => s.setOpenSpecEditorRequested);
  const confirmReset = usePanelsStore(s => s.confirmReset);
  const closeDataTable = usePanelsStore(s => s.closeDataTable);
  const openDataTableExcluded = usePanelsStore(s => s.openDataTableExcluded);
  const openDataTableAll = usePanelsStore(s => s.openDataTableAll);
  const openDataTableAtRowAction = usePanelsStore(s => s.openDataTableAtRow);

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
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (isSettingsOpen) setSettingsOpen(false);
        else if (isDataTableOpen) setDataTableOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    wideFormatDetection,
    showResetConfirm,
    isSettingsOpen,
    isDataTableOpen,
    dismissWideFormat,
    setShowResetConfirm,
    setSettingsOpen,
    setDataTableOpen,
  ]);

  // Auto-clear highlighted chart point after 2 seconds
  useEffect(() => {
    if (highlightedChartPoint === null) return;
    const timer = setTimeout(() => setHighlightPoint(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedChartPoint, setHighlightPoint]);

  // Compound actions that need isDesktop
  const openDataTableAtRow = useCallback(
    (index: number) => {
      openDataTableAtRowAction(index, isDesktop);
    },
    [openDataTableAtRowAction, isDesktop]
  );

  const handleResetConfirm = useCallback(() => {
    clearData();
    confirmReset();
  }, [clearData, confirmReset]);

  // Map store fields to legacy interface
  return {
    // Workspace navigation
    activeView,
    showHome,
    showFrame,
    showExplore,
    showAnalyze,
    showImprovement,
    showProjects,
    showReport,
    showCharter,

    // State (from store)
    isSettingsOpen,
    isDataTableOpen,
    isFindingsPanelOpen: isFindingsOpen,
    highlightRowIndex,
    showExcludedOnly,
    showResetConfirm,
    isWhatIfPageOpen: isWhatIfOpen,
    highlightedChartPoint,
    isDesktop,
    openSpecEditorRequested,
    sustainmentTargetId,
    selectedProjectId,
    isPISidebarOpen,

    // Setters (delegate to store)
    setIsSettingsOpen: setSettingsOpen,
    setIsDataTableOpen: setDataTableOpen,
    setIsFindingsPanelOpen: setFindingsOpen,
    setHighlightRowIndex: setHighlightRow,
    setShowExcludedOnly,
    setShowResetConfirm,
    setIsWhatIfPageOpen: setWhatIfOpen,
    setHighlightedChartPoint: setHighlightPoint,
    setOpenSpecEditorRequested,

    // Compound actions
    openDataTableAtRow,
    handleToggleFindingsPanel: toggleFindings,
    handleCloseFindingsPanel: () => setFindingsOpen(false),
    handleCloseDataTable: closeDataTable,
    openDataTableExcluded,
    openDataTableAll,
    handleResetRequest: () => setShowResetConfirm(true),
    handleResetConfirm,
    handleTogglePISidebar: togglePISidebar,
  };
}
