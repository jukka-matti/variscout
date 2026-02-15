import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import type { FilterAction } from '@variscout/core';
import { toPng } from 'html-to-image';
import { GripVertical } from 'lucide-react';
import { MindmapPanelContent, mindmapPanelAzureColorScheme } from '@variscout/ui';

// Width constraints
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 384;
const STORAGE_KEY = 'variscout-azure-mindmap-panel-width';

interface MindmapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  factors: string[];
  outcome: string;
  filterStack: FilterAction[];
  specs?: { usl?: number; lsl?: number; target?: number };
  columnAliases?: Record<string, string>;
  onDrillCategory: (factor: string, value: string | number) => void;
  onOpenPopout?: () => void;
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
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);

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
  } = useMindmapState({ data, factors, outcome, filterStack, specs, columnAliases });

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
    const dataUrl = await toPng(node, {
      cacheBust: true,
      backgroundColor: '#0f172a',
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = `investigation-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
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
          colorScheme={mindmapPanelAzureColorScheme}
          columnAliases={columnAliases}
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
              width={chartWidth}
              height={500}
            />
          </div>
        </MindmapPanelContent>
      </div>
    </>
  );
};

export default MindmapPanel;
