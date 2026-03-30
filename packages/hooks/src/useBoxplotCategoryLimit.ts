/**
 * useBoxplotCategoryLimit — Adaptive category filtering for boxplot charts
 *
 * Computes which categories to show based on container width, spec limits,
 * sort preferences, and optional manual selection.
 */

import { useMemo } from 'react';
import {
  selectBoxplotCategories,
  getMaxBoxplotCategories,
  getResponsiveMargins,
  type BoxplotGroupData,
  type BoxplotSortBy,
  type BoxplotSortDirection,
  type SpecLimits,
  type BoxplotPriorityCriterion,
} from '@variscout/core';

export interface UseBoxplotCategoryLimitOptions {
  /** Container width in pixels (from withParentSize) */
  parentWidth: number;
  /** All boxplot group data (unfiltered) */
  data: BoxplotGroupData[];
  /** Specification limits for priority logic */
  specs: SpecLimits;
  /** Current sort criterion */
  sortBy: BoxplotSortBy;
  /** Current sort direction */
  sortDirection: BoxplotSortDirection;
  /** Whether auto mode is active (true by default) */
  isAutoMode: boolean;
  /** Manual category selection (used when isAutoMode is false) */
  manualSelection?: string[];
}

export interface UseBoxplotCategoryLimitReturn {
  /** Categories to render (ordered) */
  visibleCategories: string[];
  /** Total number of categories in data */
  totalCategories: number;
  /** Maximum categories that fit at current width */
  maxCategories: number;
  /** Whether categories were truncated */
  isTruncated: boolean;
  /** Priority criterion label for display */
  priorityCriterion: BoxplotPriorityCriterion;
}

export function useBoxplotCategoryLimit({
  parentWidth,
  data,
  specs,
  sortBy,
  sortDirection,
  isAutoMode,
  manualSelection,
}: UseBoxplotCategoryLimitOptions): UseBoxplotCategoryLimitReturn {
  // Compute inner width (subtract margins)
  const innerWidth = useMemo(() => {
    if (parentWidth <= 0) return 0;
    const margin = getResponsiveMargins(parentWidth, 'boxplot');
    return Math.max(0, parentWidth - margin.left - margin.right);
  }, [parentWidth]);

  const maxCategories = useMemo(() => getMaxBoxplotCategories(innerWidth), [innerWidth]);

  const { visibleCategories, priorityCriterion } = useMemo(() => {
    if (!isAutoMode && manualSelection && manualSelection.length > 0) {
      // Manual mode: use user selection (preserve order from data)
      const selSet = new Set(manualSelection);
      const ordered = data.filter(d => selSet.has(d.key)).map(d => d.key);
      return { visibleCategories: ordered, priorityCriterion: 'name' as BoxplotPriorityCriterion };
    }

    // Auto mode: select based on specs + sort
    const result = selectBoxplotCategories(data, maxCategories, specs, sortBy, sortDirection);
    return { visibleCategories: result.categories, priorityCriterion: result.criterion };
  }, [data, maxCategories, specs, sortBy, sortDirection, isAutoMode, manualSelection]);

  return {
    visibleCategories,
    totalCategories: data.length,
    maxCategories,
    isTruncated: data.length > visibleCategories.length,
    priorityCriterion,
  };
}
