import React from 'react';

export interface ChartSkeletonProps {
  /** Optional data-testid override (defaults to "chart-skeleton") */
  testId?: string;
  /** Optional extra class on the root */
  className?: string;
}

/**
 * ChartSkeleton — pulse-block placeholder for a chart card's plot area.
 *
 * Rendered as an absolute overlay ON TOP of the (always-mounted) chart slot in
 * DashboardChartCard / FocusedChartCard, visible until the chart's `<svg>` has
 * actually painted — covering the multi-second blank window on tab return +
 * maximize (`useChartPaintLatch`). Because the chart renders underneath, the
 * root carries an opaque `bg-surface-secondary` backing so a half-rendered chart
 * can't peek through the gaps between the pulse blocks (axis rail + gaps).
 *
 * Shaped as a chart, not a spinner: a thin left axis rail, a large plot band,
 * and a bottom axis bar. Uses only `@theme`-declared tokens (`bg-surface-*`) per
 * the house pulse pattern (NarrativeBar / ChartInsightChip isLoading variant);
 * the ui token-guard test enforces this.
 */
const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  testId = 'chart-skeleton',
  className = '',
}) => {
  return (
    <div
      data-testid={testId}
      aria-hidden="true"
      className={`absolute inset-0 z-10 flex flex-col gap-2 bg-surface-secondary ${className}`}
    >
      {/* Plot region: left axis rail + plot band */}
      <div className="flex flex-1 min-h-0 gap-2">
        {/* Y-axis rail (thin) */}
        <div className="w-1.5 bg-surface-tertiary rounded animate-pulse" />
        {/* Plot band (large) */}
        <div className="flex-1 bg-surface-tertiary rounded animate-pulse" />
      </div>
      {/* X-axis bar (bottom) */}
      <div className="h-2 bg-surface-tertiary rounded animate-pulse" />
    </div>
  );
};

export default ChartSkeleton;
