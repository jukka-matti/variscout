import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, GitBranch } from 'lucide-react';
import {
  simulateFromModel,
  simulateDirectAdjustment,
  getFactorBaselines,
  type MultiRegressionResult,
  type DataRow,
  type FactorAdjustment,
  type FactorBaseline,
} from '@variscout/core';
import type { WhatIfSimulatorColorScheme } from './WhatIfSimulator';
import { whatIfSimulatorDefaultColorScheme } from './WhatIfSimulator';
import Slider from '../Slider/Slider';
import type { SliderColorScheme } from '../Slider/Slider';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';

export interface ModelDrivenSimulatorProps {
  /** Regression model from Advanced mode */
  model: MultiRegressionResult;
  /** Filtered data for computing baselines */
  filteredData: DataRow[];
  /** Current process statistics */
  currentStats: { mean: number; stdDev: number; cpk?: number };
  /** Specification limits */
  specs?: { usl?: number; lsl?: number; target?: number };
  /** Color scheme */
  colorScheme?: WhatIfSimulatorColorScheme;
  /** Cpk target for color thresholds (default 1.33) */
  cpkTarget?: number;
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

function ModelDrivenSimulator({
  model,
  filteredData,
  currentStats,
  specs,
  colorScheme = whatIfSimulatorDefaultColorScheme,
  cpkTarget = 1.33,
}: ModelDrivenSimulatorProps) {
  const c = colorScheme;
  const { getTerm } = useGlossary();

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

  const getCpkColor = useCallback(
    (cpk: number): string => {
      if (cpk >= cpkTarget) return c.cpkGood;
      if (cpk >= cpkTarget * 0.75) return c.cpkOk;
      return c.cpkBad;
    },
    [c.cpkGood, c.cpkOk, c.cpkBad, cpkTarget]
  );

  // Compute factor baselines from data + model
  const baselines = useMemo(() => getFactorBaselines(filteredData, model), [filteredData, model]);

  // Track proposed values per factor (key: factor name)
  const [proposedValues, setProposedValues] = useState<Record<string, string | number>>({});

  const setProposed = useCallback((factor: string, value: string | number) => {
    setProposedValues(prev => ({ ...prev, [factor]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setProposedValues({});
  }, []);

  // Build adjustments from proposed values
  const adjustments = useMemo<FactorAdjustment[]>(() => {
    const result: FactorAdjustment[] = [];
    for (const b of baselines) {
      const proposed = proposedValues[b.factor];
      if (proposed !== undefined && proposed !== b.currentValue) {
        result.push({
          factor: b.factor,
          currentValue: b.currentValue,
          proposedValue: proposed,
        });
      }
    }
    return result;
  }, [baselines, proposedValues]);

  // Simulate the model
  const simulation = useMemo(() => simulateFromModel(model, adjustments), [model, adjustments]);

  // Project through the direct adjustment engine for Cpk/yield
  const projection = useMemo(
    () =>
      simulateDirectAdjustment(
        currentStats,
        { meanShift: simulation.meanShift, variationReduction: 0 },
        specs
      ),
    [currentStats, simulation.meanShift, specs]
  );

  // Current yield for comparison
  const currentYield = useMemo(() => {
    const baseline = simulateDirectAdjustment(
      currentStats,
      { meanShift: 0, variationReduction: 0 },
      specs
    );
    return baseline.projectedYield;
  }, [currentStats, specs]);

  const hasAdjustment = adjustments.length > 0;

  // Max absolute contribution for bar scaling
  const maxContrib = useMemo(() => {
    if (simulation.contributions.length === 0) return 1;
    return Math.max(...simulation.contributions.map(c => Math.abs(c.delta)), 0.001);
  }, [simulation.contributions]);

  // Helper to get coefficient delta label for categorical levels
  const getCoefficientDelta = useCallback(
    (baseline: FactorBaseline, level: string): number | undefined => {
      if (baseline.type !== 'categorical') return undefined;
      // Simulate switching from current to this level
      const sim = simulateFromModel(model, [
        { factor: baseline.factor, currentValue: baseline.currentValue, proposedValue: level },
      ]);
      return sim.meanShift;
    },
    [model]
  );

  return (
    <div className={`rounded-lg border ${c.containerBorder} ${c.containerBg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
        <GitBranch size={14} className="text-amber-400" />
        <span className={`text-sm font-medium ${c.contentText}`}>Model-Driven Simulator</span>
        <span className={`text-[10px] ${c.mutedText} flex items-center gap-1`}>
          Adj. R² = {formatNumber(model.adjustedRSquared, 3)}
          <HelpTooltip term={getTerm('adjustedRSquared')} iconSize={10} />
        </span>
        {model.adjustedRSquared < 0.5 && (
          <span className="text-[10px] text-amber-400">
            Low model fit — projections are approximate
          </span>
        )}
      </div>

      {/* Factor controls */}
      <div className="px-3 pb-3 space-y-3">
        {baselines.length === 0 && (
          <p className={`text-xs ${c.mutedText}`}>No adjustable factors in model.</p>
        )}

        {baselines.map(b => {
          const current = proposedValues[b.factor] ?? b.currentValue;

          if (b.type === 'categorical' && b.levels) {
            return (
              <div key={b.factor}>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs ${c.secondaryText}`}>{b.factor}</label>
                  <span className={`text-[10px] font-mono ${c.mutedText}`}>
                    current: {String(b.currentValue)}
                  </span>
                </div>
                <select
                  value={String(current)}
                  onChange={e => setProposed(b.factor, e.target.value)}
                  className={`w-full text-xs px-2 py-1.5 rounded border ${c.containerBorder} ${c.containerBg} ${c.contentText} focus:outline-none focus:ring-1 focus:ring-blue-500/50`}
                >
                  {b.levels.map(level => {
                    const delta = getCoefficientDelta(b, level);
                    const deltaStr =
                      delta !== undefined && Math.abs(delta) > 0.001
                        ? ` (${delta >= 0 ? '+' : ''}${formatNumber(delta, 1)})`
                        : '';
                    return (
                      <option key={level} value={level}>
                        {level}
                        {deltaStr}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          }

          if (b.type === 'continuous' && b.mean !== undefined && b.stdDev !== undefined) {
            const range = b.stdDev * 2 || 1;
            const step = range / 20;
            const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(step, 0.001))));
            const roundedStep = Math.max(magnitude * Math.round(step / magnitude), 0.01);

            return (
              <Slider
                key={b.factor}
                label={b.factor}
                value={typeof current === 'number' ? current : b.mean}
                onChange={v => setProposed(b.factor, v)}
                min={b.mean - range}
                max={b.mean + range}
                step={roundedStep}
                formatValue={v => formatNumber(v, 1)}
                colorScheme={sliderColorScheme}
              />
            );
          }

          return null;
        })}

        {/* Per-factor contribution bars */}
        {hasAdjustment && simulation.contributions.length > 0 && (
          <div className="space-y-1.5">
            <span className={`text-[10px] font-medium ${c.secondaryText}`}>
              Per-factor contribution to mean shift
            </span>
            {simulation.contributions.map(contrib => {
              const pct = (contrib.delta / maxContrib) * 100;
              const isPositive = contrib.delta >= 0;
              return (
                <div key={contrib.factor} className="flex items-center gap-2">
                  <span className={`text-[10px] w-20 truncate ${c.mutedText}`}>
                    {contrib.factor}
                  </span>
                  <div className="flex-1 h-3 relative">
                    <div className="absolute inset-0 flex items-center">
                      {/* Center line */}
                      <div className="w-full h-px bg-slate-600/50" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`h-2.5 rounded-sm ${isPositive ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                        style={{
                          width: `${Math.abs(pct) / 2}%`,
                          marginLeft: isPositive ? '50%' : undefined,
                          marginRight: !isPositive ? '50%' : undefined,
                          [isPositive ? 'marginLeft' : 'marginRight']: '50%',
                          position: 'absolute',
                          [isPositive ? 'left' : 'right']: '50%',
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono w-12 text-right ${isPositive ? c.improvementPositive : c.improvementNegative}`}
                  >
                    {isPositive ? '+' : ''}
                    {formatNumber(contrib.delta, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Projection results panel */}
        <div className={`p-3 rounded-lg ${c.projectionBg} border ${c.projectionBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${c.secondaryText}`}>
              Current &rarr; Projected
            </span>
            <div className="flex items-center gap-2">
              {hasAdjustment && (
                <span className="text-[10px] font-mono text-blue-400">
                  &Delta;mean: {simulation.meanShift >= 0 ? '+' : ''}
                  {formatNumber(simulation.meanShift, 2)}
                </span>
              )}
              {hasAdjustment && (
                <button
                  onClick={handleReset}
                  className={`flex items-center gap-1 text-[10px] ${c.mutedText} ${c.resetHoverText} transition-colors`}
                  title="Reset all factors"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Mean */}
            <div className="flex items-center justify-between">
              <span className={c.secondaryText}>Mean:</span>
              <div className="flex items-center gap-2">
                <span className={c.mutedText}>{formatNumber(currentStats.mean, 1)}</span>
                <span className={c.mutedText}>&rarr;</span>
                <span className={hasAdjustment ? c.contentText : c.mutedText}>
                  {formatNumber(projection.projectedMean, 1)}
                </span>
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

        {/* Helper text */}
        <p className={`text-[10px] ${c.mutedText} leading-relaxed`}>
          Adjust factor levels to see model-predicted process changes. Projections based on the
          regression equation (Adj. R² = {formatNumber(model.adjustedRSquared, 3)}).
        </p>
      </div>
    </div>
  );
}

export default ModelDrivenSimulator;
