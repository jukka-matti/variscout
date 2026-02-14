import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  InvestigationMindmapBase,
  type MindmapNode,
  type MindmapEdge,
  type MindmapMode,
  type NarrativeStep,
  type CategoryData,
} from '@variscout/charts';
import { useDrillPath } from '@variscout/hooks';
import {
  type FilterAction,
  getCategoryStats,
  getEtaSquared,
  getInteractionStrength,
  applyFilters,
  filterStackToFilters,
} from '@variscout/core';
import { toPng } from 'html-to-image';
import { X, ExternalLink, Download } from 'lucide-react';

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
  /** Column aliases for display */
  columnAliases?: Record<string, string>;
  /** Called when user selects a category to drill into */
  onDrillCategory: (factor: string, value: string | number) => void;
  /** Called when user wants to open in popout window */
  onOpenPopout?: () => void;
}

/**
 * Compute pairwise interaction edges for all factor pairs
 */
function computeInteractionEdges(data: any[], factors: string[], outcome: string): MindmapEdge[] {
  const edges: MindmapEdge[] = [];
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const result = getInteractionStrength(data, factors[i], factors[j], outcome);
      if (result) {
        edges.push({
          factorA: result.factorA,
          factorB: result.factorB,
          deltaRSquared: result.deltaRSquared,
          pValue: result.pValue,
          standardizedBeta: result.standardizedBeta,
        });
      }
    }
  }
  return edges;
}

/**
 * Slide-in panel for the Investigation Mindmap
 *
 * Replaces FunnelPanel as the primary investigation tool.
 * Shows factor nodes sized by η², a drill trail connecting active nodes,
 * and a pulsing suggested-next indicator.
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
  const [mode, setMode] = useState<MindmapMode>('drilldown');
  const [interactionEdges, setInteractionEdges] = useState<MindmapEdge[] | null>(null);

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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Compute drill path
  const { drillPath, cumulativeVariationPct } = useDrillPath(data, filterStack, outcome, specs);

  // Get current filtered data based on filter stack
  const currentFilters = useMemo(() => filterStackToFilters(filterStack), [filterStack]);
  const filteredData = useMemo(() => applyFilters(data, currentFilters), [data, currentFilters]);

  // Reset interaction edges when data/factors change
  useEffect(() => {
    setInteractionEdges(null);
  }, [filteredData, factors, outcome]);

  // Compute interaction edges on demand when switching to interactions or narrative mode
  useEffect(() => {
    if (mode !== 'interactions' && mode !== 'narrative') return;
    if (interactionEdges !== null) return;
    if (filteredData.length < 5 || factors.length < 2) {
      setInteractionEdges([]);
      return;
    }
    const edges = computeInteractionEdges(filteredData, factors, outcome);
    setInteractionEdges(edges);
  }, [mode, interactionEdges, filteredData, factors, outcome]);

  // Factors already drilled (in the filter stack)
  const drilledFactors = useMemo(() => {
    const set = new Set<string>();
    for (const action of filterStack) {
      if (action.type === 'filter' && action.factor) {
        set.add(action.factor);
      }
    }
    return set;
  }, [filterStack]);

  // Drill trail — ordered factor names
  const drillTrail = useMemo(() => drillPath.map(step => step.factor), [drillPath]);

  // Build MindmapNode[] from current state
  const nodes: MindmapNode[] = useMemo(() => {
    if (filteredData.length < 2) {
      return factors.map(f => ({
        factor: f,
        etaSquared: 0,
        state: 'exhausted' as const,
        isSuggested: false,
      }));
    }

    // Compute η² for each factor on current (filtered) data
    const etaSquaredMap = new Map<string, number>();
    for (const factor of factors) {
      if (drilledFactors.has(factor)) {
        // For already-drilled factors, use the η² from when it was drilled
        const step = drillPath.find(s => s.factor === factor);
        etaSquaredMap.set(factor, step?.etaSquared ?? 0);
      } else {
        // For available factors, compute on current filtered data
        const eta = getEtaSquared(filteredData, factor, outcome);
        etaSquaredMap.set(factor, eta);
      }
    }

    // Find the highest η² among available factors for suggested-next
    let maxAvailableEta = 0;
    let suggestedFactor: string | null = null;
    for (const factor of factors) {
      if (!drilledFactors.has(factor)) {
        const eta = etaSquaredMap.get(factor) ?? 0;
        if (eta > maxAvailableEta && eta > 0.05) {
          maxAvailableEta = eta;
          suggestedFactor = factor;
        }
      }
    }

    return factors.map(factor => {
      const isDrilled = drilledFactors.has(factor);
      const eta = etaSquaredMap.get(factor) ?? 0;

      // Get category data for available factors
      let categoryData: CategoryData[] | undefined;
      if (!isDrilled && filteredData.length >= 2) {
        const stats = getCategoryStats(filteredData, factor, outcome);
        if (stats) {
          categoryData = stats.map(s => ({
            value: s.value,
            count: s.count,
            meanValue: s.mean,
            contributionPct: s.contributionPct,
          }));
        }
      }

      // Get filtered value for drilled factors
      let filteredValue: string | undefined;
      if (isDrilled) {
        const action = filterStack.find(a => a.type === 'filter' && a.factor === factor);
        if (action) {
          filteredValue =
            action.values.length <= 2
              ? action.values.map(String).join(', ')
              : `${action.values[0]} +${action.values.length - 1}`;
        }
      }

      // Determine state
      let state: MindmapNode['state'];
      if (isDrilled) {
        state = 'active';
      } else if (filteredData.length < 3 || eta < 0.01) {
        state = 'exhausted';
      } else {
        state = 'available';
      }

      return {
        factor,
        etaSquared: eta,
        state,
        filteredValue,
        isSuggested: factor === suggestedFactor,
        categoryData,
      };
    });
  }, [factors, filteredData, outcome, drilledFactors, drillPath, filterStack]);

  const handleCategorySelect = useCallback(
    (factor: string, value: string | number) => {
      onDrillCategory(factor, value);
    },
    [onDrillCategory]
  );

  // Narrative steps mapped from drillPath
  const narrativeSteps: NarrativeStep[] = useMemo(
    () =>
      drillPath.map(step => ({
        factor: step.factor,
        values: step.values,
        etaSquared: step.etaSquared,
        cumulativeEtaSquared: step.cumulativeEtaSquared,
        meanBefore: step.meanBefore,
        meanAfter: step.meanAfter,
        cpkBefore: step.cpkBefore,
        cpkAfter: step.cpkAfter,
        countBefore: step.countBefore,
        countAfter: step.countAfter,
      })),
    [drillPath]
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-96 bg-surface-secondary border-l border-edge shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-white">Investigation</h2>

          {/* Mode toggle */}
          <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5">
            <button
              onClick={() => setMode('drilldown')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'drilldown'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-content-secondary hover:text-white'
              }`}
            >
              Drilldown
            </button>
            <button
              onClick={() => setMode('interactions')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'interactions'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-content-secondary hover:text-white'
              }`}
            >
              Interactions
            </button>
            <button
              onClick={() => setMode('narrative')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                mode === 'narrative'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-content-secondary hover:text-white'
              }`}
            >
              Narrative
            </button>
          </div>

          <div className="flex items-center gap-1">
            {mode === 'narrative' && (
              <button
                onClick={handleExportPng}
                className="p-1.5 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Export as PNG"
                aria-label="Export as PNG"
              >
                <Download size={14} />
              </button>
            )}
            {onOpenPopout && (
              <button
                onClick={onOpenPopout}
                className="p-1.5 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Open in new window"
                aria-label="Open in new window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
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
            edges={interactionEdges ?? undefined}
            narrativeSteps={narrativeSteps}
            width={368}
            height={500}
          />
        </div>

        {/* Drill path summary */}
        {drillPath.length > 0 && (
          <div className="px-4 py-3 border-t border-edge">
            <div className="text-[10px] text-content-muted uppercase tracking-wider mb-1.5">
              Drill Path
            </div>
            <div className="flex flex-wrap gap-1">
              {drillPath.map((step, i) => (
                <span
                  key={step.factor}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] rounded-full"
                >
                  {step.factor}
                  <span className="text-blue-300/60">{(step.etaSquared * 100).toFixed(0)}%</span>
                  {i < drillPath.length - 1 && (
                    <span className="text-content-muted ml-0.5">&rarr;</span>
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
