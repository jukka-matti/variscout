import React, { useEffect, useRef, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import type { FilterAction } from '@variscout/core';
import { toPng } from 'html-to-image';
import { MindmapPanelContent } from '@variscout/ui';

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
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);

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
              width={368}
              height={500}
            />
          </div>
        </MindmapPanelContent>
      </div>
    </>
  );
};

export default MindmapPanel;
