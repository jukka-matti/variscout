import React, { useState, useCallback, useMemo } from 'react';
import type { DisplayOptions } from '@variscout/hooks';

type BoolSetter = React.Dispatch<React.SetStateAction<boolean>>;

export interface UseEditorPanelsOptions {
  displayOptions: DisplayOptions;
  setDisplayOptions: (opts: DisplayOptions) => void;
}

export interface UseEditorPanelsReturn {
  isDataPanelOpen: boolean;
  setIsDataPanelOpen: BoolSetter;
  isDataTableOpen: boolean;
  setIsDataTableOpen: BoolSetter;
  isMindmapOpen: boolean;
  setIsMindmapOpen: BoolSetter;
  isWhatIfOpen: boolean;
  setIsWhatIfOpen: BoolSetter;
  highlightRowIndex: number | null;
  setHighlightRowIndex: (v: number | null) => void;
  highlightedChartPoint: number | null;
  setHighlightedChartPoint: (v: number | null) => void;
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  mindmapAnnotations: Map<number, string>;
  setMindmapAnnotations: (annotations: Map<number, string>) => void;
}

/**
 * Manages panel visibility, chart/table highlight sync,
 * and mindmap annotation persistence for the Azure Editor.
 */
export function useEditorPanels(options: UseEditorPanelsOptions): UseEditorPanelsReturn {
  const { displayOptions, setDisplayOptions } = options;

  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isMindmapOpen, setIsMindmapOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
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

  // Mindmap annotations persisted in displayOptions (Record<string, string> <-> Map<number, string>)
  const mindmapAnnotations = useMemo(() => {
    const map = new Map<number, string>();
    const stored = displayOptions.mindmapAnnotations;
    if (stored) {
      for (const [key, value] of Object.entries(stored)) {
        map.set(Number(key), value);
      }
    }
    return map;
  }, [displayOptions]);

  const setMindmapAnnotations = useCallback(
    (annotations: Map<number, string>) => {
      const record: Record<string, string> = {};
      annotations.forEach((value, key) => {
        record[String(key)] = value;
      });
      setDisplayOptions({ ...displayOptions, mindmapAnnotations: record });
    },
    [displayOptions, setDisplayOptions]
  );

  return {
    isDataPanelOpen,
    setIsDataPanelOpen,
    isDataTableOpen,
    setIsDataTableOpen,
    isMindmapOpen,
    setIsMindmapOpen,
    isWhatIfOpen,
    setIsWhatIfOpen,
    highlightRowIndex,
    setHighlightRowIndex,
    highlightedChartPoint,
    setHighlightedChartPoint,
    handlePointClick,
    handleRowClick,
    mindmapAnnotations,
    setMindmapAnnotations,
  };
}
