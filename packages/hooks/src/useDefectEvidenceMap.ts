/**
 * useDefectEvidenceMap — Lazy per-type Best Subsets computation with progressive caching.
 *
 * Enables three Evidence Map views for defect mode:
 * - 'all': uses pre-computed allTypesBestSubsets
 * - 'cross-type': aggregates cached per-type results into a factor significance matrix
 * - string (type name): filters data to that type, runs Best Subsets, caches result
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { computeBestSubsets } from '@variscout/core/stats';
import type { BestSubsetsResult } from '@variscout/core';
import type { DefectTransformResult, DefectMapping } from '@variscout/core';
import type { DataRow } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export type DefectMapView = 'all' | 'cross-type' | string;

export interface CrossTypeEntry {
  types: string[];
  avgRSquaredAdj: number;
}

export interface UseDefectEvidenceMapResult {
  /** BestSubsetsResult for the current view (null for cross-type view) */
  bestSubsets: BestSubsetsResult | null;
  /** Cross-type matrix: factor → { types where significant, avg R²adj } */
  crossTypeMatrix: Map<string, CrossTypeEntry> | null;
  /** Which types have been analyzed (cached) */
  analyzedTypes: string[];
  /** All available defect types */
  totalTypes: string[];
  /** Whether computation is in progress */
  isComputing: boolean;
  /** Insufficient data info (null if sufficient or not per-type view) */
  insufficient: { have: number; need: number } | null;
  /** Outcome label for the current view */
  outcomeLabel: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum observations per predictor for per-type analysis */
const MIN_OBS_PER_PREDICTOR = 10;

/** R²adj threshold for a factor to be considered significant in cross-type view */
const CROSS_TYPE_SIGNIFICANCE_THRESHOLD = 0.05;

// ============================================================================
// Pure helper functions (exported for testing)
// ============================================================================

/**
 * Extract unique defect types from transform result data.
 */
export function extractDefectTypes(data: DataRow[], defectTypeColumn: string): string[] {
  const types = new Set<string>();
  for (const row of data) {
    const val = row[defectTypeColumn];
    if (val != null && val !== '') {
      types.add(String(val));
    }
  }
  return Array.from(types).sort();
}

/**
 * Filter data to rows matching a specific defect type and remove the type column
 * from the factors list (since it's now constant).
 */
export function filterDataForType(
  data: DataRow[],
  defectTypeColumn: string,
  typeName: string,
  factors: string[]
): { filteredData: DataRow[]; remainingFactors: string[] } {
  const filteredData = data.filter(row => String(row[defectTypeColumn]) === typeName);
  const remainingFactors = factors.filter(f => f !== defectTypeColumn);
  return { filteredData, remainingFactors };
}

/**
 * Check whether sample size is sufficient for Best Subsets analysis.
 * Returns null if sufficient, or { have, need } if insufficient.
 */
export function checkSampleSize(
  rowCount: number,
  factorCount: number
): { have: number; need: number } | null {
  const need = MIN_OBS_PER_PREDICTOR * factorCount;
  if (rowCount < need) {
    return { have: rowCount, need };
  }
  return null;
}

/**
 * Derive cross-type significance matrix from cached per-type BestSubsetsResults.
 *
 * For each factor, finds which defect types show single-factor R²adj >= threshold,
 * and computes average R²adj across those types.
 */
export function deriveCrossTypeMatrix(
  cache: Map<string, BestSubsetsResult>,
  threshold: number = CROSS_TYPE_SIGNIFICANCE_THRESHOLD
): Map<string, CrossTypeEntry> {
  const matrix = new Map<string, CrossTypeEntry>();

  // Collect all factors mentioned across all cached results
  const allFactors = new Set<string>();
  for (const result of cache.values()) {
    for (const name of result.factorNames) {
      allFactors.add(name);
    }
  }

  for (const factor of allFactors) {
    const significantTypes: string[] = [];
    const rSquaredValues: number[] = [];

    for (const [typeName, result] of cache.entries()) {
      // Find single-factor subset for this factor
      const singleFactorSubset = result.subsets.find(
        s => s.factors.length === 1 && s.factors[0] === factor
      );
      if (singleFactorSubset && singleFactorSubset.rSquaredAdj >= threshold) {
        significantTypes.push(typeName);
        rSquaredValues.push(singleFactorSubset.rSquaredAdj);
      }
    }

    if (significantTypes.length > 0) {
      const avgRSquaredAdj = rSquaredValues.reduce((sum, v) => sum + v, 0) / rSquaredValues.length;
      matrix.set(factor, {
        types: significantTypes,
        avgRSquaredAdj,
      });
    }
  }

  return matrix;
}

// ============================================================================
// Hook
// ============================================================================

export function useDefectEvidenceMap(
  defectResult: DefectTransformResult | null,
  defectMapping: DefectMapping | null,
  allTypesBestSubsets: BestSubsetsResult | null,
  selectedView: DefectMapView,
  factors: string[]
): UseDefectEvidenceMapResult {
  // Cache: defect type name → BestSubsetsResult
  const cacheRef = useRef<Map<string, BestSubsetsResult>>(new Map());
  // Track identity of defectResult for cache invalidation
  const prevDefectResultRef = useRef<DefectTransformResult | null>(null);

  const [isComputing, setIsComputing] = useState(false);
  const [computedResult, setComputedResult] = useState<BestSubsetsResult | null>(null);
  const [insufficient, setInsufficient] = useState<{ have: number; need: number } | null>(null);

  // Invalidate cache when defectResult identity changes
  if (defectResult !== prevDefectResultRef.current) {
    prevDefectResultRef.current = defectResult;
    cacheRef.current = new Map();
    // Reset per-type state when data changes
    setComputedResult(null);
    setInsufficient(null);
  }

  // Extract available defect types
  const totalTypes = useMemo(() => {
    if (!defectResult?.data || !defectMapping?.defectTypeColumn) return [];
    return extractDefectTypes(defectResult.data, defectMapping.defectTypeColumn);
  }, [defectResult, defectMapping?.defectTypeColumn]);

  // Analyzed types (keys of cache)
  const analyzedTypes = useMemo(
    () => Array.from(cacheRef.current.keys()).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-derive when computedResult changes (means cache was updated)
    [computedResult, isComputing]
  );

  // Per-type computation effect
  useEffect(() => {
    // Only compute for specific type views
    if (
      selectedView === 'all' ||
      selectedView === 'cross-type' ||
      !defectResult?.data ||
      !defectMapping?.defectTypeColumn
    ) {
      setInsufficient(null);
      setComputedResult(null);
      return;
    }

    const typeName = selectedView;

    // Check cache first
    const cached = cacheRef.current.get(typeName);
    if (cached) {
      setComputedResult(cached);
      setInsufficient(null);
      return;
    }

    // Filter and check sample size
    const { filteredData, remainingFactors } = filterDataForType(
      defectResult.data,
      defectMapping.defectTypeColumn,
      typeName,
      factors
    );

    const sizeCheck = checkSampleSize(filteredData.length, remainingFactors.length);
    if (sizeCheck) {
      setInsufficient(sizeCheck);
      setComputedResult(null);
      return;
    }

    // Run computation (synchronous but may be slow)
    setIsComputing(true);
    setInsufficient(null);

    // Use microtask to allow isComputing state to render
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;

      const result = computeBestSubsets(filteredData, defectResult.outcomeColumn, remainingFactors);

      if (cancelled) return;

      if (result) {
        cacheRef.current.set(typeName, result);
      }

      setComputedResult(result);
      setIsComputing(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factors identity handled via join below
  }, [selectedView, defectResult, defectMapping?.defectTypeColumn, factors.join(',')]);

  // Cross-type matrix (derived from cache)
  const crossTypeMatrix = useMemo(() => {
    if (selectedView !== 'cross-type') return null;
    if (cacheRef.current.size === 0) return null;
    return deriveCrossTypeMatrix(cacheRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-derive when cache changes
  }, [selectedView, computedResult, isComputing]);

  // Determine bestSubsets for current view
  const bestSubsets = useMemo(() => {
    if (selectedView === 'all') return allTypesBestSubsets;
    if (selectedView === 'cross-type') return null;
    // Per-type view
    return computedResult;
  }, [selectedView, allTypesBestSubsets, computedResult]);

  // Outcome label
  const outcomeLabel = useMemo(() => {
    if (selectedView === 'all') return 'Defect Rate';
    if (selectedView === 'cross-type') return 'Cross-Type Comparison';
    return `${selectedView} Rate`;
  }, [selectedView]);

  return {
    bestSubsets,
    crossTypeMatrix,
    analyzedTypes,
    totalTypes,
    isComputing,
    insufficient,
    outcomeLabel,
  };
}
