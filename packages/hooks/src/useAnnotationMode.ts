/**
 * useAnnotations — shared state management for chart annotation highlights
 *
 * Manages:
 * - Context menu state (open, position, target)
 * - Direct highlight color setting (via context menu)
 *
 * Text annotations have been unified with Findings (see FindingSource).
 * This hook now only manages visual highlights and the context menu.
 */

import React, { useState, useCallback } from 'react';
import type { HighlightColor, DisplayOptions } from './types';

interface ContextMenuState {
  /** Whether the context menu is open */
  isOpen: boolean;
  /** Screen position for the menu */
  position: { x: number; y: number };
  /** Category key that was right-clicked */
  categoryKey: string;
  /** Which chart the right-click occurred on */
  chartType: 'boxplot' | 'pareto';
}

const EMPTY_HIGHLIGHTS: Record<string, HighlightColor> = {};

const INITIAL_MENU_STATE: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  categoryKey: '',
  chartType: 'boxplot',
};

interface UseAnnotationsOptions {
  displayOptions: DisplayOptions;
  setDisplayOptions: (options: DisplayOptions) => void;
}

interface UseAnnotationsResult {
  /** Whether any visual highlights exist */
  hasAnnotations: boolean;
  /** Clear all highlights for a chart type */
  clearAnnotations: (chartType: 'boxplot' | 'pareto' | 'ichart') => void;

  // Context menu
  /** Current context menu state */
  contextMenu: ContextMenuState;
  /** Open context menu for a category (called from chart onContextMenu) */
  handleContextMenu: (
    chartType: 'boxplot' | 'pareto',
    key: string,
    event: React.MouseEvent
  ) => void;
  /** Close context menu */
  closeContextMenu: () => void;

  // Highlights (direct setting via context menu)
  boxplotHighlights: Record<string, HighlightColor>;
  paretoHighlights: Record<string, HighlightColor>;
  /** Set or clear a highlight color for a specific category */
  setHighlight: (
    chartType: 'boxplot' | 'pareto',
    key: string,
    color: HighlightColor | undefined
  ) => void;
}

export function useAnnotations({
  displayOptions,
  setDisplayOptions,
}: UseAnnotationsOptions): UseAnnotationsResult {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_MENU_STATE);

  const boxplotHighlights = displayOptions.boxplotHighlights ?? EMPTY_HIGHLIGHTS;
  const paretoHighlights = displayOptions.paretoHighlights ?? EMPTY_HIGHLIGHTS;

  // Context menu handlers
  const handleContextMenu = useCallback(
    (chartType: 'boxplot' | 'pareto', key: string, event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        categoryKey: key,
        chartType,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(INITIAL_MENU_STATE);
  }, []);

  // Direct highlight setting (from context menu)
  const setHighlight = useCallback(
    (chartType: 'boxplot' | 'pareto', key: string, color: HighlightColor | undefined) => {
      const field = chartType === 'boxplot' ? 'boxplotHighlights' : 'paretoHighlights';
      const highlights = chartType === 'boxplot' ? boxplotHighlights : paretoHighlights;
      const updated = { ...highlights };

      if (color === undefined) {
        delete updated[key];
      } else {
        updated[key] = color;
      }

      setDisplayOptions({ ...displayOptions, [field]: updated });
    },
    [displayOptions, setDisplayOptions, boxplotHighlights, paretoHighlights]
  );

  // Clear highlights only (findings are not cleared here)
  const clearAnnotations = useCallback(
    (chartType: 'boxplot' | 'pareto' | 'ichart') => {
      if (chartType === 'boxplot') {
        setDisplayOptions({
          ...displayOptions,
          boxplotHighlights: {},
        });
      } else if (chartType === 'pareto') {
        setDisplayOptions({
          ...displayOptions,
          paretoHighlights: {},
        });
      }
      // I-Chart has no highlights to clear
    },
    [displayOptions, setDisplayOptions]
  );

  const hasAnnotations =
    Object.keys(boxplotHighlights).length > 0 || Object.keys(paretoHighlights).length > 0;

  return {
    hasAnnotations,
    clearAnnotations,

    contextMenu,
    handleContextMenu,
    closeContextMenu,

    boxplotHighlights,
    paretoHighlights,
    setHighlight,
  };
}

// Keep backward-compatible export name during transition
export const useAnnotationMode = useAnnotations;
