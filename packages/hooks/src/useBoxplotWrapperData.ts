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
import { getResponsiveMargins, stageColors } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/core';
import type { SpecLimits } from '@variscout/core';
import type { HighlightColor, DisplayOptions } from './types';
import type { StageInfo } from './useBoxplotData';
import { STAGE_SEPARATOR } from './useBoxplotData';

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
  /** Stage info from useBoxplotData (when staged) */
  stageInfo?: StageInfo;
}

export interface UseBoxplotWrapperDataResult {
  /** Pixel positions for annotation layer anchoring */
  categoryPositions: Map<string, { x: number; y: number }>;
  /** Merged highlight colors (auto-direction + manual annotations) */
  effectiveHighlights: Record<string, HighlightColor> | undefined;
  /** Per-key fill color overrides for staged boxplot */
  fillOverrides?: Record<string, string>;
  /** X-axis tick formatter that strips stage suffix from composite keys */
  xTickFormat?: (value: string) => string;
}

export function useBoxplotWrapperData({
  data,
  specs: _specs,
  displayOptions: _displayOptions,
  parentWidth,
  highlightedCategories,
  stageInfo,
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

  // Manual annotation highlights only (auto direction coloring removed)
  const effectiveHighlights = useMemo(() => {
    if (!highlightedCategories) return undefined;
    return { ...highlightedCategories };
  }, [highlightedCategories]);

  // Stage fill color overrides (maps composite keys to stage colors)
  const fillOverrides = useMemo(() => {
    if (!stageInfo) return undefined;
    const overrides: Record<string, string> = {};
    for (const d of data) {
      const sepIdx = d.key.lastIndexOf(STAGE_SEPARATOR);
      if (sepIdx === -1) continue;
      const stage = d.key.slice(sepIdx + STAGE_SEPARATOR.length);
      const stageIdx = stageInfo.stageKeys.indexOf(stage);
      if (stageIdx >= 0) {
        overrides[d.key] = stageColors[stageIdx % stageColors.length];
      }
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }, [data, stageInfo]);

  // X-axis tick formatter: strip stage suffix from composite keys
  const xTickFormat = useMemo(() => {
    if (!stageInfo) return undefined;
    return (value: string): string => {
      const sepIdx = value.lastIndexOf(STAGE_SEPARATOR);
      return sepIdx === -1 ? value : value.slice(0, sepIdx);
    };
  }, [stageInfo]);

  return {
    categoryPositions,
    effectiveHighlights,
    fillOverrides,
    xTickFormat,
  };
}
