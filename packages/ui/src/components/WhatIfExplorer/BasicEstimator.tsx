import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Target, XCircle, Star, Save } from 'lucide-react';
import { simulateDirectAdjustment, simulateOverallImpact } from '@variscout/core';
import type { FindingProjection, OverallImpactResult } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import Slider from '../Slider/Slider';
import DistributionPreview from '../WhatIfSimulator/DistributionPreview';
import OverallImpactSummary from '../WhatIfSimulator/OverallImpactSummary';
import { whatIfSimulatorDefaultColorScheme } from '../WhatIfSimulator/WhatIfSimulator';
import type { BasicEstimatorProps, SimulatorPreset } from './types';

// ============================================================================
// Helpers
// ============================================================================

function PresetIcon({ icon }: { icon?: SimulatorPreset['icon'] }) {
  switch (icon) {
    case 'target':
      return <Target size={12} />;
    case 'x-circle':
      return <XCircle size={12} />;
    case 'star':
      return <Star size={12} />;
    default:
      return null;
  }
}

/** Map DirectAdjustmentResult fields to FindingProjection shape. */
function buildFindingProjection(
  currentStats: { mean: number; stdDev: number; cpk?: number },
  meanShift: number,
  variationReduction: number,
  result: ReturnType<typeof simulateDirectAdjustment>
): FindingProjection {
  const baselineYield = simulateDirectAdjustment(
    currentStats,
    { meanShift: 0, variationReduction: 0 },
    undefined
  ).projectedYield;

  return {
    baselineMean: currentStats.mean,
    baselineSigma: currentStats.stdDev,
    baselineCpk: currentStats.cpk,
    baselineYield,
    projectedMean: result.projectedMean,
    projectedSigma: result.projectedStdDev,
    projectedCpk: result.projectedCpk,
    projectedYield: result.projectedYield,
    meanDelta: result.projectedMean - currentStats.mean,
    sigmaDelta: result.projectedStdDev - currentStats.stdDev,
    simulationParams: {
      meanAdjustment: meanShift,
      variationReduction,
    },
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// BasicEstimator
// ============================================================================

/**
 * Fallback what-if renderer when no regression model exists.
 * Provides mean/sigma sliders, presets, distribution preview,
 * projection display and a save callback.
 */
export default function BasicEstimator({
  currentStats,
  specs,
  presets,
  complementStats,
  projectionContext: _projectionContext,
  references,
  onProjectionChange,
  onSaveProjection,
  className,
}: BasicEstimatorProps) {
  const { t, formatStat: formatNumber } = useTranslation();

  // Use the existing color scheme constants rather than a color scheme prop.
  const c = whatIfSimulatorDefaultColorScheme;

  const sliderColorScheme = useMemo(
    () => ({
      labelText: c.secondaryText,
      valueText: c.contentText,
      trackBg: c.sliderTrackBg,
      ringOffset: c.sliderRingOffset,
      mozTrackBg: c.sliderMozTrackBg,
    }),
    [c]
  );

  const cpkTarget = 1.33;

  const getCpkColor = useCallback(
    (cpk: number): string => {
      if (cpk >= cpkTarget) return c.cpkGood;
      if (cpk >= cpkTarget * 0.75) return c.cpkOk;
      return c.cpkBad;
    },
    [c.cpkGood, c.cpkOk, c.cpkBad]
  );

  // Slider state
  const [meanShift, setMeanShift] = useState(0);
  const [variationReduction, setVariationReduction] = useState(0);

  // Mean slider range: symmetric around current with target-aware extension
  const meanRange = useMemo(() => {
    let target: number | undefined;
    if (specs?.target !== undefined) {
      target = specs.target;
    } else if (specs?.usl !== undefined && specs?.lsl !== undefined) {
      target = (specs.usl + specs.lsl) / 2;
    }

    if (target !== undefined) {
      const distance = target - currentStats.mean;
      const overshoot = Math.abs(distance) * 0.2;
      if (distance >= 0) {
        return { min: -currentStats.stdDev * 2, max: distance + overshoot };
      } else {
        return { min: distance - overshoot, max: currentStats.stdDev * 2 };
      }
    }

    const range = currentStats.stdDev * 3 || 1;
    return { min: -range, max: range };
  }, [currentStats.mean, currentStats.stdDev, specs]);

  const meanStep = useMemo(() => {
    const range = meanRange.max - meanRange.min;
    const step = range / 20;
    const magnitude = Math.pow(10, Math.floor(Math.log10(step)));
    return Math.max(magnitude * Math.round(step / magnitude), 0.01);
  }, [meanRange]);

  // Simulation result
  const projection = useMemo(
    () => simulateDirectAdjustment(currentStats, { meanShift, variationReduction }, specs),
    [currentStats, meanShift, variationReduction, specs]
  );

  // Baseline yield (no adjustments applied)
  const currentYield = useMemo(() => {
    return simulateDirectAdjustment(currentStats, { meanShift: 0, variationReduction: 0 }, specs)
      .projectedYield;
  }, [currentStats, specs]);

  // Overall impact (only when complementStats provided)
  const overallImpact = useMemo<OverallImpactResult | null>(() => {
    if (!complementStats || complementStats.count === 0) return null;
    return simulateOverallImpact(
      { mean: currentStats.mean, stdDev: currentStats.stdDev, count: complementStats.count },
      complementStats,
      { mean: projection.projectedMean, stdDev: projection.projectedStdDev },
      specs
    );
  }, [complementStats, currentStats, projection, specs]);

  // Notify parent whenever sliders change
  const findingProjection = useMemo(
    () => buildFindingProjection(currentStats, meanShift, variationReduction, projection),
    [currentStats, meanShift, variationReduction, projection]
  );

  // Propagate live projection changes
  const prevProjectionRef = React.useRef<FindingProjection | null>(null);
  React.useEffect(() => {
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

  const hasAdjustment = meanShift !== 0 || variationReduction !== 0;

  const handleReset = useCallback(() => {
    setMeanShift(0);
    setVariationReduction(0);
  }, []);

  const handleApplyPreset = useCallback((preset: SimulatorPreset) => {
    setMeanShift(preset.meanShift);
    setVariationReduction(preset.variationReduction);
  }, []);

  const handleSave = useCallback(() => {
    onSaveProjection?.(findingProjection);
  }, [findingProjection, onSaveProjection]);

  const formatMeanShift = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatNumber(value, 1)}`;
  };

  const formatVariationReduction = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className={`space-y-4 ${className ?? ''}`} data-testid="basic-estimator">
      {/* Sliders */}
      <Slider
        label={t('whatif.adjustMean')}
        value={meanShift}
        onChange={setMeanShift}
        min={meanRange.min}
        max={meanRange.max}
        step={meanStep}
        formatValue={formatMeanShift}
        colorScheme={sliderColorScheme}
      />

      <Slider
        label={t('whatif.reduceVariation')}
        value={variationReduction}
        onChange={setVariationReduction}
        min={0}
        max={0.5}
        step={0.05}
        formatValue={formatVariationReduction}
        colorScheme={sliderColorScheme}
      />

      {/* Preset buttons */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handleApplyPreset(preset)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border ${c.presetBorder}
                         ${c.presetBg} ${c.presetHoverBg} transition-colors ${c.presetText} ${c.presetHoverText}`}
              title={preset.description}
            >
              <PresetIcon icon={preset.icon} />
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Reference markers (simple list when provided) */}
      {references && references.length > 0 && (
        <div className={`text-xs ${c.mutedText} space-y-1`} data-testid="reference-markers">
          {references.map((ref, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={c.secondaryText}>{ref.label}</span>
              <span className="font-mono">
                {formatNumber(ref.value, 1)}
                {ref.cpk !== undefined && (
                  <span className={`ml-2 ${getCpkColor(ref.cpk)}`}>
                    Cpk {formatNumber(ref.cpk, 2)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Distribution preview */}
      <DistributionPreview
        currentMean={currentStats.mean}
        currentStdDev={currentStats.stdDev}
        projectedMean={projection.projectedMean}
        projectedStdDev={projection.projectedStdDev}
        specs={specs}
      />

      {/* Projection results panel */}
      <div
        className={`p-3 rounded-lg ${c.projectionBg} border ${c.projectionBorder}`}
        data-testid="projection-panel"
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${c.secondaryText}`}>
            {t('whatif.currentProjected')}
          </span>
          {hasAdjustment && (
            <button
              onClick={handleReset}
              className={`flex items-center gap-1 text-[0.625rem] ${c.mutedText} ${c.resetHoverText} transition-colors`}
              title={t('whatif.resetAdjustments')}
            >
              <RotateCcw size={10} />
              {t('action.reset')}
            </button>
          )}
        </div>

        <div className="space-y-2 text-xs font-mono">
          {/* Mean */}
          <div className="flex items-center justify-between">
            <span className={c.secondaryText}>Mean:</span>
            <div className="flex items-center gap-2">
              <span className={c.mutedText}>{formatNumber(currentStats.mean, 1)}</span>
              <span className={c.mutedText}>&rarr;</span>
              <span className={hasAdjustment && meanShift !== 0 ? c.contentText : c.mutedText}>
                {formatNumber(projection.projectedMean, 1)}
              </span>
            </div>
          </div>

          {/* Standard deviation */}
          <div className="flex items-center justify-between">
            <span className={c.secondaryText}>&sigma;:</span>
            <div className="flex items-center gap-2">
              <span className={c.mutedText}>{formatNumber(currentStats.stdDev, 2)}</span>
              <span className={c.mutedText}>&rarr;</span>
              <span
                className={hasAdjustment && variationReduction !== 0 ? c.contentText : c.mutedText}
              >
                {formatNumber(projection.projectedStdDev, 2)}
              </span>
              {variationReduction > 0 && (
                <span className={c.improvementPositive}>
                  (-{Math.round(variationReduction * 100)}%)
                </span>
              )}
            </div>
          </div>

          {/* Cpk */}
          {currentStats.cpk !== undefined && projection.projectedCpk !== undefined && (
            <div className="flex items-center justify-between">
              <span className={c.secondaryText}>Cpk:</span>
              <div className="flex items-center gap-2">
                <span className={getCpkColor(currentStats.cpk)}>
                  {formatNumber(currentStats.cpk, 2)}
                </span>
                <span className={c.mutedText}>&rarr;</span>
                <span className={getCpkColor(projection.projectedCpk)}>
                  {formatNumber(projection.projectedCpk, 2)}
                </span>
                {projection.improvements.cpkImprovementPct !== undefined && hasAdjustment && (
                  <span
                    className={
                      projection.improvements.cpkImprovementPct >= 0
                        ? c.improvementPositive
                        : c.improvementNegative
                    }
                  >
                    ({projection.improvements.cpkImprovementPct >= 0 ? '+' : ''}
                    {Math.round(projection.improvements.cpkImprovementPct)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Yield */}
          {currentYield !== undefined && projection.projectedYield !== undefined && (
            <div className="flex items-center justify-between">
              <span className={c.secondaryText}>Yield:</span>
              <div className="flex items-center gap-2">
                <span className={c.mutedText}>{formatNumber(currentYield, 1)}%</span>
                <span className={c.mutedText}>&rarr;</span>
                <span className={hasAdjustment ? c.contentText : c.mutedText}>
                  {formatNumber(projection.projectedYield, 1)}%
                </span>
                {projection.improvements.yieldImprovementPct !== undefined &&
                  hasAdjustment &&
                  Math.abs(projection.improvements.yieldImprovementPct) >= 0.1 && (
                    <span
                      className={
                        projection.improvements.yieldImprovementPct >= 0
                          ? c.improvementPositive
                          : c.improvementNegative
                      }
                    >
                      ({projection.improvements.yieldImprovementPct >= 0 ? '+' : ''}
                      {formatNumber(projection.improvements.yieldImprovementPct, 1)}%)
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall impact (only when filtering a subset) */}
      {overallImpact && (
        <OverallImpactSummary
          impact={overallImpact}
          hasAdjustment={hasAdjustment}
          cpkTarget={cpkTarget}
          colorScheme={c}
        />
      )}

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
                         : `${c.presetBorder} ${c.presetBg} ${c.mutedText} cursor-not-allowed opacity-50`
                     }`}
          data-testid="save-projection-button"
        >
          <Save size={12} />
          Save to idea
        </button>
      )}

      {/* Helper text */}
      <p className={`text-[0.625rem] ${c.mutedText} leading-relaxed`}>
        Explore process improvement by adjusting mean (shift toward target) and reducing variation
        (tighter control). Projections assume normal distribution.
      </p>
    </div>
  );
}
