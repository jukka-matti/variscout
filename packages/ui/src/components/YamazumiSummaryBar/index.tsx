/**
 * YamazumiSummaryBar - Summary statistics panel for Yamazumi mode
 *
 * Displays: VA Ratio, Process Efficiency, Total Lead Time, Waste Breakdown, Takt Compliance.
 * Replaces the Stats Panel in slot 4 of the dashboard grid.
 *
 * Props-based (no context dependency), follows StatsPanelBase pattern.
 */

import React, { useState } from 'react';
import { Timer, TrendingUp, AlertTriangle, Percent } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { YamazumiSummary, ActivityType } from '@variscout/core';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS } from '@variscout/core';

export interface YamazumiSummaryBarProps {
  /** Summary statistics */
  summary: YamazumiSummary;
  /** Callback when takt time is changed */
  onTaktTimeChange?: (taktTime: number | undefined) => void;
  /** Whether to show the takt time editor */
  showTaktEditor?: boolean;
}

function formatTime(seconds: number): string {
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
  if (seconds >= 60) return `${(seconds / 60).toFixed(1)}m`;
  return `${seconds.toFixed(1)}s`;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export const YamazumiSummaryBar: React.FC<YamazumiSummaryBarProps> = ({
  summary,
  onTaktTimeChange,
  showTaktEditor = true,
}) => {
  const { t } = useTranslation();
  const [editingTakt, setEditingTakt] = useState(false);
  const [taktInput, setTaktInput] = useState(summary.taktTime?.toString() ?? '');

  const handleTaktSubmit = () => {
    const parsed = parseFloat(taktInput);
    onTaktTimeChange?.(parsed > 0 ? parsed : undefined);
    setEditingTakt(false);
  };

  // Waste breakdown as array
  const wasteBreakdown: { type: ActivityType; time: number; ratio: number }[] = [
    {
      type: 'va',
      time: summary.vaTime,
      ratio: summary.totalLeadTime > 0 ? summary.vaTime / summary.totalLeadTime : 0,
    },
    {
      type: 'nva-required',
      time: summary.nvaTime,
      ratio: summary.totalLeadTime > 0 ? summary.nvaTime / summary.totalLeadTime : 0,
    },
    {
      type: 'waste',
      time: summary.wasteTime,
      ratio: summary.totalLeadTime > 0 ? summary.wasteTime / summary.totalLeadTime : 0,
    },
    {
      type: 'wait',
      time: summary.waitTime,
      ratio: summary.totalLeadTime > 0 ? summary.waitTime / summary.totalLeadTime : 0,
    },
  ].filter(b => b.time > 0);

  return (
    <div className="space-y-3" data-testid="yamazumi-summary">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 gap-2">
        {/* VA Ratio */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Percent size={14} className="text-green-400" />
            <span className="text-xs text-content-secondary">
              {t?.('yamazumi.summary.vaRatio', 'VA Ratio') ?? 'VA Ratio'}
            </span>
          </div>
          <div className="text-xl font-semibold text-content" data-testid="yamazumi-va-ratio">
            {formatPercent(summary.vaRatio)}
          </div>
        </div>

        {/* Process Efficiency */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-blue-400" />
            <span className="text-xs text-content-secondary">
              {t?.('yamazumi.summary.efficiency', 'Process Efficiency') ?? 'Process Efficiency'}
            </span>
          </div>
          <div className="text-xl font-semibold text-content" data-testid="yamazumi-efficiency">
            {formatPercent(summary.processEfficiency)}
          </div>
        </div>
      </div>

      {/* Total Lead Time */}
      <div className="bg-surface-secondary rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-content-secondary">
            {t?.('yamazumi.summary.leadTime', 'Total Lead Time') ?? 'Total Lead Time'}
          </span>
          <span className="text-sm font-medium text-content" data-testid="yamazumi-lead-time">
            {formatTime(summary.totalLeadTime)}
          </span>
        </div>

        {/* Stacked bar breakdown */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {wasteBreakdown.map(b => (
            <div
              key={b.type}
              style={{
                width: `${b.ratio * 100}%`,
                backgroundColor: ACTIVITY_TYPE_COLORS[b.type],
              }}
              title={`${ACTIVITY_TYPE_LABELS[b.type]}: ${formatTime(b.time)} (${formatPercent(b.ratio)})`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {wasteBreakdown.map(b => (
            <div key={b.type} className="flex items-center gap-1 text-xs text-content-secondary">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: ACTIVITY_TYPE_COLORS[b.type] }}
              />
              {ACTIVITY_TYPE_LABELS[b.type]}: {formatTime(b.time)}
            </div>
          ))}
        </div>
      </div>

      {/* Takt Compliance */}
      {(summary.taktTime !== undefined || showTaktEditor) && (
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Timer size={14} className="text-content-secondary" />
              <span className="text-xs text-content-secondary">
                {t?.('yamazumi.summary.takt', 'Takt Time') ?? 'Takt Time'}
              </span>
            </div>

            {showTaktEditor && !editingTakt && (
              <button
                onClick={() => {
                  setTaktInput(summary.taktTime?.toString() ?? '');
                  setEditingTakt(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {summary.taktTime
                  ? formatTime(summary.taktTime)
                  : (t?.('yamazumi.summary.setTakt', 'Set') ?? 'Set')}
              </button>
            )}

            {editingTakt && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={taktInput}
                  onChange={e => setTaktInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTaktSubmit()}
                  className="w-20 px-1.5 py-0.5 text-xs bg-surface-primary border border-edge rounded text-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  autoFocus
                />
                <button
                  onClick={handleTaktSubmit}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {summary.stepsOverTakt.length > 0 && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-400">
                {summary.stepsOverTakt.length}{' '}
                {t?.('yamazumi.summary.overTakt', 'steps over takt') ?? 'steps over takt'}:{' '}
                {summary.stepsOverTakt.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
