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
  type FilterSource,
  getCategoryStats,
  getEtaSquared,
  getInteractionStrength,
  applyFilters,
  filterStackToFilters,
  createFilterAction,
} from '@variscout/core';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

/**
 * Storage key for cross-window data sync
 */
const MINDMAP_SYNC_KEY = 'variscout_mindmap_sync';

interface MindmapSyncData {
  rawData: any[];
  factors: string[];
  outcome: string;
  columnAliases: Record<string, string>;
  specs?: { usl?: number; lsl?: number; target?: number };
  filterStack: FilterAction[];
  timestamp: number;
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
 * Standalone mindmap window for dual-screen setups
 *
 * This component is rendered when the URL contains ?view=mindmap
 * It receives data from the main window via localStorage sync.
 *
 * Communication pattern:
 * 1. Main window writes data to localStorage under MINDMAP_SYNC_KEY
 * 2. This window listens for storage events and updates its state
 * 3. Category selections are communicated back via postMessage + localStorage fallback
 */
const MindmapWindow: React.FC = () => {
  const mindmapRef = useRef<HTMLDivElement>(null);
  const [syncData, setSyncData] = useState<MindmapSyncData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localFilterStack, setLocalFilterStack] = useState<FilterAction[]>([]);
  const [mode, setMode] = useState<MindmapMode>('drilldown');
  const [interactionEdges, setInteractionEdges] = useState<MindmapEdge[] | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MINDMAP_SYNC_KEY);
      if (stored) {
        const data = JSON.parse(stored) as MindmapSyncData;
        setSyncData(data);
        setLocalFilterStack(data.filterStack ?? []);
      } else {
        setError('No data available. Please open from the main VariScout window.');
      }
    } catch {
      setError('Failed to load data from main window.');
    }
  }, []);

  // Listen for storage updates from main window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MINDMAP_SYNC_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue) as MindmapSyncData;
          setSyncData(data);
          setLocalFilterStack(data.filterStack ?? []);
          setError(null);
        } catch (err) {
          console.error('Failed to parse sync data:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Drill category — send to main window via postMessage + localStorage fallback
  const handleDrillCategory = useCallback((factor: string, value: string | number) => {
    // Notify main window
    if (window.opener) {
      window.opener.postMessage(
        { type: 'MINDMAP_DRILL_CATEGORY', factor, value },
        window.location.origin
      );
    }
    // Also store in localStorage as a fallback
    localStorage.setItem(
      'variscout_mindmap_drill',
      JSON.stringify({ factor, value, timestamp: Date.now() })
    );

    // Update local state optimistically
    const action = createFilterAction({
      type: 'filter',
      source: 'mindmap' as FilterSource,
      factor,
      values: [value],
    });
    setLocalFilterStack(prev => [...prev, action]);
  }, []);

  // Compute mindmap data
  const rawData = syncData?.rawData ?? [];
  const factors = syncData?.factors ?? [];
  const outcome = syncData?.outcome ?? '';
  const specs = syncData?.specs;

  const { drillPath, cumulativeVariationPct } = useDrillPath(
    rawData,
    localFilterStack,
    outcome,
    specs
  );

  const currentFilters = useMemo(() => filterStackToFilters(localFilterStack), [localFilterStack]);
  const filteredData = useMemo(
    () => applyFilters(rawData, currentFilters),
    [rawData, currentFilters]
  );

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

  const drilledFactors = useMemo(() => {
    const set = new Set<string>();
    for (const action of localFilterStack) {
      if (action.type === 'filter' && action.factor) {
        set.add(action.factor);
      }
    }
    return set;
  }, [localFilterStack]);

  const drillTrail = useMemo(() => drillPath.map(s => s.factor), [drillPath]);

  const nodes: MindmapNode[] = useMemo(() => {
    if (!outcome || filteredData.length < 2) {
      return factors.map(f => ({
        factor: f,
        etaSquared: 0,
        state: 'exhausted' as const,
        isSuggested: false,
      }));
    }

    const etaMap = new Map<string, number>();
    for (const factor of factors) {
      if (drilledFactors.has(factor)) {
        const step = drillPath.find(s => s.factor === factor);
        etaMap.set(factor, step?.etaSquared ?? 0);
      } else {
        etaMap.set(factor, getEtaSquared(filteredData, factor, outcome));
      }
    }

    let maxEta = 0;
    let suggested: string | null = null;
    for (const factor of factors) {
      if (!drilledFactors.has(factor)) {
        const eta = etaMap.get(factor) ?? 0;
        if (eta > maxEta && eta > 0.05) {
          maxEta = eta;
          suggested = factor;
        }
      }
    }

    return factors.map(factor => {
      const isDrilled = drilledFactors.has(factor);
      const eta = etaMap.get(factor) ?? 0;

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

      let filteredValue: string | undefined;
      if (isDrilled) {
        const action = localFilterStack.find(a => a.type === 'filter' && a.factor === factor);
        if (action) {
          filteredValue =
            action.values.length <= 2
              ? action.values.map(String).join(', ')
              : `${action.values[0]} +${action.values.length - 1}`;
        }
      }

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
        isSuggested: factor === suggested,
        categoryData,
      };
    });
  }, [factors, filteredData, outcome, drilledFactors, drillPath, localFilterStack]);

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

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-surface flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">:(</div>
          <h1 className="text-xl font-bold text-white mb-2">No Connection</h1>
          <p className="text-content-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!syncData) {
    return (
      <div className="h-screen w-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-content-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm font-semibold text-white">Investigation</h1>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-surface-secondary rounded-lg p-0.5">
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
      </div>

      <div ref={mindmapRef}>
        <InvestigationMindmapBase
          nodes={nodes}
          drillTrail={drillTrail}
          cumulativeVariationPct={cumulativeVariationPct}
          onCategorySelect={handleDrillCategory}
          mode={mode}
          edges={interactionEdges ?? undefined}
          narrativeSteps={narrativeSteps}
          width={380}
          height={600}
        />
      </div>
    </div>
  );
};

export default MindmapWindow;

/**
 * Utility function to open the mindmap in a popout window
 * Call this from the main app
 */
export function openMindmapPopout(
  data: any[],
  factors: string[],
  outcome: string,
  columnAliases: Record<string, string>,
  specs?: { usl?: number; lsl?: number; target?: number },
  filterStack?: FilterAction[]
): Window | null {
  const syncData: MindmapSyncData = {
    rawData: data,
    factors,
    outcome,
    columnAliases,
    specs,
    filterStack: filterStack ?? [],
    timestamp: Date.now(),
  };
  localStorage.setItem(MINDMAP_SYNC_KEY, JSON.stringify(syncData));

  const url = `${window.location.origin}${window.location.pathname}?view=mindmap`;
  const popup = window.open(
    url,
    'variscout-mindmap',
    'width=420,height=700,menubar=no,toolbar=no,location=no,status=no'
  );

  return popup;
}

/**
 * Utility function to update the mindmap popout with new data
 */
export function updateMindmapPopout(
  data: any[],
  factors: string[],
  outcome: string,
  columnAliases: Record<string, string>,
  specs?: { usl?: number; lsl?: number; target?: number },
  filterStack?: FilterAction[]
): void {
  const syncData: MindmapSyncData = {
    rawData: data,
    factors,
    outcome,
    columnAliases,
    specs,
    filterStack: filterStack ?? [],
    timestamp: Date.now(),
  };
  localStorage.setItem(MINDMAP_SYNC_KEY, JSON.stringify(syncData));
}
