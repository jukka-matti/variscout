import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import type { FilterAction, DataRow } from '@variscout/core';
import { GripVertical } from 'lucide-react';
import {
  MindmapPanelContent,
  mindmapPanelAzureColorScheme,
  exportMindmapPng,
  exportMindmapSvg,
  exportMindmapToClipboard,
} from '@variscout/ui';

// Width constraints
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 384;
const STORAGE_KEY = 'variscout-azure-mindmap-panel-width';

interface MindmapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataRow[];
  factors: string[];
  outcome: string;
  filterStack: FilterAction[];
  specs?: { usl?: number; lsl?: number; target?: number };
  columnAliases?: Record<string, string>;
  onDrillCategory: (factor: string, value: string | number) => void;
  onOpenPopout?: () => void;
  onNavigateToWhatIf?: () => void;
  onNavigateToRegression?: (factors: string[]) => void;
  onModelInteraction?: (factors: string[]) => void;
  /** Initial annotations for restoring persisted state */
  annotations?: Map<number, string>;
  /** Callback when annotations change (for persistence) */
  onAnnotationsChange?: (annotations: Map<number, string>) => void;
}

/**
 * Azure MindmapPanel — inline flex panel with resizable width (DataPanel pattern).
 * Uses shared MindmapPanelContent for header, mode toggle, and drill path.
 */
const MindmapPanel: React.FC<MindmapPanelProps> = ({
  isOpen,
  onClose,
  data,
  factors,
  outcome,
  filterStack,
  specs,
  columnAliases,
  onDrillCategory,
  onOpenPopout,
  onNavigateToWhatIf,
  onNavigateToRegression,
  onModelInteraction,
  annotations: externalAnnotations,
  onAnnotationsChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(500);

  // Measure available height for the mindmap chart via ResizeObserver
  useEffect(() => {
    const el = mindmapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = Math.floor(entry.contentRect.height);
        if (h > 0) setChartHeight(h);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  // Panel width state (persisted to localStorage)
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(Math.max(parseInt(saved, 10), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);

  const {
    nodes,
    drillTrail,
    cumulativeVariationPct,
    interactionEdges,
    narrativeSteps,
    drillPath,
    mode,
    setMode,
    handleAnnotationChange,
  } = useMindmapState({
    data,
    factors,
    outcome,
    filterStack,
    specs,
    columnAliases,
    initialAnnotations: externalAnnotations,
    onAnnotationsChange,
  });

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, width.toString());
  }, [width]);

  // Drag handlers for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCategorySelect = useCallback(
    (factor: string, value: string | number) => onDrillCategory(factor, value),
    [onDrillCategory]
  );

  const handleExportPng = useCallback(async () => {
    const node = mindmapRef.current;
    if (!node) return;
    await exportMindmapPng(node);
  }, []);

  const handleExportSvg = useCallback(() => {
    const node = mindmapRef.current;
    if (!node) return;
    exportMindmapSvg(node);
  }, []);

  const [copyFeedback, setCopyFeedback] = useState(false);
  const handleCopyToClipboard = useCallback(async () => {
    const node = mindmapRef.current;
    if (!node) return;
    const ok = await exportMindmapToClipboard(node);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, []);

  if (!isOpen) return null;

  // Chart width = panel width minus padding (8px left + 8px right)
  const chartWidth = width - 16;

  return (
    <>
      {/* Draggable divider (matches DataPanel pattern) */}
      <div
        className={`w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={12} className="text-slate-500" />
      </div>

      {/* Panel */}
      <div
        ref={panelRef}
        className="flex-shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden"
        style={{ width }}
      >
        <MindmapPanelContent
          mode={mode}
          setMode={setMode}
          drillPath={drillPath}
          onClose={onClose}
          onOpenPopout={onOpenPopout}
          onExportPng={handleExportPng}
          onCopyToClipboard={handleCopyToClipboard}
          copyFeedback={copyFeedback}
          showSvgExport
          onExportSvg={handleExportSvg}
          colorScheme={mindmapPanelAzureColorScheme}
          columnAliases={columnAliases}
          factorCount={factors.length}
          dataCount={data.length}
        >
          <div ref={mindmapRef} className="flex-1 overflow-hidden px-2 py-2">
            <InvestigationMindmapBase
              nodes={nodes}
              drillTrail={drillTrail}
              cumulativeVariationPct={cumulativeVariationPct}
              onNodeClick={() => {}}
              onCategorySelect={handleCategorySelect}
              mode={mode}
              edges={interactionEdges}
              narrativeSteps={narrativeSteps}
              onAnnotationChange={handleAnnotationChange}
              columnAliases={columnAliases}
              onNavigateToWhatIf={onNavigateToWhatIf}
              onNavigateToRegression={onNavigateToRegression}
              onModelInteraction={onModelInteraction}
              width={chartWidth}
              height={chartHeight}
            />
          </div>
        </MindmapPanelContent>
      </div>
    </>
  );
};

export default MindmapPanel;
