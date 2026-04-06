import React from 'react';
import type { YamazumiBarData, ActivityType } from '@variscout/core';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ORDER } from '@variscout/core';

// ---------------------------------------------------------------------------
// Lean guidance tooltips per activity type
// ---------------------------------------------------------------------------

const LEAN_TOOLTIPS: Record<ActivityType, string> = {
  va: 'Optimize: improve efficiency of value-adding work',
  'nva-required': 'Reduce: minimize through automation or simplification',
  waste: 'Eliminate: remove this activity entirely',
  wait: 'Eliminate: remove idle/queue time',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReportActivityBreakdownProps {
  stepName: string;
  barData: YamazumiBarData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReportActivityBreakdown: React.FC<ReportActivityBreakdownProps> = ({
  stepName,
  barData,
}) => {
  // Build a lookup from activity type to segment for ordered rendering
  const segmentMap = new Map(barData.segments.map(s => [s.activityType, s]));

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{stepName}</h4>

      <div className="space-y-2">
        {ACTIVITY_TYPE_ORDER.map(actType => {
          const segment = segmentMap.get(actType);
          if (!segment) return null;

          return (
            <div key={actType} className="flex items-center gap-3 text-sm">
              {/* Color dot */}
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: ACTIVITY_TYPE_COLORS[actType] }}
              />

              {/* Label with lean tooltip */}
              <span
                className="text-slate-700 dark:text-slate-300 min-w-[100px]"
                title={LEAN_TOOLTIPS[actType]}
              >
                {ACTIVITY_TYPE_LABELS[actType]}
              </span>

              {/* Time */}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {Math.round(segment.totalTime)}s
              </span>

              {/* Percentage */}
              <span className="text-slate-500 dark:text-slate-400">
                {Number.isFinite(segment.percentage) ? (segment.percentage * 100).toFixed(1) : '—'}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
