import React, { useState, useCallback } from 'react';
import type { DisplayOptions, ViewState } from '@variscout/hooks';

type BoolSetter = React.Dispatch<React.SetStateAction<boolean>>;

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
  isWhatIfOpen: boolean;
  setIsWhatIfOpen: BoolSetter;
  isPresentationMode: boolean;
  setIsPresentationMode: BoolSetter;
  highlightRowIndex: number | null;
  setHighlightRowIndex: (v: number | null) => void;
  highlightedChartPoint: number | null;
  setHighlightedChartPoint: (v: number | null) => void;
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
}

/**
 * Manages panel visibility and chart/table highlight sync for the Azure Editor.
 */
export function useEditorPanels(options: UseEditorPanelsOptions): UseEditorPanelsReturn {
  const { viewState, onViewStateChange } = options;

  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isFindingsOpen, setIsFindingsOpenRaw] = useState(viewState?.isFindingsOpen ?? false);
  const [isWhatIfOpen, setIsWhatIfOpenRaw] = useState(viewState?.isWhatIfOpen ?? false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Wrap findings/whatif setters to report changes for persistence
  const setIsFindingsOpen: BoolSetter = useCallback(
    value => {
      setIsFindingsOpenRaw(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        onViewStateChange?.({ isFindingsOpen: next });
        return next;
      });
    },
    [onViewStateChange]
  );

  const setIsWhatIfOpen: BoolSetter = useCallback(
    value => {
      setIsWhatIfOpenRaw(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        onViewStateChange?.({ isWhatIfOpen: next });
        return next;
      });
    },
    [onViewStateChange]
  );
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

  // Chart point click -> highlight row in data panel
  const handlePointClick = useCallback(
    (index: number) => {
      setHighlightRowIndex(index);
      if (!isDataPanelOpen) {
        setIsDataPanelOpen(true);
      }
    },
    [isDataPanelOpen]
  );

  // Data panel row click -> highlight point in chart
  const handleRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    setTimeout(() => setHighlightedChartPoint(null), 2000);
  }, []);

  return {
    isDataPanelOpen,
    setIsDataPanelOpen,
    isDataTableOpen,
    setIsDataTableOpen,
    isFindingsOpen,
    setIsFindingsOpen,
    isWhatIfOpen,
    setIsWhatIfOpen,
    isPresentationMode,
    setIsPresentationMode,
    highlightRowIndex,
    setHighlightRowIndex,
    highlightedChartPoint,
    setHighlightedChartPoint,
    handlePointClick,
    handleRowClick,
  };
}
