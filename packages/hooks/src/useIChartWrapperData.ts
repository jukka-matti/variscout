/**
 * useIChartWrapperData - Shared data preparation for IChart chart wrappers
 *
 * Extracts identical computation logic from both PWA and Azure IChart wrappers:
 * - handleContextMenu: right-click → observation at % position
 * - categoryPositions: pixel positions from finding source anchors for annotation layer
 * - effectiveStats / effectiveStagedStats: display options gating
 */
import React, { useMemo, useCallback } from 'react';
import { getResponsiveMargins } from '@variscout/charts';
import type { StatsResult, StagedStatsResult, Finding } from '@variscout/core';
import type { DisplayOptions } from './types';

export interface UseIChartWrapperDataOptions {
  /** Chart container width in pixels */
  parentWidth: number;
  /** Chart container height in pixels */
  parentHeight: number;
  /** Current stats (mean, UCL, LCL) */
  stats: StatsResult | null;
  /** Staged stats result (per-stage control limits) */
  stagedStats: StagedStatsResult | null;
  /** Display options (showControlLimits toggle) */
  displayOptions: Pick<DisplayOptions, 'showControlLimits'>;
  /** Findings linked to this I-Chart */
  ichartFindings?: Finding[];
  /** Callback to create a new observation at % position */
  onCreateObservation?: (anchorX: number, anchorY: number) => void;
}

export interface UseIChartWrapperDataResult {
  /** Stats gated by showControlLimits display option */
  effectiveStats: StatsResult | null;
  /** Staged stats gated by showControlLimits display option */
  effectiveStagedStats: StagedStatsResult | undefined;
  /** Pixel positions computed from finding source anchors for annotation layer */
  categoryPositions: Map<string, { x: number; y: number }>;
  /** Right-click handler that creates observations at % position */
  handleContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function useIChartWrapperData({
  parentWidth,
  parentHeight,
  stats,
  stagedStats,
  displayOptions,
  ichartFindings = [],
  onCreateObservation,
}: UseIChartWrapperDataOptions): UseIChartWrapperDataResult {
  // Right-click handler: create observation at % position
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreateObservation) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const margin = getResponsiveMargins(parentWidth, 'ichart');
      const chartWidth = parentWidth - margin.left - margin.right;
      const chartHeight = parentHeight - margin.top - margin.bottom;

      // Clamp to chart area (ignore clicks in margins)
      if (
        clickX < margin.left ||
        clickX > margin.left + chartWidth ||
        clickY < margin.top ||
        clickY > margin.top + chartHeight
      ) {
        return;
      }

      const anchorX = (clickX - margin.left) / chartWidth;
      const anchorY = (clickY - margin.top) / chartHeight;
      onCreateObservation(anchorX, anchorY);
    },
    [onCreateObservation, parentWidth, parentHeight]
  );

  // Compute pixel positions from finding source anchors for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (parentWidth === 0 || parentHeight === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'ichart');
    const chartWidth = parentWidth - margin.left - margin.right;
    const chartHeight = parentHeight - margin.top - margin.bottom;

    for (const f of ichartFindings) {
      if (f.source?.anchorX != null && f.source?.anchorY != null) {
        positions.set(f.id, {
          x: f.source.anchorX * chartWidth + margin.left,
          y: f.source.anchorY * chartHeight + margin.top,
        });
      }
    }
    return positions;
  }, [ichartFindings, parentWidth, parentHeight]);

  const effectiveStats = displayOptions.showControlLimits !== false ? stats : null;
  const effectiveStagedStats =
    displayOptions.showControlLimits !== false ? (stagedStats ?? undefined) : undefined;

  return {
    effectiveStats,
    effectiveStagedStats,
    categoryPositions,
    handleContextMenu,
  };
}
