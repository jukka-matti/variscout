import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS } from '@variscout/core';
import type { FindingProjection } from '@variscout/core';
import type { YamazumiBarData, YamazumiSegment } from '@variscout/core/yamazumi';
import Slider from '../Slider/Slider';
import type { ActivityReducerProps } from './types';

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const rounded60 = Number.isFinite(seconds / 60) ? (seconds / 60).toFixed(1) : '—';
  const rounded = Number.isFinite(seconds) ? seconds.toFixed(1) : '—';
  return seconds >= 60 ? `${rounded60}m` : `${rounded}s`;
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Flat list of (barKey, segment) pairs, sorted waste-first for selector ordering */
interface ActivityEntry {
  id: string;
  barKey: string;
  segment: YamazumiSegment;
  /** Total time for the bar this segment belongs to */
  barTotalTime: number;
}

function buildActivityEntries(activities: YamazumiBarData[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  for (const bar of activities) {
    for (const seg of bar.segments) {
      if (seg.totalTime > 0) {
        entries.push({
          id: `${bar.key}::${seg.activityType}`,
          barKey: bar.key,
          segment: seg,
          barTotalTime: bar.totalTime,
        });
      }
    }
  }
  // Sort: waste first, then by activity type order (reversed = waste, wait, nva-required, va)
  const priority: Record<string, number> = { waste: 0, wait: 1, 'nva-required': 2, va: 3 };
  return entries.sort((a, b) => {
    const pa = priority[a.segment.activityType] ?? 99;
    const pb = priority[b.segment.activityType] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.barKey.localeCompare(b.barKey);
  });
}

/** Build a FindingProjection for yamazumi mode.
 * In yamazumi context, "mean" = cycle time. We encode the time saved as meanDelta.
 */
function buildYamazumiFindingProjection(
  totalCycleTime: number,
  projectedCycleTime: number,
  totalVATime: number,
  projectedVATime: number,
  reduction: number
): FindingProjection {
  const timeSaved = totalCycleTime - projectedCycleTime;

  return {
    baselineMean: totalCycleTime,
    baselineSigma: 0,
    projectedMean: projectedCycleTime,
    projectedSigma: 0,
    meanDelta: -timeSaved, // negative = reduction in cycle time
    sigmaDelta: 0,
    simulationParams: {
      meanAdjustment: -timeSaved, // negative = time saved
      variationReduction: 0,
      presetUsed: reduction === 1.0 ? 'eliminate' : reduction === 0.5 ? 'halve' : undefined,
    },
    createdAt: new Date().toISOString(),
    // Pack lean-specific fields into an extension via optional metadata
    // VA ratio improvement is indicated via targetContribution
    targetContribution:
      totalCycleTime > 0
        ? Math.min(1, (totalVATime / projectedCycleTime - totalVATime / totalCycleTime) / 0.1)
        : 0,
  };
}

// ============================================================================
// ActivityReducer
// ============================================================================

/**
 * Yamazumi mode What-If renderer.
 * Lets the analyst select an activity (segment) from the yamazumi bars
 * and apply a reduction (0–100%) to see the impact on cycle time,
 * VA ratio, and takt compliance.
 */
export default function ActivityReducer({
  activities,
  taktTime,
  bestReference,
  projectionContext: _projectionContext,
  onProjectionChange,
  onSaveProjection,
  className,
}: ActivityReducerProps) {
  const entries = useMemo(() => buildActivityEntries(activities), [activities]);

  const [selectedId, setSelectedId] = useState<string>(() => entries[0]?.id ?? '');
  const [reduction, setReduction] = useState(0);

  const selected = useMemo(() => entries.find(e => e.id === selectedId), [entries, selectedId]);

  // Total cycle time across ALL bars
  const totalCycleTime = useMemo(
    () => activities.reduce((sum, b) => sum + b.totalTime, 0),
    [activities]
  );

  // Total VA time across ALL bars
  const totalVATime = useMemo(
    () =>
      activities.reduce((sum, b) => {
        const vaSeg = b.segments.find(s => s.activityType === 'va');
        return sum + (vaSeg?.totalTime ?? 0);
      }, 0),
    [activities]
  );

  // Current VA ratio
  const currentVARatio = totalCycleTime > 0 ? totalVATime / totalCycleTime : 0;

  // Projected values after reduction
  const timeSaved = selected ? selected.segment.totalTime * reduction : 0;
  const projectedCycleTime = Math.max(0, totalCycleTime - timeSaved);
  const projectedVARatio = projectedCycleTime > 0 ? totalVATime / projectedCycleTime : 0;
  const meetsTakt = taktTime == null ? undefined : projectedCycleTime <= taktTime;

  // "Reach takt" preset: minimum reduction on this segment to meet takt
  const reachTaktReduction = useMemo(() => {
    if (taktTime == null || selected == null || totalCycleTime <= taktTime) return undefined;
    const deficit = totalCycleTime - taktTime;
    if (selected.segment.totalTime <= 0) return undefined;
    return Math.min(deficit / selected.segment.totalTime, 1.0);
  }, [taktTime, selected, totalCycleTime]);

  // "Match best" preset: reduce selected segment to match best reference time
  // (bestReference.time is the total cycle time for the best performer)
  const matchBestReduction = useMemo(() => {
    if (!bestReference || !selected || totalCycleTime <= bestReference.time) return undefined;
    const deficit = totalCycleTime - bestReference.time;
    if (selected.segment.totalTime <= 0) return undefined;
    return Math.min(deficit / selected.segment.totalTime, 1.0);
  }, [bestReference, selected, totalCycleTime]);

  const hasAdjustment = reduction > 0;

  // Produce FindingProjection whenever adjustment changes
  const findingProjection = useMemo(
    () =>
      buildYamazumiFindingProjection(
        totalCycleTime,
        projectedCycleTime,
        totalVATime,
        totalVATime, // VA time is unchanged — only waste/NVA reduced
        reduction
      ),
    [totalCycleTime, projectedCycleTime, totalVATime, reduction]
  );

  const prevProjectionRef = React.useRef<FindingProjection | null>(null);
  React.useEffect(() => {
    const prev = prevProjectionRef.current;
    const changed = prev === null || prev.projectedMean !== findingProjection.projectedMean;
    if (changed) {
      prevProjectionRef.current = findingProjection;
      onProjectionChange?.(findingProjection);
    }
  }, [findingProjection, onProjectionChange]);

  const handleSelectActivity = useCallback((id: string) => {
    setSelectedId(id);
    setReduction(0);
  }, []);

  const handleReset = useCallback(() => setReduction(0), []);

  const handleSave = useCallback(() => {
    onSaveProjection?.(findingProjection);
  }, [findingProjection, onSaveProjection]);

  return (
    <div className={`space-y-4 ${className ?? ''}`} data-testid="activity-reducer">
      {/* Activity selector */}
      <div>
        <label className="text-xs text-content-secondary block mb-1">Target activity</label>
        <select
          value={selectedId}
          onChange={e => handleSelectActivity(e.target.value)}
          className="w-full text-xs bg-surface border border-edge rounded px-2 py-1.5 text-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          data-testid="activity-selector"
        >
          {entries.map(e => (
            <option key={e.id} value={e.id}>
              {ACTIVITY_TYPE_LABELS[e.segment.activityType]} — {e.barKey} (
              {formatTime(e.segment.totalTime)}, {Math.round(e.segment.percentage)}%)
            </option>
          ))}
        </select>
        {selected && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: ACTIVITY_TYPE_COLORS[selected.segment.activityType] }}
            />
            <span className="text-[0.625rem] text-content-muted">
              {formatTime(selected.segment.totalTime)} in {selected.barKey} (
              {ACTIVITY_TYPE_LABELS[selected.segment.activityType]})
            </span>
          </div>
        )}
      </div>

      {/* Reduction slider */}
      {selected && (
        <>
          <Slider
            label="Reduce activity time"
            value={reduction}
            onChange={setReduction}
            min={0}
            max={1}
            step={0.01}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
          {hasAdjustment && (
            <div className="text-[0.625rem] text-content-secondary font-mono">
              {formatTime(selected.segment.totalTime)} &rarr;{' '}
              {formatTime(selected.segment.totalTime * (1 - reduction))} (&minus;
              {Math.round(reduction * 100)}%)
            </div>
          )}

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReduction(1.0)}
              className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
              title="Eliminate this activity entirely"
              data-testid="preset-eliminate"
            >
              Eliminate
            </button>
            <button
              onClick={() => setReduction(0.5)}
              className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
              title="Reduce by half"
              data-testid="preset-halve"
            >
              Halve
            </button>
            {matchBestReduction !== undefined && matchBestReduction > 0 && (
              <button
                onClick={() => setReduction(matchBestReduction)}
                className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                title={`Match ${bestReference!.name} (${formatTime(bestReference!.time)})`}
                data-testid="preset-match-best"
              >
                Match {bestReference!.name}
              </button>
            )}
            {reachTaktReduction !== undefined && reachTaktReduction <= 1.0 && (
              <button
                onClick={() => setReduction(reachTaktReduction)}
                className="px-2.5 py-1.5 text-xs rounded border border-edge bg-surface hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content"
                title={`Minimum reduction to reach takt time (${formatTime(taktTime!)})`}
                data-testid="preset-reach-takt"
              >
                Reach takt
              </button>
            )}
          </div>
        </>
      )}

      {/* Projection results */}
      <div
        className="p-3 rounded-lg bg-surface-tertiary/50 border border-edge/50"
        data-testid="projection-panel"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-content-secondary">Projection</span>
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

        <div className="space-y-1.5 text-xs font-mono">
          {/* Cycle Time */}
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">CT:</span>
            <div className="flex items-center gap-2">
              <span className="text-content-muted">{formatTime(totalCycleTime)}</span>
              <span className="text-content-muted">&rarr;</span>
              <span className={hasAdjustment ? 'text-content' : 'text-content-muted'}>
                {formatTime(projectedCycleTime)}
              </span>
              {hasAdjustment && totalCycleTime > 0 && (
                <span className="text-green-400">
                  (&minus;
                  {Math.round(((totalCycleTime - projectedCycleTime) / totalCycleTime) * 100)}%)
                </span>
              )}
            </div>
          </div>

          {/* VA Ratio */}
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">VA:</span>
            <div className="flex items-center gap-2">
              <span className="text-content-muted">{formatPct(currentVARatio)}</span>
              <span className="text-content-muted">&rarr;</span>
              <span className={hasAdjustment ? 'text-content' : 'text-content-muted'}>
                {formatPct(projectedVARatio)}
              </span>
              {hasAdjustment && projectedVARatio > currentVARatio && (
                <span className="text-green-400">
                  (+{Math.round((projectedVARatio - currentVARatio) * 100)}pp)
                </span>
              )}
            </div>
          </div>

          {/* Takt compliance */}
          {taktTime != null && (
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Takt:</span>
              <span className={meetsTakt ? 'text-green-400' : 'text-red-400'}>
                {meetsTakt ? '\u2713 Meets' : '\u2717 Exceeds'} ({formatTime(taktTime)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Save projection button */}
      {onSaveProjection && (
        <button
          onClick={handleSave}
          disabled={!hasAdjustment}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded
                     border transition-colors
                     ${
                       hasAdjustment
                         ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                         : 'border-edge bg-surface text-content-muted cursor-not-allowed opacity-50'
                     }`}
          data-testid="save-projection-button"
        >
          <Save size={12} />
          Save to idea
        </button>
      )}

      {/* Helper text */}
      <p className="text-[0.625rem] text-content-muted leading-relaxed">
        Select an activity and reduce its time to see the impact on cycle time, value-adding ratio,
        and takt compliance.
      </p>
    </div>
  );
}

// Re-export types that tests might need
export type { ActivityEntry };
