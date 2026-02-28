/**
 * useBoxplotWrapperData - Shared data preparation for Boxplot chart wrappers
 *
 * Extracts identical computation logic from both PWA and Azure Boxplot wrappers:
 * - categoryPositions: pixel positions for annotation layer
 * - autoColors: direction-aware category coloring
 * - effectiveHighlights: merged auto + manual annotation colors
 *
 * Each app wrapper calls useData() and passes the relevant fields here,
 * then renders BoxplotBase + ChartAnnotationLayer + AxisEditor with the results.
 */
import { useMemo } from 'react';
import { getResponsiveMargins } from '@variscout/charts';
import { computeCategoryDirectionColors } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import type { SpecLimits } from '@variscout/core';
import type { HighlightColor, DisplayOptions } from './types';

export interface UseBoxplotWrapperDataOptions {
  /** Sorted boxplot group data */
  data: BoxplotGroupData[];
  /** Specification limits for direction-aware coloring */
  specs: SpecLimits | null;
  /** Display options (showSpecs toggle) */
  displayOptions: Pick<DisplayOptions, 'showSpecs'>;
  /** Chart container width in pixels */
  parentWidth: number;
  /** Manual annotation highlights from useAnnotations */
  highlightedCategories?: Record<string, HighlightColor>;
}

export interface UseBoxplotWrapperDataResult {
  /** Pixel positions for annotation layer anchoring */
  categoryPositions: Map<string, { x: number; y: number }>;
  /** Merged highlight colors (auto-direction + manual annotations) */
  effectiveHighlights: Record<string, HighlightColor> | undefined;
}

export function useBoxplotWrapperData({
  data,
  specs,
  displayOptions,
  parentWidth,
  highlightedCategories,
}: UseBoxplotWrapperDataOptions): UseBoxplotWrapperDataResult {
  // Compute category positions for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (data.length === 0 || parentWidth === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'boxplot');
    const chartWidth = parentWidth - margin.left - margin.right;
    const padding = 0.4;
    const step = chartWidth / data.length;
    const bandwidth = step * (1 - padding);
    const offset = (step * padding) / 2;

    for (const d of data) {
      const idx = data.indexOf(d);
      const x = margin.left + idx * step + offset + bandwidth / 2;
      const y = margin.top;
      positions.set(d.key, { x, y });
    }
    return positions;
  }, [data, parentWidth]);

  // Direction-aware auto-coloring: color boxes by how well each category
  // aligns with the characteristic type (nominal/smaller/larger)
  const autoColors = useMemo(() => {
    if (displayOptions.showSpecs === false || !specs) return null;
    return computeCategoryDirectionColors(data, specs);
  }, [data, specs, displayOptions.showSpecs]);

  // Manual annotation highlights always override auto-colors
  const effectiveHighlights = useMemo(() => {
    if (!autoColors && !highlightedCategories) return undefined;
    return { ...autoColors, ...highlightedCategories };
  }, [autoColors, highlightedCategories]);

  return {
    categoryPositions,
    effectiveHighlights,
  };
}
