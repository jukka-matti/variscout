import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  type FilterAction,
  getCategoryStats,
  getMaxCategoryContribution,
  getInteractionStrength,
  applyFilters,
  filterStackToFilters,
} from '@variscout/core';
import type {
  MindmapNode,
  MindmapEdge,
  MindmapMode,
  NarrativeStep,
  CategoryData,
} from '@variscout/charts';
import { useDrillPath, type DrillStep } from './useDrillPath';

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

export interface UseMindmapStateOptions {
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
  /** Column aliases for display names */
  columnAliases?: Record<string, string>;
  /** Initial annotations (for restoring persisted state) */
  initialAnnotations?: Map<number, string>;
  /** Callback when annotations change (for external persistence) */
  onAnnotationsChange?: (annotations: Map<number, string>) => void;
}

export interface UseMindmapStateReturn {
  /** Computed nodes for InvestigationMindmapBase */
  nodes: MindmapNode[];
  /** Ordered factor names in drill trail */
  drillTrail: string[];
  /** Cumulative variation percentage (0–100) or null */
  cumulativeVariationPct: number | null;
  /** Interaction edges (undefined = not yet computed) */
  interactionEdges: MindmapEdge[] | undefined;
  /** Narrative steps mapped from drillPath with annotations */
  narrativeSteps: NarrativeStep[];
  /** Full drill path with stats */
  drillPath: DrillStep[];
  /** Current visualization mode */
  mode: MindmapMode;
  /** Set visualization mode */
  setMode: (mode: MindmapMode) => void;
  /** Current annotations map */
  annotations: Map<number, string>;
  /** Update annotation for a narrative step */
  handleAnnotationChange: (stepIndex: number, text: string) => void;
}

/**
 * Shared mindmap computation hook
 *
 * Extracts all data computation logic used by MindmapPanel and MindmapWindow.
 * Consumers only need to provide a thin UI shell around InvestigationMindmapBase.
 */
export function useMindmapState(options: UseMindmapStateOptions): UseMindmapStateReturn {
  const {
    data,
    factors,
    outcome,
    filterStack,
    specs,
    columnAliases,
    initialAnnotations,
    onAnnotationsChange,
  } = options;

  const [mode, setMode] = useState<MindmapMode>('drilldown');
  const [interactionEdges, setInteractionEdges] = useState<MindmapEdge[] | null>(null);
  const [annotations, setAnnotations] = useState<Map<number, string>>(
    () => initialAnnotations ?? new Map()
  );

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
    if (!outcome || filteredData.length < 2) {
      return factors.map(f => ({
        factor: f,
        maxContribution: 0,
        state: 'exhausted' as const,
        isSuggested: false,
      }));
    }

    // Compute max category contribution for each factor on current (filtered) data
    // This is the single largest category's Total SS % — same number shown in popover
    const contributionMap = new Map<string, number>();
    for (const factor of factors) {
      if (drilledFactors.has(factor)) {
        // For drilled factors, use scope fraction from drill path for node sizing
        const step = drillPath.find(s => s.factor === factor);
        contributionMap.set(factor, step?.scopeFraction ?? 0);
      } else {
        contributionMap.set(factor, getMaxCategoryContribution(filteredData, factor, outcome));
      }
    }

    // Find the highest max contribution among available factors for suggested-next
    let maxContrib = 0;
    let suggested: string | null = null;
    for (const factor of factors) {
      if (!drilledFactors.has(factor)) {
        const contrib = contributionMap.get(factor) ?? 0;
        if (contrib > maxContrib && contrib > 0.05) {
          maxContrib = contrib;
          suggested = factor;
        }
      }
    }

    return factors.map(factor => {
      const isDrilled = drilledFactors.has(factor);
      const contrib = contributionMap.get(factor) ?? 0;

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
      } else if (filteredData.length < 3 || contrib < 0.01) {
        state = 'exhausted';
      } else {
        state = 'available';
      }

      return {
        factor,
        displayName: columnAliases?.[factor] || undefined,
        maxContribution: contrib,
        state,
        filteredValue,
        isSuggested: factor === suggested,
        categoryData,
      };
    });
  }, [factors, filteredData, outcome, drilledFactors, drillPath, filterStack, columnAliases]);

  // Annotation handler
  const handleAnnotationChange = useCallback(
    (stepIndex: number, text: string) => {
      setAnnotations(prev => {
        const next = new Map(prev);
        if (text) {
          next.set(stepIndex, text);
        } else {
          next.delete(stepIndex);
        }
        onAnnotationsChange?.(next);
        return next;
      });
    },
    [onAnnotationsChange]
  );

  // Narrative steps mapped from drillPath (with annotations merged)
  const narrativeSteps: NarrativeStep[] = useMemo(
    () =>
      drillPath.map((step, i) => ({
        factor: step.factor,
        values: step.values,
        scopeFraction: step.scopeFraction,
        cumulativeScope: step.cumulativeScope,
        meanBefore: step.meanBefore,
        meanAfter: step.meanAfter,
        cpkBefore: step.cpkBefore,
        cpkAfter: step.cpkAfter,
        countBefore: step.countBefore,
        countAfter: step.countAfter,
        annotation: annotations.get(i),
      })),
    [drillPath, annotations]
  );

  return {
    nodes,
    drillTrail,
    cumulativeVariationPct,
    interactionEdges: interactionEdges ?? undefined,
    narrativeSteps,
    drillPath,
    mode,
    setMode,
    annotations,
    handleAnnotationChange,
  };
}
