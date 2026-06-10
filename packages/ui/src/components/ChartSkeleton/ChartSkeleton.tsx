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
 * Painted on mount (one-rAF gate in DashboardChartCard / FocusedChartCard) so a
 * skeleton frame is visible BEFORE the synchronous chart render blocks the main
 * thread — covering the 3–5s blank-card window on tab return + maximize.
 *
 * Shaped as a chart, not a spinner: a thin left axis rail, a large plot band,
 * and a bottom axis bar. Uses only `@theme`-declared tokens
 * (`bg-surface-tertiary`) per the house pulse pattern (NarrativeBar /
 * ChartInsightChip isLoading variant); the ui token-guard test enforces this.
 */
const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  testId = 'chart-skeleton',
  className = '',
}) => {
  return (
    <div
      data-testid={testId}
      aria-hidden="true"
      className={`absolute inset-0 flex flex-col gap-2 ${className}`}
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
