/**
 * useAnnotations — shared state management for chart annotations
 *
 * Manages:
 * - Context menu state (open, position, target)
 * - Direct highlight color setting (via context menu)
 * - Annotation CRUD (create via "Add note", update, delete)
 * - Offset reset when data changes (filter, sort, drill)
 *
 * No mode toggle — right-click context menu is always available.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { HighlightColor, ChartAnnotation, DisplayOptions } from './types';

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

const INITIAL_MENU_STATE: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  categoryKey: '',
  chartType: 'boxplot',
};

interface UseAnnotationsOptions {
  displayOptions: DisplayOptions;
  setDisplayOptions: (options: DisplayOptions) => void;
  /** Data fingerprint — when this changes, annotation offsets reset */
  dataFingerprint: string;
}

interface UseAnnotationsResult {
  /** Whether any annotations exist (highlights or text boxes) */
  hasAnnotations: boolean;
  /** Clear all annotations (highlights + text boxes) for a chart type */
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

  // Annotations
  boxplotAnnotations: ChartAnnotation[];
  paretoAnnotations: ChartAnnotation[];
  /** Create a text annotation for a category */
  createAnnotation: (chartType: 'boxplot' | 'pareto', key: string) => void;
  setBoxplotAnnotations: (annotations: ChartAnnotation[]) => void;
  setParetoAnnotations: (annotations: ChartAnnotation[]) => void;

  // I-Chart annotations (free-floating, percentage-positioned)
  ichartAnnotations: ChartAnnotation[];
  /** Create a free-floating annotation at a % position on the I-Chart */
  createIChartAnnotation: (anchorX: number, anchorY: number) => void;
  setIChartAnnotations: (annotations: ChartAnnotation[]) => void;
}

export function useAnnotations({
  displayOptions,
  setDisplayOptions,
  dataFingerprint,
}: UseAnnotationsOptions): UseAnnotationsResult {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_MENU_STATE);
  const prevFingerprint = useRef(dataFingerprint);

  const boxplotHighlights = displayOptions.boxplotHighlights ?? {};
  const paretoHighlights = displayOptions.paretoHighlights ?? {};
  const boxplotAnnotations = displayOptions.boxplotAnnotations ?? [];
  const paretoAnnotations = displayOptions.paretoAnnotations ?? [];
  const ichartAnnotations = displayOptions.ichartAnnotations ?? [];

  // Reset annotation offsets when data changes
  useEffect(() => {
    if (prevFingerprint.current !== dataFingerprint) {
      prevFingerprint.current = dataFingerprint;

      const resetOffsets = (annotations: ChartAnnotation[]): ChartAnnotation[] =>
        annotations.map(a => ({ ...a, offsetX: 0, offsetY: 0 }));

      if (boxplotAnnotations.length > 0 || paretoAnnotations.length > 0) {
        setDisplayOptions({
          ...displayOptions,
          boxplotAnnotations: resetOffsets(boxplotAnnotations),
          paretoAnnotations: resetOffsets(paretoAnnotations),
        });
      }
    }
  }, [dataFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Annotation creation (from context menu "Add note")
  const createAnnotationFn = useCallback(
    (chartType: 'boxplot' | 'pareto', key: string) => {
      const field = chartType === 'boxplot' ? 'boxplotAnnotations' : 'paretoAnnotations';
      const annotations = chartType === 'boxplot' ? boxplotAnnotations : paretoAnnotations;

      // Don't create duplicate for same category
      if (annotations.some(a => a.anchorCategory === key)) return;

      const newAnnotation: ChartAnnotation = {
        id: crypto.randomUUID(),
        anchorCategory: key,
        text: '',
        offsetX: 0,
        offsetY: 0,
        width: 140,
        color: 'neutral',
      };

      setDisplayOptions({
        ...displayOptions,
        [field]: [...annotations, newAnnotation],
      });
    },
    [displayOptions, setDisplayOptions, boxplotAnnotations, paretoAnnotations]
  );

  // I-Chart annotation creation (free-floating, % positioned)
  const createIChartAnnotationFn = useCallback(
    (anchorX: number, anchorY: number) => {
      const id = crypto.randomUUID();
      const newAnnotation: ChartAnnotation = {
        id,
        anchorCategory: id, // self-referencing — position map uses id as key
        text: '',
        offsetX: 0,
        offsetY: 0,
        width: 140,
        color: 'neutral',
        anchorX,
        anchorY,
      };

      setDisplayOptions({
        ...displayOptions,
        ichartAnnotations: [...ichartAnnotations, newAnnotation],
      });
    },
    [displayOptions, setDisplayOptions, ichartAnnotations]
  );

  // Annotation setters (for update/delete from ChartAnnotationLayer)
  const setBoxplotAnnotations = useCallback(
    (annotations: ChartAnnotation[]) => {
      setDisplayOptions({ ...displayOptions, boxplotAnnotations: annotations });
    },
    [displayOptions, setDisplayOptions]
  );

  const setParetoAnnotations = useCallback(
    (annotations: ChartAnnotation[]) => {
      setDisplayOptions({ ...displayOptions, paretoAnnotations: annotations });
    },
    [displayOptions, setDisplayOptions]
  );

  const setIChartAnnotations = useCallback(
    (annotations: ChartAnnotation[]) => {
      setDisplayOptions({ ...displayOptions, ichartAnnotations: annotations });
    },
    [displayOptions, setDisplayOptions]
  );

  // Clear all
  const clearAnnotations = useCallback(
    (chartType: 'boxplot' | 'pareto' | 'ichart') => {
      if (chartType === 'boxplot') {
        setDisplayOptions({
          ...displayOptions,
          boxplotHighlights: {},
          boxplotAnnotations: [],
        });
      } else if (chartType === 'pareto') {
        setDisplayOptions({
          ...displayOptions,
          paretoHighlights: {},
          paretoAnnotations: [],
        });
      } else {
        setDisplayOptions({
          ...displayOptions,
          ichartAnnotations: [],
        });
      }
    },
    [displayOptions, setDisplayOptions]
  );

  const hasAnnotations =
    Object.keys(boxplotHighlights).length > 0 ||
    Object.keys(paretoHighlights).length > 0 ||
    boxplotAnnotations.length > 0 ||
    paretoAnnotations.length > 0 ||
    ichartAnnotations.length > 0;

  return {
    hasAnnotations,
    clearAnnotations,

    contextMenu,
    handleContextMenu,
    closeContextMenu,

    boxplotHighlights,
    paretoHighlights,
    setHighlight,

    boxplotAnnotations,
    paretoAnnotations,
    createAnnotation: createAnnotationFn,
    setBoxplotAnnotations,
    setParetoAnnotations,

    ichartAnnotations,
    createIChartAnnotation: createIChartAnnotationFn,
    setIChartAnnotations,
  };
}

// Keep backward-compatible export name during transition
export const useAnnotationMode = useAnnotations;
