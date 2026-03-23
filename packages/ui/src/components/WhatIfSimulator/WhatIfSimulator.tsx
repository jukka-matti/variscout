import React, { useState, useMemo, useCallback, useEffect, useImperativeHandle } from 'react';
import { ChevronRight, ChevronDown, RotateCcw, Beaker, Target, XCircle, Star } from 'lucide-react';
import { simulateDirectAdjustment, simulateOverallImpact } from '@variscout/core';
import type { OverallImpactResult, SpecLimits } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import Slider from '../Slider/Slider';
import type { SliderColorScheme } from '../Slider/Slider';
import DistributionPreview from './DistributionPreview';
import OverallImpactSummary from './OverallImpactSummary';

/**
 * Color scheme for WhatIfSimulator
 */
export interface WhatIfSimulatorColorScheme {
  /** Container border */
  containerBorder: string;
  /** Container background */
  containerBg: string;
  /** Header hover background */
  headerHoverBg: string;
  /** Primary content text */
  contentText: string;
  /** Secondary text */
  secondaryText: string;
  /** Muted text */
  mutedText: string;
  /** Preset button border */
  presetBorder: string;
  /** Preset button background */
  presetBg: string;
  /** Preset button hover background */
  presetHoverBg: string;
  /** Preset button text */
  presetText: string;
  /** Preset button hover text */
  presetHoverText: string;
  /** Projection panel background */
  projectionBg: string;
  /** Projection panel border */
  projectionBorder: string;
  /** Reset hover text */
  resetHoverText: string;
  /** Cpk good color (>= cpkTarget) */
  cpkGood: string;
  /** Cpk marginal color (>= 75% of cpkTarget) */
  cpkOk: string;
  /** Cpk bad color (< 1.0) */
  cpkBad: string;
  /** Positive improvement color */
  improvementPositive: string;
  /** Negative improvement color (Cpk decline, yield decline) */
  improvementNegative: string;
  /** Slider track background */
  sliderTrackBg: string;
  /** Slider ring offset */
  sliderRingOffset: string;
  /** Slider Firefox track background */
  sliderMozTrackBg: string;
}

export const whatIfSimulatorDefaultColorScheme: WhatIfSimulatorColorScheme = {
  containerBorder: 'border-edge',
  containerBg: 'bg-surface/50',
  headerHoverBg: 'hover:bg-surface-tertiary/30',
  contentText: 'text-content',
  secondaryText: 'text-content-secondary',
  mutedText: 'text-content-muted',
  presetBorder: 'border-edge',
  presetBg: 'bg-surface',
  presetHoverBg: 'hover:bg-surface-tertiary',
  presetText: 'text-content-secondary',
  presetHoverText: 'hover:text-content',
  projectionBg: 'bg-surface-tertiary/50',
  projectionBorder: 'border-edge/50',
  resetHoverText: 'hover:text-content',
  cpkGood: 'text-green-400',
  cpkOk: 'text-amber-400',
  cpkBad: 'text-red-400',
  improvementPositive: 'text-green-400',
  improvementNegative: 'text-red-400',
  sliderTrackBg: 'bg-surface-tertiary',
  sliderRingOffset: 'focus:ring-offset-surface',
  sliderMozTrackBg: '[&::-moz-range-track]:bg-surface-tertiary',
};

/**
 * Preset scenario for quick what-if analysis
 */
export interface SimulatorPreset {
  label: string;
  description: string;
  meanShift: number;
  variationReduction: number;
  icon?: 'target' | 'x-circle' | 'star';
}

/**
 * Imperative handle for controlling the simulator from parent
 */
export interface WhatIfSimulatorHandle {
  applyPreset: (preset: SimulatorPreset) => void;
  expand: () => void;
}

export interface WhatIfSimulatorProps {
  currentStats: { mean: number; stdDev: number; cpk?: number };
  specs?: SpecLimits;
  defaultExpanded?: boolean;
  presets?: SimulatorPreset[];
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  initialPreset?: SimulatorPreset | null;
  colorScheme?: WhatIfSimulatorColorScheme;
  /** Cpk target for color thresholds (default 1.33) */
  cpkTarget?: number;
  /** Complement stats — enables overall impact view (omit when no filters active) */
  complementStats?: { mean: number; stdDev: number; count: number };
  /** Count of the filtered subset (for fraction calculation) */
  subsetCount?: number;
  /** Called when simulation parameters change (for external capture) */
  onSimulationChange?: (params: { meanShift: number; variationReduction: number }) => void;
}

// formatNumber is now provided by useTranslation().formatStat inside the component

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

const WhatIfSimulator = ({
  ref,
  currentStats,
  specs,
  defaultExpanded = false,
  presets,
  isExpanded: controlledExpanded,
  onExpandChange,
  initialPreset,
  colorScheme = whatIfSimulatorDefaultColorScheme,
  cpkTarget = 1.33,
  complementStats,
  subsetCount,
  onSimulationChange,
}: WhatIfSimulatorProps & { ref?: React.Ref<WhatIfSimulatorHandle> }) => {
  const { t, formatStat: formatNumber } = useTranslation();
  const c = colorScheme;

  // Derive slider color scheme from simulator scheme
  const sliderColorScheme = useMemo<SliderColorScheme>(
    () => ({
      labelText: c.secondaryText,
      valueText: c.contentText,
      trackBg: c.sliderTrackBg,
      ringOffset: c.sliderRingOffset,
      mozTrackBg: c.sliderMozTrackBg,
    }),
    [c]
  );

  // Get Cpk color based on target-relative thresholds
  const getCpkColor = useCallback(
    (cpk: number): string => {
      if (cpk >= cpkTarget) return c.cpkGood;
      if (cpk >= cpkTarget * 0.75) return c.cpkOk;
      return c.cpkBad;
    },
    [c.cpkGood, c.cpkOk, c.cpkBad, cpkTarget]
  );

  // Panel expansion state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(isExpanded) : value;
      if (controlledExpanded !== undefined) {
        onExpandChange?.(newValue);
      } else {
        setInternalExpanded(newValue);
      }
    },
    [controlledExpanded, isExpanded, onExpandChange]
  );

  // Slider states
  const [meanShift, setMeanShift] = useState(0);
  const [variationReduction, setVariationReduction] = useState(0);

  // Notify parent of simulation parameter changes
  useEffect(() => {
    onSimulationChange?.({ meanShift, variationReduction });
  }, [meanShift, variationReduction, onSimulationChange]);

  // Calculate mean slider range
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

  const projection = useMemo(() => {
    return simulateDirectAdjustment(currentStats, { meanShift, variationReduction }, specs);
  }, [currentStats, meanShift, variationReduction, specs]);

  const currentYield = useMemo(() => {
    const baseline = simulateDirectAdjustment(
      currentStats,
      { meanShift: 0, variationReduction: 0 },
      specs
    );
    return baseline.projectedYield;
  }, [currentStats, specs]);

  const overallImpact = useMemo<OverallImpactResult | null>(() => {
    if (!complementStats || subsetCount === undefined || subsetCount === 0) return null;
    return simulateOverallImpact(
      { mean: currentStats.mean, stdDev: currentStats.stdDev, count: subsetCount },
      complementStats,
      { mean: projection.projectedMean, stdDev: projection.projectedStdDev },
      specs
    );
  }, [complementStats, subsetCount, currentStats, projection, specs]);

  const handleReset = useCallback(() => {
    setMeanShift(0);
    setVariationReduction(0);
  }, []);

  const handleApplyPreset = useCallback((preset: SimulatorPreset) => {
    setMeanShift(preset.meanShift);
    setVariationReduction(preset.variationReduction);
  }, []);

  useEffect(() => {
    if (initialPreset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- applying externally-provided preset (e.g. from AI action tool)
      setMeanShift(initialPreset.meanShift);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- applying externally-provided preset (e.g. from AI action tool)
      setVariationReduction(initialPreset.variationReduction);
    }
  }, [initialPreset]);

  useImperativeHandle(
    ref,
    () => ({
      applyPreset: (preset: SimulatorPreset) => {
        setMeanShift(preset.meanShift);
        setVariationReduction(preset.variationReduction);
      },
      expand: () => {
        setIsExpanded(true);
      },
    }),
    [setIsExpanded]
  );

  const hasAdjustment = meanShift !== 0 || variationReduction !== 0;

  const formatMeanShift = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatNumber(value, 1)}`;
  };

  const formatVariationReduction = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className={`rounded-lg border ${c.containerBorder} ${c.containerBg} overflow-hidden`}>
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2.5 ${c.headerHoverBg} transition-colors`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={14} className={c.mutedText} />
          ) : (
            <ChevronRight size={14} className={c.mutedText} />
          )}
          <Beaker size={14} className="text-blue-400" />
          <span className={`text-sm font-medium ${c.contentText}`}>What-If Simulator</span>
        </div>

        {hasAdjustment && !isExpanded && <span className="text-xs text-blue-400">Active</span>}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4">
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

          {/* Distribution preview */}
          <DistributionPreview
            currentMean={currentStats.mean}
            currentStdDev={currentStats.stdDev}
            projectedMean={projection.projectedMean}
            projectedStdDev={projection.projectedStdDev}
            specs={specs}
          />

          {/* Projection results panel */}
          <div className={`p-3 rounded-lg ${c.projectionBg} border ${c.projectionBorder}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${c.secondaryText}`}>
                {t('whatif.currentProjected')}
              </span>
              {hasAdjustment && (
                <button
                  onClick={handleReset}
                  className={`flex items-center gap-1 text-[10px] ${c.mutedText} ${c.resetHoverText} transition-colors`}
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

              {/* Standard Deviation */}
              <div className="flex items-center justify-between">
                <span className={c.secondaryText}>&sigma;:</span>
                <div className="flex items-center gap-2">
                  <span className={c.mutedText}>{formatNumber(currentStats.stdDev, 2)}</span>
                  <span className={c.mutedText}>&rarr;</span>
                  <span
                    className={
                      hasAdjustment && variationReduction !== 0 ? c.contentText : c.mutedText
                    }
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

          {/* Overall impact summary (only when filtering a subset) */}
          {overallImpact && (
            <OverallImpactSummary
              impact={overallImpact}
              hasAdjustment={hasAdjustment}
              cpkTarget={cpkTarget}
              colorScheme={c}
            />
          )}

          {/* Helper text */}
          <p className={`text-[10px] ${c.mutedText} leading-relaxed`}>
            Explore process improvement by adjusting mean (shift toward target) and reducing
            variation (tighter control). Projections assume normal distribution.
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulator;
