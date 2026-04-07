/**
 * @deprecated Use WhatIfExplorer (ActivityReducer mode) from @variscout/ui instead.
 * This component remains until WhatIfPageBase (improvement workflow full page) is migrated.
 */
import React, { useMemo, useCallback } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS } from '@variscout/core';
import type { LeanProjectionResult } from '@variscout/core';
import type { ActivityType } from '@variscout/core';
import Slider from '../Slider/Slider';

/** A single activity in the yamazumi time breakdown */
export interface LeanActivity {
  id: string;
  name: string;
  type: ActivityType;
  time: number;
  /** Percentage of total cycle time */
  percentage: number;
}

export interface LeanWhatIfSimulatorProps {
  /** All activities with their times and types */
  activities: LeanActivity[];
  /** Takt time (optional, shows compliance) */
  taktTime?: number;
  /** Currently selected activity ID */
  selectedActivityId?: string;
  /** Callback when activity selection changes */
  onActivitySelect: (activityId: string) => void;
  /** Callback when reduction changes */
  onReductionChange: (reduction: number) => void;
  /** Current reduction value (0-1) */
  reduction: number;
  /** Current projection result */
  projection?: LeanProjectionResult;
  /** Best reference for "Match best" preset */
  bestReference?: { name: string; time: number };
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  return seconds >= 60 ? `${(seconds / 60).toFixed(1)}m` : `${seconds.toFixed(1)}s`;
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const LeanWhatIfSimulator: React.FC<LeanWhatIfSimulatorProps> = ({
  activities,
  taktTime,
  selectedActivityId,
  onActivitySelect,
  onReductionChange,
  reduction,
  projection,
  bestReference,
  className = '',
}) => {
  const selected = useMemo(
    () => activities.find(a => a.id === selectedActivityId),
    [activities, selectedActivityId]
  );

  const totalCycleTime = useMemo(
    () => activities.reduce((sum, a) => sum + a.time, 0),
    [activities]
  );

  // Compute "reach takt" reduction: minimum reduction on this activity to meet takt
  const reachTaktReduction = useMemo(() => {
    if (!taktTime || !selected || totalCycleTime <= taktTime) return undefined;
    const deficit = totalCycleTime - taktTime;
    if (selected.time <= 0) return undefined;
    return Math.min(deficit / selected.time, 1.0);
  }, [taktTime, selected, totalCycleTime]);

  const projectedTime = selected ? selected.time * (1 - reduction) : 0;

  const handleReset = useCallback(() => {
    onReductionChange(0);
  }, [onReductionChange]);

  const hasAdjustment = reduction > 0;

  return (
    <div className={`rounded-lg border border-edge bg-surface/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <ChevronDown size={14} className="text-content-muted" />
          <span className="text-sm font-medium text-content">Lean What-If</span>
        </div>
        {hasAdjustment && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[0.625rem] text-content-muted hover:text-content transition-colors"
            title="Reset adjustment"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      <div className="px-3 pb-3 space-y-4">
        {/* Activity selector */}
        <div>
          <label className="text-xs text-content-secondary block mb-1">Target activity</label>
          <select
            value={selectedActivityId ?? ''}
            onChange={e => {
              onActivitySelect(e.target.value);
              onReductionChange(0);
            }}
            className="w-full text-xs bg-surface border border-edge rounded px-2 py-1.5 text-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {ACTIVITY_TYPE_LABELS[a.type]} — {a.name} ({formatTime(a.time)},{' '}
                {Math.round(a.percentage)}%)
              </option>
            ))}
          </select>
          {selected && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: ACTIVITY_TYPE_COLORS[selected.type] }}
              />
              <span className="text-[0.625rem] text-content-muted">
                {formatTime(selected.time)} of {formatTime(totalCycleTime)} cycle time
              </span>
            </div>
          )}
        </div>

        {/* Reduction slider */}
        {selected && (
          <>
            <div>
              <Slider
                label="Reduce activity time"
                value={reduction}
                onChange={onReductionChange}
                min={0}
                max={1}
                step={0.01}
                formatValue={v => `${Math.round(v * 100)}%`}
              />
              {hasAdjustment && (
                <div className="text-[0.625rem] text-content-secondary mt-1 font-mono">
                  {formatTime(selected.time)} &rarr; {formatTime(projectedTime)} (&minus;
                  {Math.round(reduction * 100)}%)
                </div>
              )}
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onReductionChange(1.0)}
                className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                title="Eliminate this activity entirely"
              >
                Eliminate
              </button>
              {bestReference && bestReference.time < selected.time && (
                <button
                  onClick={() =>
                    onReductionChange(
                      Math.min((selected.time - bestReference.time) / selected.time, 1.0)
                    )
                  }
                  className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                  title={`Match ${bestReference.name} (${formatTime(bestReference.time)})`}
                >
                  Match {bestReference.name}
                </button>
              )}
              {reachTaktReduction !== undefined && reachTaktReduction <= 1.0 && (
                <button
                  onClick={() => onReductionChange(reachTaktReduction)}
                  className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                  title={`Minimum reduction to meet takt time (${formatTime(taktTime!)})`}
                >
                  Reach takt
                </button>
              )}
              <button
                onClick={() => onReductionChange(0.5)}
                className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                title="Reduce by half"
              >
                Halve
              </button>
            </div>
          </>
        )}

        {/* Result metrics */}
        {projection && (
          <div className="p-3 rounded-lg bg-surface-tertiary/50 border border-edge/50">
            <span className="text-xs font-medium text-content-secondary block mb-2">
              Projection
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              {/* Cycle Time */}
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">CT:</span>
                <div className="flex items-center gap-2">
                  <span className="text-content-muted">
                    {formatTime(projection.currentCycleTime)}
                  </span>
                  <span className="text-content-muted">&rarr;</span>
                  <span className={hasAdjustment ? 'text-content' : 'text-content-muted'}>
                    {formatTime(projection.projectedCycleTime)}
                  </span>
                  {hasAdjustment && (
                    <span className="text-green-400">
                      (&minus;
                      {Math.round(
                        ((projection.currentCycleTime - projection.projectedCycleTime) /
                          projection.currentCycleTime) *
                          100
                      )}
                      %)
                    </span>
                  )}
                </div>
              </div>

              {/* VA Ratio */}
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">VA:</span>
                <div className="flex items-center gap-2">
                  <span className="text-content-muted">{formatPct(projection.currentVARatio)}</span>
                  <span className="text-content-muted">&rarr;</span>
                  <span className={hasAdjustment ? 'text-content' : 'text-content-muted'}>
                    {formatPct(projection.projectedVARatio)}
                  </span>
                  {hasAdjustment && (
                    <span className="text-green-400">
                      (+
                      {Math.round((projection.projectedVARatio - projection.currentVARatio) * 100)}
                      pp)
                    </span>
                  )}
                </div>
              </div>

              {/* Takt compliance */}
              {projection.taktTime != null && (
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Takt:</span>
                  <span className={projection.meetsTakt ? 'text-green-400' : 'text-red-400'}>
                    {projection.meetsTakt ? '\u2713 Meets' : '\u2717 Exceeds'} (
                    {formatTime(projection.taktTime)})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Helper text */}
        <p className="text-[0.625rem] text-content-muted leading-relaxed">
          Select an activity and reduce its time to see the impact on cycle time, value-adding
          ratio, and takt compliance.
        </p>
      </div>
    </div>
  );
};

export default LeanWhatIfSimulator;
