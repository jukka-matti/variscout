import React, { useEffect, useRef, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState, type DrillStep } from '@variscout/hooks';
import type { FilterAction } from '@variscout/core';
import { toPng } from 'html-to-image';
import { X, Download, ExternalLink } from 'lucide-react';

interface MindmapPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Called when the panel should close */
  onClose: () => void;
  /** Raw (unfiltered) data */
  data: any[];
  /** Available factor columns */
  factors: string[];
  /** Outcome column name */
  outcome: string;
  /** Current filter stack from useFilterNavigation */
  filterStack: FilterAction[];
  /** Specification limits for Cpk projection */
  specs?: { usl?: number; lsl?: number; target?: number };
  /** Called when user selects a category to drill into */
  onDrillCategory: (factor: string, value: string | number) => void;
  /** Called when user clicks the popout button */
  onOpenPopout?: () => void;
}

/**
 * Investigation Mindmap panel for Azure app
 *
 * Slide-in panel (from right) following the DataPanel pattern.
 * Uses shared useMindmapState hook for all computation.
 * Mindmap drills drive Dashboard chart filtering (integrated behavior).
 */
const MindmapPanel: React.FC<MindmapPanelProps> = ({
  isOpen,
  onClose,
  data,
  factors,
  outcome,
  filterStack,
  specs,
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
  } = useMindmapState({ data, factors, outcome, filterStack, specs });

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCategorySelect = useCallback(
    (factor: string, value: string | number) => {
      onDrillCategory(factor, value);
    },
    [onDrillCategory]
  );

  // PNG export for narrative mode
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
      {/* Panel (inline, no backdrop — matches DataPanel pattern) */}
      <div className="w-1 bg-slate-700 flex-shrink-0" />
      <div
        ref={panelRef}
        className="flex-shrink-0 w-96 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">Investigation</h2>

          {/* Mode toggle */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5">
            <button
              onClick={() => setMode('drilldown')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'drilldown'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Drilldown
            </button>
            <button
              onClick={() => setMode('interactions')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'interactions'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactions
            </button>
            <button
              onClick={() => setMode('narrative')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'narrative'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Narrative
            </button>
          </div>

          <div className="flex items-center gap-1">
            {mode === 'narrative' && (
              <button
                onClick={handleExportPng}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Export as PNG"
                aria-label="Export as PNG"
              >
                <Download size={14} />
              </button>
            )}
            {onOpenPopout && (
              <button
                onClick={onOpenPopout}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Open in new window"
                aria-label="Open in new window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Close"
              aria-label="Close investigation panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Mindmap chart */}
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
            width={368}
            height={500}
          />
        </div>

        {/* Drill path summary */}
        {drillPath.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
              Drill Path
            </div>
            <div className="flex flex-wrap gap-1">
              {drillPath.map((step: DrillStep, i: number) => (
                <span
                  key={step.factor}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] rounded-full"
                >
                  {step.factor}
                  <span className="text-blue-300/60">{(step.etaSquared * 100).toFixed(0)}%</span>
                  {i < drillPath.length - 1 && (
                    <span className="text-slate-500 ml-0.5">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MindmapPanel;
