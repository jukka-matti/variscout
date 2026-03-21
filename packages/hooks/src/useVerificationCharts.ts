/**
 * useVerificationCharts — Toggle state + availability detection for report Step 5.
 *
 * Manages 5 chart types: stats, ichart, boxplot, histogram, pareto.
 * Smart defaults: all available charts enabled on mount.
 * All chips independently toggleable. Unavailable charts cannot be toggled on.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { StagedComparison, StagedStatsResult, SpecLimits } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export type VerificationChartId = 'stats' | 'ichart' | 'boxplot' | 'histogram' | 'pareto';

export interface VerificationChartOption {
  id: VerificationChartId;
  label: string;
  available: boolean;
}

export interface UseVerificationChartsOptions {
  stagedComparison: StagedComparison | null;
  stagedStats: StagedStatsResult | null;
  factors: string[];
  specs: SpecLimits;
  stageColumn: string | null;
  comparisonData: Map<string, number> | null;
}

export interface UseVerificationChartsReturn {
  charts: VerificationChartOption[];
  activeCharts: Set<VerificationChartId>;
  toggleChart: (id: VerificationChartId) => void;
  hasAnyAvailable: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Canonical render order */
const CHART_DEFS: { id: VerificationChartId; label: string }[] = [
  { id: 'stats', label: 'Stats' },
  { id: 'ichart', label: 'I-Chart' },
  { id: 'boxplot', label: 'Boxplot' },
  { id: 'histogram', label: 'Histogram' },
  { id: 'pareto', label: 'Pareto' },
];

// ============================================================================
// Hook
// ============================================================================

export function useVerificationCharts({
  stagedComparison,
  stagedStats,
  factors,
  specs,
  stageColumn,
  comparisonData,
}: UseVerificationChartsOptions): UseVerificationChartsReturn {
  // Compute availability for each chart
  const charts = useMemo<VerificationChartOption[]>(() => {
    const hasSpecs = specs.usl != null || specs.lsl != null;

    return CHART_DEFS.map(def => {
      let available = false;
      switch (def.id) {
        case 'stats':
          available = stagedComparison !== null;
          break;
        case 'ichart':
          available = stagedStats !== null;
          break;
        case 'boxplot':
          available = factors.length > 0 && stageColumn !== null;
          break;
        case 'histogram':
          available = hasSpecs;
          break;
        case 'pareto':
          available = comparisonData !== null;
          break;
      }
      return { ...def, available };
    });
  }, [stagedComparison, stagedStats, factors, specs, stageColumn, comparisonData]);

  // Compute a stable string key from available chart ids for change detection
  const availableKey = charts
    .filter(c => c.available)
    .map(c => c.id)
    .join(',');

  // Smart defaults: all available charts ON
  const computeDefaults = useCallback(() => {
    const set = new Set<VerificationChartId>();
    for (const c of charts) {
      if (c.available) set.add(c.id);
    }
    return set;
  }, [charts]);

  const [activeCharts, setActiveCharts] = useState<Set<VerificationChartId>>(() =>
    computeDefaults()
  );

  // Reset to defaults when availability changes
  const prevKeyRef = useRef(availableKey);
  useEffect(() => {
    if (prevKeyRef.current !== availableKey) {
      prevKeyRef.current = availableKey;
      setActiveCharts(computeDefaults());
    }
  }, [availableKey, computeDefaults]);

  const toggleChart = useCallback(
    (id: VerificationChartId) => {
      const chart = charts.find(c => c.id === id);
      if (!chart?.available) return;

      setActiveCharts(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [charts]
  );

  const hasAnyAvailable = charts.some(c => c.available);

  return { charts, activeCharts, toggleChart, hasAnyAvailable };
}
