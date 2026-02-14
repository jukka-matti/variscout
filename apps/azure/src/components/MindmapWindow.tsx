import React, { useEffect, useRef, useState, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import { type FilterAction, type FilterSource, createFilterAction } from '@variscout/core';
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
 * Standalone mindmap window for dual-screen setups
 *
 * Rendered when the URL contains ?view=mindmap (detected in App.tsx before MSAL).
 * Receives data from the main window via localStorage sync.
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

  // Shared mindmap state
  const rawData = syncData?.rawData ?? [];
  const factors = syncData?.factors ?? [];
  const outcome = syncData?.outcome ?? '';
  const specs = syncData?.specs;

  const {
    nodes,
    drillTrail,
    cumulativeVariationPct,
    interactionEdges,
    narrativeSteps,
    mode,
    setMode,
    handleAnnotationChange,
  } = useMindmapState({
    data: rawData,
    factors,
    outcome,
    filterStack: localFilterStack,
    specs,
  });

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
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">:(</div>
          <h1 className="text-xl font-bold text-white mb-2">No Connection</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!syncData) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm font-semibold text-white">Investigation</h1>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5">
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
      </div>

      <div ref={mindmapRef}>
        <InvestigationMindmapBase
          nodes={nodes}
          drillTrail={drillTrail}
          cumulativeVariationPct={cumulativeVariationPct}
          onCategorySelect={handleDrillCategory}
          mode={mode}
          edges={interactionEdges}
          narrativeSteps={narrativeSteps}
          onAnnotationChange={handleAnnotationChange}
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
 * Call this from the main app (Editor.tsx)
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
