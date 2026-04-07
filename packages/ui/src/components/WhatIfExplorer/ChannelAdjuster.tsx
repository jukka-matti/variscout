import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { simulateDirectAdjustment } from '@variscout/core';
import type { FindingProjection, ChannelResult } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import Slider from '../Slider/Slider';
import type { ChannelAdjusterProps } from './types';

// ============================================================================
// Helpers
// ============================================================================

const CPK_TARGET = 1.33;

function getCpkColor(cpk: number | undefined): string {
  if (cpk == null) return 'text-content-muted';
  if (cpk >= CPK_TARGET) return 'text-green-400';
  if (cpk >= CPK_TARGET * 0.75) return 'text-amber-400';
  return 'text-red-400';
}

function formatCpk(cpk: number | undefined, formatStat: (n: number, d: number) => string): string {
  if (cpk == null || !Number.isFinite(cpk)) return '—';
  return formatStat(cpk, 2);
}

/** Sort channels worst-first by Cpk (ascending, undefined Cpk goes last). */
function sortChannelsWorstFirst(channels: ChannelResult[]): ChannelResult[] {
  return [...channels].sort((a, b) => {
    if (a.cpk == null && b.cpk == null) return 0;
    if (a.cpk == null) return 1;
    if (b.cpk == null) return -1;
    return a.cpk - b.cpk; // ascending = worst first
  });
}

/** Build a FindingProjection for a single channel adjustment. */
function buildChannelFindingProjection(
  channel: ChannelResult,
  meanShift: number,
  variationReduction: number,
  result: ReturnType<typeof simulateDirectAdjustment>
): FindingProjection {
  const baselineResult = simulateDirectAdjustment(
    { mean: channel.mean, stdDev: channel.stdDev, cpk: channel.cpk },
    { meanShift: 0, variationReduction: 0 },
    undefined
  );

  return {
    baselineMean: channel.mean,
    baselineSigma: channel.stdDev,
    baselineCpk: channel.cpk,
    baselineYield: baselineResult.projectedYield,
    projectedMean: result.projectedMean,
    projectedSigma: result.projectedStdDev,
    projectedCpk: result.projectedCpk,
    projectedYield: result.projectedYield,
    meanDelta: result.projectedMean - channel.mean,
    sigmaDelta: result.projectedStdDev - channel.stdDev,
    simulationParams: {
      meanAdjustment: meanShift,
      variationReduction,
    },
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// ChannelAdjuster
// ============================================================================

/**
 * Performance mode What-If renderer.
 * Shows channels sorted worst-first by Cpk.
 * Lets the analyst adjust mean and variation for the selected channel,
 * then view per-channel and overall Cpk impact.
 */
export default function ChannelAdjuster({
  currentStats: _currentStats,
  specs,
  channels,
  selectedChannel: externalSelectedChannel,
  projectionContext: _projectionContext,
  references,
  onProjectionChange,
  onSaveProjection,
  className,
}: ChannelAdjusterProps) {
  const sortedChannels = useMemo(() => sortChannelsWorstFirst(channels), [channels]);

  // Default to worst channel (first after sort), or externally controlled selection
  const defaultId = externalSelectedChannel ?? sortedChannels[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState<string>(defaultId);
  const [meanShift, setMeanShift] = useState(0);
  const [variationReduction, setVariationReduction] = useState(0);

  const selectedChannel = useMemo(
    () => sortedChannels.find(c => c.id === selectedId),
    [sortedChannels, selectedId]
  );

  // When channel selection changes, reset sliders
  const handleSelectChannel = useCallback((id: string) => {
    setSelectedId(id);
    setMeanShift(0);
    setVariationReduction(0);
  }, []);

  // Mean slider range: symmetric around 0 (shift from current mean)
  const meanRange = useMemo(() => {
    if (!selectedChannel) return { min: -1, max: 1 };
    const range = selectedChannel.stdDev * 3 || 1;
    return { min: -range, max: range };
  }, [selectedChannel]);

  const meanStep = useMemo(() => {
    const range = meanRange.max - meanRange.min;
    const step = range / 20;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(step, 1e-10))));
    return Math.max(magnitude * Math.round(step / magnitude), 0.001);
  }, [meanRange]);

  // Simulate adjustment on selected channel
  const channelProjection = useMemo(() => {
    if (!selectedChannel) return null;
    return simulateDirectAdjustment(
      { mean: selectedChannel.mean, stdDev: selectedChannel.stdDev, cpk: selectedChannel.cpk },
      { meanShift, variationReduction },
      specs
    );
  }, [selectedChannel, meanShift, variationReduction, specs]);

  // Overall Cpk: worst Cpk across all channels after adjusting selected one
  const overallCurrentCpk = useMemo(() => {
    const cpks = channels.map(c => c.cpk).filter((c): c is number => c != null);
    if (cpks.length === 0) return undefined;
    return Math.min(...cpks);
  }, [channels]);

  const overallProjectedCpk = useMemo(() => {
    if (!selectedChannel || !channelProjection) return overallCurrentCpk;
    const cpks = channels
      .map(c => {
        if (c.id === selectedChannel.id) return channelProjection.projectedCpk;
        return c.cpk;
      })
      .filter((c): c is number => c != null);
    if (cpks.length === 0) return undefined;
    return Math.min(...cpks);
  }, [channels, selectedChannel, channelProjection, overallCurrentCpk]);

  const hasAdjustment = meanShift !== 0 || variationReduction !== 0;

  // FindingProjection for save/live callback
  const findingProjection = useMemo<FindingProjection | null>(() => {
    if (!selectedChannel || !channelProjection) return null;
    return buildChannelFindingProjection(
      selectedChannel,
      meanShift,
      variationReduction,
      channelProjection
    );
  }, [selectedChannel, meanShift, variationReduction, channelProjection]);

  // Propagate live projection changes
  const prevProjectionRef = React.useRef<FindingProjection | null>(null);
  React.useEffect(() => {
    if (!findingProjection) return;
    const prev = prevProjectionRef.current;
    const changed =
      prev === null ||
      prev.projectedMean !== findingProjection.projectedMean ||
      prev.projectedSigma !== findingProjection.projectedSigma;
    if (changed) {
      prevProjectionRef.current = findingProjection;
      onProjectionChange?.(findingProjection);
    }
  }, [findingProjection, onProjectionChange]);

  const { formatStat } = useTranslation();

  const handleReset = useCallback(() => {
    setMeanShift(0);
    setVariationReduction(0);
  }, []);

  const handleSave = useCallback(() => {
    if (findingProjection) {
      onSaveProjection?.(findingProjection);
    }
  }, [findingProjection, onSaveProjection]);

  const formatMeanShift = useCallback(
    (value: number) => {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${Number.isFinite(value) ? formatStat(value, 2) : '—'}`;
    },
    [formatStat]
  );

  return (
    <div className={`space-y-4 ${className ?? ''}`} data-testid="channel-adjuster">
      {/* Channel selector */}
      <div>
        <label className="text-xs text-content-secondary block mb-1">
          Channel <span className="text-content-muted font-normal">(worst Cpk first)</span>
        </label>
        <select
          value={selectedId}
          onChange={e => handleSelectChannel(e.target.value)}
          className="w-full text-xs bg-surface border border-edge rounded px-2 py-1.5 text-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          data-testid="channel-selector"
        >
          {sortedChannels.map(ch => (
            <option key={ch.id} value={ch.id}>
              {ch.label}
              {ch.cpk != null && Number.isFinite(ch.cpk) ? ` — Cpk ${formatStat(ch.cpk, 2)}` : ''}
            </option>
          ))}
        </select>
        {selectedChannel && (
          <div className="flex items-center gap-3 mt-1 text-[0.625rem] text-content-muted font-mono">
            <span>n={selectedChannel.n}</span>
            <span>
              &mu;={formatStat(selectedChannel.mean, 2)} &sigma;=
              {formatStat(selectedChannel.stdDev, 3)}
            </span>
            {selectedChannel.cpk != null && (
              <span className={getCpkColor(selectedChannel.cpk)}>
                Cpk {formatStat(selectedChannel.cpk, 2)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sliders */}
      {selectedChannel && (
        <>
          <Slider
            label="Adjust mean"
            value={meanShift}
            onChange={setMeanShift}
            min={meanRange.min}
            max={meanRange.max}
            step={meanStep}
            formatValue={formatMeanShift}
          />

          <Slider
            label="Reduce variation"
            value={variationReduction}
            onChange={setVariationReduction}
            min={0}
            max={0.5}
            step={0.05}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
        </>
      )}

      {/* Reference markers */}
      {references && references.length > 0 && (
        <div className="text-xs text-content-muted space-y-1" data-testid="reference-markers">
          {references.map((ref, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-content-secondary">{ref.label}</span>
              <span className="font-mono">
                {Number.isFinite(ref.value) ? formatStat(ref.value, 2) : '—'}
                {ref.cpk != null && Number.isFinite(ref.cpk) && (
                  <span className={`ml-2 ${getCpkColor(ref.cpk)}`}>
                    Cpk {formatStat(ref.cpk, 2)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Projection panel */}
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
              title="Reset adjustments"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {/* Selected channel Cpk */}
          {selectedChannel && channelProjection && (
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">{selectedChannel.label} Cpk:</span>
              <div className="flex items-center gap-2">
                <span className={getCpkColor(selectedChannel.cpk)}>
                  {formatCpk(selectedChannel.cpk, formatStat)}
                </span>
                <span className="text-content-muted">&rarr;</span>
                <span className={getCpkColor(channelProjection.projectedCpk)}>
                  {formatCpk(channelProjection.projectedCpk, formatStat)}
                </span>
                {hasAdjustment &&
                  selectedChannel.cpk != null &&
                  channelProjection.projectedCpk != null && (
                    <span
                      className={
                        channelProjection.projectedCpk >= selectedChannel.cpk
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      ({channelProjection.projectedCpk >= selectedChannel.cpk ? '+' : ''}
                      {Math.round(
                        ((channelProjection.projectedCpk - selectedChannel.cpk) /
                          Math.abs(selectedChannel.cpk || 1)) *
                          100
                      )}
                      %)
                    </span>
                  )}
              </div>
            </div>
          )}

          {/* Mean */}
          {selectedChannel && channelProjection && (
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Mean:</span>
              <div className="flex items-center gap-2">
                <span className="text-content-muted">{formatStat(selectedChannel.mean, 2)}</span>
                <span className="text-content-muted">&rarr;</span>
                <span
                  className={
                    hasAdjustment && meanShift !== 0 ? 'text-content' : 'text-content-muted'
                  }
                >
                  {formatStat(channelProjection.projectedMean, 2)}
                </span>
              </div>
            </div>
          )}

          {/* Sigma */}
          {selectedChannel && channelProjection && (
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">&sigma;:</span>
              <div className="flex items-center gap-2">
                <span className="text-content-muted">{formatStat(selectedChannel.stdDev, 3)}</span>
                <span className="text-content-muted">&rarr;</span>
                <span
                  className={
                    hasAdjustment && variationReduction !== 0
                      ? 'text-content'
                      : 'text-content-muted'
                  }
                >
                  {formatStat(channelProjection.projectedStdDev, 3)}
                </span>
                {variationReduction > 0 && (
                  <span className="text-green-400">(-{Math.round(variationReduction * 100)}%)</span>
                )}
              </div>
            </div>
          )}

          {/* Overall Cpk */}
          {overallCurrentCpk != null && (
            <div className="flex items-center justify-between border-t border-edge/30 pt-1.5 mt-1">
              <span className="text-content-secondary">Overall Cpk:</span>
              <div className="flex items-center gap-2">
                <span className={getCpkColor(overallCurrentCpk)}>
                  {formatCpk(overallCurrentCpk, formatStat)}
                </span>
                <span className="text-content-muted">&rarr;</span>
                <span className={getCpkColor(overallProjectedCpk)}>
                  {formatCpk(overallProjectedCpk, formatStat)}
                </span>
              </div>
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
        Select a channel (worst Cpk first) and adjust its mean or reduce variation to see the per-
        channel and overall capability impact.
      </p>
    </div>
  );
}
