import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import type { FilterAction } from '@variscout/core';
import { MindmapPanelContent, exportMindmapPng, exportMindmapToClipboard } from '@variscout/ui';

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
  onNavigateToWhatIf?: () => void;
  onNavigateToRegression?: (factors: string[]) => void;
  onModelInteraction?: (factors: string[]) => void;
}

/**
 * PWA MindmapPanel — fixed overlay + backdrop + slide-in animation.
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

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
    };
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-96 bg-surface-secondary border-l border-edge shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
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
              width={368}
              height={chartHeight}
            />
          </div>
        </MindmapPanelContent>
      </div>
    </>
  );
};

export default MindmapPanel;
