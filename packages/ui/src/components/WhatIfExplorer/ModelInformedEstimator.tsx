import React, { useState, useMemo, useCallback } from 'react';
import { Save, AlertTriangle, BarChart3, TrendingUp, Database } from 'lucide-react';
import { simulateDirectAdjustment } from '@variscout/core';
import type { FindingProjection } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import Slider from '../Slider/Slider';
import { whatIfSimulatorDefaultColorScheme } from './colorScheme';
import type { ModelInformedEstimatorProps, WhatIfReference } from './types';

// ============================================================================
// Constants
// ============================================================================

/** Labels for the gap closure slider tick marks */
const GAP_CLOSURE_LABELS: { value: number; label: string }[] = [
  { value: 0.25, label: 'Minor' },
  { value: 0.5, label: 'Half' },
  { value: 0.75, label: 'Most' },
  { value: 1.0, label: 'All' },
];

// ============================================================================
// Helpers
// ============================================================================

/** Icon for reference source type */
function ReferenceIcon({ source }: { source: WhatIfReference['source'] }) {
  switch (source) {
    case 'empirical':
      return <Database size={10} className="text-blue-400" />;
    case 'model':
      return <TrendingUp size={10} className="text-violet-400" />;
    case 'statistical':
      return <BarChart3 size={10} className="text-amber-400" />;
    default:
      return null;
  }
}

/** Build FindingProjection from model-informed estimation parameters */
function buildModelProjection(
  currentStats: { mean: number; stdDev: number; cpk?: number },
  meanDelta: number,
  variationReduction: number,
  result: ReturnType<typeof simulateDirectAdjustment>,
  modelContext: {
    linkedFactor?: string;
    gapClosure: number;
    factorGap?: number;
    rSquaredAdj: number;
  }
): FindingProjection {
  const baselineResult = simulateDirectAdjustment(
    currentStats,
    { meanShift: 0, variationReduction: 0 },
    undefined
  );

  return {
    baselineMean: currentStats.mean,
    baselineSigma: currentStats.stdDev,
    baselineCpk: currentStats.cpk,
    baselineYield: baselineResult.projectedYield,
    projectedMean: result.projectedMean,
    projectedSigma: result.projectedStdDev,
    projectedCpk: result.projectedCpk,
    projectedYield: result.projectedYield,
    meanDelta,
    sigmaDelta: result.projectedStdDev - currentStats.stdDev,
    simulationParams: {
      meanAdjustment: meanDelta,
      variationReduction,
    },
    createdAt: new Date().toISOString(),
    modelContext: {
      linkedFactor: modelContext.linkedFactor,
      gapClosure: modelContext.gapClosure,
      factorGap: modelContext.factorGap,
      rSquaredAdj: modelContext.rSquaredAdj,
    },
  };
}

// ============================================================================
// ModelInformedEstimator
// ============================================================================

/**
 * Model-informed what-if renderer: uses regression model to provide
 * factor gap context and ceiling, while the analyst estimates closure fraction.
 *
 * Design principle: "Model informs, analyst estimates."
 */
export default function ModelInformedEstimator({
  currentStats,
  specs,
  model,
  projectionContext,
  references,
  onProjectionChange,
  onSaveProjection,
  className,
}: ModelInformedEstimatorProps) {
  const { formatStat: formatNumber } = useTranslation();

  const c = whatIfSimulatorDefaultColorScheme;
  const cpkTarget = 1.33;

  const getCpkColor = useCallback(
    (cpk: number): string => {
      if (cpk >= cpkTarget) return c.cpkGood;
      if (cpk >= cpkTarget * 0.75) return c.cpkOk;
      return c.cpkBad;
    },
    [c.cpkGood, c.cpkOk, c.cpkBad]
  );

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

  // Slider state
  const [gapClosure, setGapClosure] = useState(0);
  const [variationReduction, setVariationReduction] = useState(0);

  const hasLinkedFactor = Boolean(
    projectionContext?.linkedFactor && projectionContext?.linkedFactorGap !== undefined
  );

  // Compute mean delta from gap closure
  const meanDelta = useMemo(() => {
    if (!hasLinkedFactor || projectionContext?.linkedFactorGap === undefined) return 0;
    // The gap represents the difference the factor causes.
    // Closing the gap means reducing the effect, so the mean moves
    // toward the better level by gapClosure fraction of the gap.
    return gapClosure * projectionContext.linkedFactorGap;
  }, [gapClosure, projectionContext?.linkedFactorGap, hasLinkedFactor]);

  // Simulation result
  const projection = useMemo(
    () =>
      simulateDirectAdjustment(currentStats, { meanShift: meanDelta, variationReduction }, specs),
    [currentStats, meanDelta, variationReduction, specs]
  );

  // Baseline yield
  const currentYield = useMemo(() => {
    return simulateDirectAdjustment(currentStats, { meanShift: 0, variationReduction: 0 }, specs)
      .projectedYield;
  }, [currentStats, specs]);

  // Build FindingProjection
  const findingProjection = useMemo(
    () =>
      buildModelProjection(currentStats, meanDelta, variationReduction, projection, {
        linkedFactor: projectionContext?.linkedFactor,
        gapClosure,
        factorGap: projectionContext?.linkedFactorGap,
        rSquaredAdj: model.rSquaredAdj,
      }),
    [
      currentStats,
      meanDelta,
      variationReduction,
      projection,
      projectionContext?.linkedFactor,
      projectionContext?.linkedFactorGap,
      gapClosure,
      model.rSquaredAdj,
    ]
  );

  // Notify parent on changes
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

  const hasAdjustment = gapClosure !== 0 || variationReduction !== 0;

  const handleSave = useCallback(() => {
    onSaveProjection?.(findingProjection);
  }, [findingProjection, onSaveProjection]);

  const formatGapClosure = (value: number) => `${Math.round(value * 100)}%`;
  const formatVariationReduction = (value: number) => `${Math.round(value * 100)}%`;

  // Find the closest label for the current gap closure
  const closestLabel = useMemo(() => {
    const match = GAP_CLOSURE_LABELS.find(l => Math.abs(l.value - gapClosure) < 0.02);
    return match?.label;
  }, [gapClosure]);

  return (
    <div className={`space-y-4 ${className ?? ''}`} data-testid="model-informed-estimator">
      {/* Idea context header */}
      {projectionContext?.ideaText && (
        <div className={`text-xs ${c.secondaryText} space-y-1`} data-testid="idea-context">
          <div className="font-medium text-content truncate">{projectionContext.ideaText}</div>
          {projectionContext.questionText && (
            <div className={`${c.mutedText} truncate`}>{projectionContext.questionText}</div>
          )}
        </div>
      )}

      {/* Gap context */}
      {hasLinkedFactor && projectionContext?.linkedFactorGap !== undefined && (
        <div
          className={`p-2.5 rounded-lg ${c.projectionBg} border ${c.projectionBorder} text-xs`}
          data-testid="gap-context"
        >
          <div className={`${c.secondaryText} mb-1`}>Factor gap</div>
          <div className="font-mono text-content">
            <span className="font-medium">{projectionContext.linkedFactor}</span>
            {' gap: '}
            <span className="font-semibold">
              {formatNumber(Math.abs(projectionContext.linkedFactorGap), 1)}
            </span>
            {model.rSquaredAdj !== undefined && (
              <span className={`ml-2 ${c.mutedText}`}>
                R²adj {formatNumber(model.rSquaredAdj * 100, 0)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* No linked factor message */}
      {!hasLinkedFactor && (
        <div
          className={`p-2.5 rounded-lg ${c.projectionBg} border ${c.projectionBorder} text-xs ${c.mutedText}`}
          data-testid="no-factor-message"
        >
          No factor linked — use basic estimation
        </div>
      )}

      {/* Gap closure slider */}
      <div>
        <Slider
          label="How much of this gap will your action close?"
          value={gapClosure}
          onChange={setGapClosure}
          min={0}
          max={1}
          step={0.05}
          formatValue={formatGapClosure}
          colorScheme={sliderColorScheme}
          disabled={!hasLinkedFactor}
        />
        {/* Tick mark labels */}
        <div className="flex justify-between mt-1 px-0.5">
          {GAP_CLOSURE_LABELS.map(tick => (
            <span
              key={tick.value}
              className={`text-[0.6rem] ${
                closestLabel === tick.label ? 'text-content font-medium' : c.mutedText
              }`}
            >
              {tick.value * 100}% {tick.label}
            </span>
          ))}
        </div>
      </div>

      {/* Variation reduction slider */}
      <Slider
        label="Additional variation reduction"
        value={variationReduction}
        onChange={setVariationReduction}
        min={0}
        max={0.5}
        step={0.05}
        formatValue={formatVariationReduction}
        colorScheme={sliderColorScheme}
      />

      {/* Interaction warning */}
      {model.hasInteractionTerms && (
        <div
          className={`flex items-start gap-2 p-2 rounded text-[0.65rem] ${c.mutedText} ${c.projectionBg}`}
          data-testid="interaction-warning"
        >
          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            Factor interactions detected — combined improvement may differ from individual
            projections
          </span>
        </div>
      )}

      {/* Reference markers */}
      {references && references.length > 0 && (
        <div className={`text-xs ${c.mutedText} space-y-1`} data-testid="reference-markers">
          {references.map((ref, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 ${c.secondaryText}`}>
                <ReferenceIcon source={ref.source} />
                {ref.label}
              </span>
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

      {/* Projection results panel */}
      <div
        className={`p-3 rounded-lg ${c.projectionBg} border ${c.projectionBorder}`}
        data-testid="projection-panel"
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${c.secondaryText}`}>Projected outcome</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {/* Mean */}
          <div className="flex items-center justify-between">
            <span className={c.secondaryText}>Mean:</span>
            <div className="flex items-center gap-2">
              <span className={c.mutedText}>{formatNumber(currentStats.mean, 1)}</span>
              <span className={c.mutedText}>&rarr;</span>
              <span className={hasAdjustment && meanDelta !== 0 ? c.contentText : c.mutedText}>
                {formatNumber(projection.projectedMean, 1)}
              </span>
            </div>
          </div>

          {/* Sigma */}
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
        The model identifies factor gaps as context. You estimate what fraction your specific action
        will close. Projections assume normal distribution.
      </p>
    </div>
  );
}
