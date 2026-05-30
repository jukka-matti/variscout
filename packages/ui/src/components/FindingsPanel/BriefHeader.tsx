/**
 * BriefHeader — Collapsible investigation brief header.
 *
 * Shows issue statement and target progress bar. Used in the Investigation
 * page (popout window evolution).
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { ProcessContext } from '@variscout/core';
import type { TargetMetric } from '@variscout/core';

export interface BriefHeaderProps {
  /** Process context with issue statement and target */
  processContext?: ProcessContext;
  /** Current metric value for progress computation */
  currentValue?: number;
  /** Projected metric value from selected improvement ideas */
  projectedValue?: number;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
}

const METRIC_LABELS: Record<TargetMetric, string> = {
  mean: 'Mean',
  sigma: 'Sigma',
  cpk: 'Cpk',
  yield: 'Yield',
  passRate: 'Pass Rate',
};

const BriefHeader: React.FC<BriefHeaderProps> = ({
  processContext,
  currentValue,
  projectedValue,
  defaultCollapsed = false,
}) => {
  const { t, formatStat } = useTranslation();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const hasBrief = !!(processContext?.issueStatement || processContext?.targetMetric);

  if (!hasBrief) return null;

  // Compute target progress
  let progressPercent: number | undefined;
  if (
    processContext?.targetMetric &&
    processContext?.targetValue !== undefined &&
    currentValue !== undefined
  ) {
    const target = processContext.targetValue;
    const direction = processContext.targetDirection || 'minimize';

    if (direction === 'minimize') {
      // current should decrease toward target; gap = current - target
      const initialGap = currentValue - target;
      progressPercent =
        initialGap > 0
          ? Math.min(100, Math.max(0, (1 - (currentValue - target) / initialGap) * 100))
          : 100;
    } else if (direction === 'maximize') {
      // current should increase toward target; gap = target - current
      const initialGap = target - currentValue;
      progressPercent =
        initialGap > 0
          ? Math.min(100, Math.max(0, (1 - (target - currentValue) / initialGap) * 100))
          : 100;
    } else {
      // target: bidirectional
      const gap = Math.abs(currentValue - target);
      progressPercent =
        gap < 0.01 ? 100 : Math.min(100, Math.max(0, (1 - gap / Math.abs(target || 1)) * 100));
    }
  }

  // Compute projected progress (from selected ideas)
  let projectedProgressPercent: number | undefined;
  if (
    projectedValue !== undefined &&
    processContext?.targetMetric &&
    processContext?.targetValue !== undefined
  ) {
    const target = processContext.targetValue;
    const direction = processContext.targetDirection || 'minimize';

    if (direction === 'minimize') {
      const initialGap = (currentValue ?? projectedValue) - target;
      projectedProgressPercent =
        initialGap > 0
          ? Math.min(100, Math.max(0, (1 - (projectedValue - target) / initialGap) * 100))
          : 100;
    } else if (direction === 'maximize') {
      const initialGap = target - (currentValue ?? projectedValue);
      projectedProgressPercent =
        initialGap > 0
          ? Math.min(100, Math.max(0, (1 - (target - projectedValue) / initialGap) * 100))
          : 100;
    } else {
      const gap = Math.abs(projectedValue - target);
      projectedProgressPercent =
        gap < 0.01 ? 100 : Math.min(100, Math.max(0, (1 - gap / Math.abs(target || 1)) * 100));
    }
  }

  return (
    <div className="border-b border-edge bg-surface-secondary/50" data-testid="brief-header">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-tertiary/30 transition-colors"
        type="button"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <span className="text-sm font-medium text-content truncate flex-1">
          {processContext?.issueStatement || t('analyze.brief')}
        </span>
        {progressPercent !== undefined && (
          <span className="text-[0.625rem] text-content-muted">{Math.round(progressPercent)}%</span>
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-2" data-testid="brief-header-content">
          {/* Issue statement */}
          {processContext?.issueStatement && (
            <p className="text-xs text-content-secondary italic">{processContext.issueStatement}</p>
          )}

          {/* Target progress bar */}
          {processContext?.targetMetric && processContext?.targetValue !== undefined && (
            <div className="flex items-center gap-2" data-testid="target-progress">
              <Target size={12} className="text-content-muted flex-shrink-0" />
              <span className="text-[0.625rem] text-content-muted whitespace-nowrap">
                {METRIC_LABELS[processContext.targetMetric]}{' '}
                {processContext.targetDirection === 'minimize'
                  ? '≤'
                  : processContext.targetDirection === 'maximize'
                    ? '≥'
                    : '='}{' '}
                {processContext.targetValue}
              </span>
              <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-500 rounded-l-full transition-all"
                  style={{ width: `${progressPercent ?? 0}%` }}
                />
                {projectedProgressPercent !== undefined &&
                  projectedProgressPercent > (progressPercent ?? 0) && (
                    <div
                      className="h-full bg-blue-400/30 border-l border-dashed border-blue-400 transition-all"
                      style={{
                        width: `${Math.min(100, projectedProgressPercent) - (progressPercent ?? 0)}%`,
                      }}
                      data-testid="projected-progress-segment"
                    />
                  )}
              </div>
              {currentValue !== undefined && (
                <span className="text-[0.625rem] text-content-muted">
                  now {formatStat(currentValue)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BriefHeader;
