import React from 'react';
import { X } from 'lucide-react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';

export interface CanvasFilterChipsProps {
  /** Current timeline window. When `kind === 'cumulative'` (the default), no chip renders. */
  timelineWindow?: TimelineWindow;
  /** Current scope filter. Absent → no chip renders. */
  scopeFilter?: ScopeFilter;
  /** Current Pareto group-by column. Absent → no chip renders. */
  paretoGroupBy?: string;
  /** Format the timeline window into a label. Caller-provided to keep the component agnostic of TimelineWindow shapes. */
  formatTimelineWindow?: (window: TimelineWindow) => string;
  /** Clear callbacks. Each is optional — when absent, the corresponding chip's clear button is hidden. */
  onClearTimelineWindow?: () => void;
  onClearScopeFilter?: () => void;
  onClearParetoGroupBy?: () => void;
  /** Optional className for outer container. */
  className?: string;
}

/**
 * Three composable canvas filter state chips per spec §10.
 *
 * Renders only the chips with active state. When all three filters are
 * inactive (cumulative window, no scope, no group-by), the component
 * renders null to keep the chrome clean.
 *
 * Color convention per spec:
 * - Purple: time window
 * - Blue: scope filter
 * - Amber: Pareto group-by
 */
export const CanvasFilterChips: React.FC<CanvasFilterChipsProps> = ({
  timelineWindow,
  scopeFilter,
  paretoGroupBy,
  formatTimelineWindow,
  onClearTimelineWindow,
  onClearScopeFilter,
  onClearParetoGroupBy,
  className,
}) => {
  const hasWindow = timelineWindow !== undefined && timelineWindow.kind !== 'cumulative';
  const hasScope = scopeFilter !== undefined && scopeFilter.values.length > 0;
  const hasGroupBy = paretoGroupBy !== undefined && paretoGroupBy !== '';

  if (!hasWindow && !hasScope && !hasGroupBy) {
    return null;
  }

  return (
    <div data-testid="canvas-filter-chips" className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {hasWindow && timelineWindow && (
        <Chip
          color="purple"
          label={formatTimelineWindow ? formatTimelineWindow(timelineWindow) : 'Time window'}
          onClear={onClearTimelineWindow}
          testId="filter-chip-window"
        />
      )}
      {hasScope && scopeFilter && (
        <Chip
          color="blue"
          label={`${scopeFilter.factor}: ${scopeFilter.values.join(', ')}`}
          onClear={onClearScopeFilter}
          testId="filter-chip-scope"
        />
      )}
      {hasGroupBy && paretoGroupBy && (
        <Chip
          color="amber"
          label={`Pareto by ${paretoGroupBy}`}
          onClear={onClearParetoGroupBy}
          testId="filter-chip-groupby"
        />
      )}
    </div>
  );
};

interface ChipProps {
  color: 'purple' | 'blue' | 'amber';
  label: string;
  onClear?: () => void;
  testId: string;
}

const colorClasses: Record<ChipProps['color'], string> = {
  purple: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
};

const Chip: React.FC<ChipProps> = ({ color, label, onClear, testId }) => (
  <span
    data-testid={testId}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colorClasses[color]}`}
  >
    <span>{label}</span>
    {onClear && (
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="hover:opacity-70 cursor-pointer"
      >
        <X size={12} aria-hidden="true" />
      </button>
    )}
  </span>
);
