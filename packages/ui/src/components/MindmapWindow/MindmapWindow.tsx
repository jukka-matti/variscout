import React, { useEffect, useRef, useState, useCallback } from 'react';
import { InvestigationMindmapBase } from '@variscout/charts';
import { useMindmapState } from '@variscout/hooks';
import {
  type DataRow,
  type FilterAction,
  type FilterSource,
  createFilterAction,
} from '@variscout/core';
import { Download, Copy, Check } from 'lucide-react';
import { exportMindmapPng, exportMindmapToClipboard } from '../MindmapPanel/export';
import MindmapModeToggle from '../MindmapPanel/MindmapModeToggle';
import { StratificationGrid } from '../StratificationGrid';

/**
 * Color scheme for MindmapWindow
 */
export interface MindmapWindowColorScheme {
  /** Page/screen background */
  pageBg: string;
  /** Secondary text (error, loading, inactive mode) */
  secondaryText: string;
  /** Mode toggle container background */
  toggleBg: string;
  /** Export/action button hover background */
  buttonHoverBg: string;
}

export const mindmapWindowDefaultColorScheme: MindmapWindowColorScheme = {
  pageBg: 'bg-surface',
  secondaryText: 'text-content-secondary',
  toggleBg: 'bg-surface-secondary',
  buttonHoverBg: 'hover:bg-surface-tertiary',
};

export const mindmapWindowAzureColorScheme: MindmapWindowColorScheme = {
  pageBg: 'bg-slate-900',
  secondaryText: 'text-slate-400',
  toggleBg: 'bg-slate-800',
  buttonHoverBg: 'hover:bg-slate-700',
};

/**
 * Storage key for cross-window data sync
 */
const MINDMAP_SYNC_KEY = 'variscout_mindmap_sync';

interface MindmapSyncData {
  rawData: DataRow[];
  factors: string[];
  outcome: string;
  columnAliases: Record<string, string>;
  specs?: { usl?: number; lsl?: number; target?: number };
  filterStack: FilterAction[];
  timestamp: number;
}

export interface MindmapWindowProps {
  colorScheme?: MindmapWindowColorScheme;
}

/**
 * Standalone mindmap window for dual-screen setups
 *
 * Rendered when the URL contains ?view=mindmap.
 * Receives data from the main window via localStorage sync.
 *
 * Communication pattern:
 * 1. Main window writes data to localStorage under MINDMAP_SYNC_KEY
 * 2. This window listens for storage events and updates its state
 * 3. Category selections are communicated back via postMessage + localStorage fallback
 */
const MindmapWindow: React.FC<MindmapWindowProps> = ({
  colorScheme = mindmapWindowDefaultColorScheme,
}) => {
  const c = colorScheme;
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
    if (window.opener) {
      window.opener.postMessage(
        { type: 'MINDMAP_DRILL_CATEGORY', factor, value },
        window.location.origin
      );
    }
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

  // Measure container dimensions for narrative SVG mode
  const [containerSize, setContainerSize] = useState({ width: 380, height: 600 });
  useEffect(() => {
    const el = mindmapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0) setContainerSize({ width: w, height: h });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncData]);

  // PNG export for narrative mode
  const handleExportPng = useCallback(async () => {
    const node = mindmapRef.current;
    if (!node) return;
    await exportMindmapPng(node);
  }, []);

  // Copy to clipboard for narrative mode
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

  // Error state
  if (error) {
    return (
      <div className={`h-screen w-screen ${c.pageBg} flex items-center justify-center p-8`}>
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">:(</div>
          <h1 className="text-xl font-bold text-white mb-2">No Connection</h1>
          <p className={`${c.secondaryText} text-sm`}>{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!syncData) {
    return (
      <div className={`h-screen w-screen ${c.pageBg} flex items-center justify-center`}>
        <div className={`animate-pulse ${c.secondaryText}`}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen ${c.pageBg} p-4 flex flex-col`}>
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Investigation</h1>

        <MindmapModeToggle
          mode={mode}
          setMode={setMode}
          toggleBg={c.toggleBg}
          inactiveText={`${c.secondaryText} hover:text-white`}
          drillCount={localFilterStack.length}
        />

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyToClipboard}
            className={`p-1.5 rounded-lg transition-all ${
              copyFeedback
                ? 'bg-green-500/20 text-green-400'
                : `${c.secondaryText} hover:text-white ${c.buttonHoverBg}`
            }`}
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
          >
            {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleExportPng}
            className={`p-1.5 ${c.secondaryText} hover:text-white ${c.buttonHoverBg} rounded-lg transition-colors`}
            title="Export as PNG"
            aria-label="Export as PNG"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div ref={mindmapRef} className="flex-1 overflow-hidden">
        {mode === 'drilldown' ? (
          <StratificationGrid
            nodes={nodes}
            drillTrail={drillTrail}
            cumulativeVariationPct={cumulativeVariationPct}
            onCategorySelect={handleDrillCategory}
          />
        ) : (
          <InvestigationMindmapBase
            nodes={nodes}
            drillTrail={drillTrail}
            cumulativeVariationPct={cumulativeVariationPct}
            onCategorySelect={handleDrillCategory}
            mode={mode}
            narrativeSteps={narrativeSteps}
            onAnnotationChange={handleAnnotationChange}
            width={containerSize.width}
            height={containerSize.height}
          />
        )}
      </div>
    </div>
  );
};

export default MindmapWindow;

/**
 * Utility function to open the mindmap in a popout window
 */
export function openMindmapPopout(
  data: DataRow[],
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
    'width=800,height=700,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );

  return popup;
}

/**
 * Utility function to update the mindmap popout with new data
 */
export function updateMindmapPopout(
  data: DataRow[],
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
