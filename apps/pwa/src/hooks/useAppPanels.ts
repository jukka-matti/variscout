import { useState, useCallback, useEffect } from 'react';
import type { WideFormatDetection } from '@variscout/core';

/** Breakpoint for desktop panel (vs modal on mobile) */
const DESKTOP_BREAKPOINT = 1024;

export interface UseAppPanelsOptions {
  clearData: () => void;
  wideFormatDetection: WideFormatDetection | null;
  setWideFormatDetection: (v: WideFormatDetection | null) => void;
}

export interface UseAppPanelsReturn {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  isDataTableOpen: boolean;
  setIsDataTableOpen: (v: boolean) => void;
  isDataPanelOpen: boolean;
  setIsDataPanelOpen: (v: boolean) => void;
  isMindmapPanelOpen: boolean;
  setIsMindmapPanelOpen: (v: boolean) => void;
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
  handleToggleMindmapPanel: () => void;
  handleCloseMindmapPanel: () => void;
  handleCloseDataTable: () => void;
  handleCloseDataPanel: () => void;
  openDataTableExcluded: () => void;
  openDataTableAll: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
}

/**
 * Manages panel visibility, desktop breakpoint tracking,
 * keyboard shortcuts, and reset confirmation for the PWA shell.
 */
export function useAppPanels(options: UseAppPanelsOptions): UseAppPanelsReturn {
  const { clearData, wideFormatDetection, setWideFormatDetection } = options;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isMindmapPanelOpen, setIsMindmapPanelOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isWhatIfPageOpen, setIsWhatIfPageOpen] = useState(false);
  const [openSpecEditorRequested, setOpenSpecEditorRequested] = useState(false);
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

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
        if (wideFormatDetection) setWideFormatDetection(null);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isDataTableOpen) setIsDataTableOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    wideFormatDetection,
    showResetConfirm,
    isSettingsOpen,
    isDataTableOpen,
    setWideFormatDetection,
  ]);

  const openDataTableAtRow = useCallback(
    (index: number) => {
      setHighlightRowIndex(index);
      if (isDesktop) {
        setIsDataPanelOpen(true);
      } else {
        setIsDataTableOpen(true);
      }
    },
    [isDesktop]
  );

  const handleDataPanelRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    setTimeout(() => setHighlightedChartPoint(null), 2000);
  }, []);

  const handleToggleDataPanel = useCallback(() => {
    if (isDesktop) {
      setIsDataPanelOpen(prev => !prev);
    } else {
      setIsDataTableOpen(true);
    }
  }, [isDesktop]);

  const handleToggleMindmapPanel = useCallback(() => {
    setIsMindmapPanelOpen(prev => !prev);
  }, []);

  const handleCloseMindmapPanel = useCallback(() => {
    setIsMindmapPanelOpen(false);
  }, []);

  const handleCloseDataTable = useCallback(() => {
    setIsDataTableOpen(false);
    setHighlightRowIndex(null);
    setShowExcludedOnly(false);
  }, []);

  const handleCloseDataPanel = useCallback(() => {
    setIsDataPanelOpen(false);
    setHighlightRowIndex(null);
  }, []);

  const openDataTableExcluded = useCallback(() => {
    setShowExcludedOnly(true);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  const openDataTableAll = useCallback(() => {
    setShowExcludedOnly(false);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  const handleResetRequest = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    clearData();
    setShowResetConfirm(false);
  }, [clearData]);

  return {
    isSettingsOpen,
    setIsSettingsOpen,
    isDataTableOpen,
    setIsDataTableOpen,
    isDataPanelOpen,
    setIsDataPanelOpen,
    isMindmapPanelOpen,
    setIsMindmapPanelOpen,
    highlightRowIndex,
    setHighlightRowIndex,
    showExcludedOnly,
    setShowExcludedOnly,
    showResetConfirm,
    setShowResetConfirm,
    isPresentationMode,
    setIsPresentationMode,
    isWhatIfPageOpen,
    setIsWhatIfPageOpen,
    highlightedChartPoint,
    setHighlightedChartPoint,
    isDesktop,
    openSpecEditorRequested,
    setOpenSpecEditorRequested,
    openDataTableAtRow,
    handleDataPanelRowClick,
    handleToggleDataPanel,
    handleToggleMindmapPanel,
    handleCloseMindmapPanel,
    handleCloseDataTable,
    handleCloseDataPanel,
    openDataTableExcluded,
    openDataTableAll,
    handleResetRequest,
    handleResetConfirm,
  };
}
