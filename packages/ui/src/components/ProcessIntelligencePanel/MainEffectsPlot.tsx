/**
 * MainEffectsPlot — Factor Intelligence Layer 2 visualization.
 *
 * Shows per-factor panels with level means as connected dots.
 * Steeper slope = bigger effect. Significant factors get a badge.
 */
import React from 'react';
import type { MainEffectsResult, FactorMainEffect } from '@variscout/core/stats';
import { chartColors, operatorColors } from '@variscout/charts';
import { useTranslation } from '@variscout/hooks';

export interface MainEffectsPlotProps {
  result: MainEffectsResult | null;
  /** Called when user clicks "Investigate" on a significant factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
}

/** Single factor panel within the main effects plot. */
const FactorPanel: React.FC<{
  effect: FactorMainEffect;
  grandMean: number;
  onInvestigate?: (effect: FactorMainEffect) => void;
}> = ({ effect, grandMean, onInvestigate }) => {
  const { t } = useTranslation();
  const levels = effect.levels;
  if (levels.length === 0) return null;

  // Compute scale
  const allMeans = levels.map(l => l.mean);
  const minMean = Math.min(...allMeans, grandMean);
  const maxMean = Math.max(...allMeans, grandMean);
  const range = maxMean - minMean || 1;
  const padding = range * 0.15;
  const yMin = minMean - padding;
  const yMax = maxMean + padding;
  const yRange = yMax - yMin;

  const chartH = 120;
  const chartW = Math.max(120, levels.length * 60);
  const toY = (val: number) => chartH - ((val - yMin) / yRange) * chartH;

  // Grand mean line position
  const grandMeanY = toY(grandMean);

  return (
    <div className="flex-1 min-w-[140px] max-w-[280px] bg-surface-secondary rounded-lg p-3 border border-edge">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[0.8125rem] text-content">{effect.factor}</span>
        <div className="flex gap-1.5 items-center">
          {effect.isSignificant && (
            <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-500">
              p {'<'} 0.05
            </span>
          )}
          <span className="text-[0.6875rem] text-content-muted font-mono">
            η²={effect.etaSquared.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        height={chartH + 24}
        viewBox={`0 0 ${chartW} ${chartH + 24}`}
        className="overflow-visible"
      >
        {/* Grand mean dashed line */}
        <line
          x1={0}
          y1={grandMeanY}
          x2={chartW}
          y2={grandMeanY}
          className="stroke-content-muted"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <text
          x={chartW - 2}
          y={grandMeanY - 4}
          className="fill-content-muted text-[0.5625rem]"
          textAnchor="end"
        >
          x̄
        </text>

        {/* Connecting line */}
        {levels.length > 1 && (
          <polyline
            points={levels
              .map((l, i) => {
                const x = (i / (levels.length - 1)) * (chartW - 40) + 20;
                return `${x},${toY(l.mean)}`;
              })
              .join(' ')}
            fill="none"
            className="stroke-indigo-500"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Data points + labels */}
        {levels.map((l, i) => {
          const x =
            levels.length === 1 ? chartW / 2 : (i / (levels.length - 1)) * (chartW - 40) + 20;
          const y = toY(l.mean);
          const isBest = l.level === effect.bestLevel;
          const isWorst = l.level === effect.worstLevel;
          const dotColor = isBest
            ? chartColors.pass
            : isWorst
              ? chartColors.fail
              : operatorColors[0];
          return (
            <g key={l.level}>
              <circle
                cx={x}
                cy={y}
                r={isBest || isWorst ? 5 : 4}
                fill={dotColor}
                stroke={dotColor}
                strokeWidth={isBest || isWorst ? 2 : 1}
              />
              {/* Mean value label */}
              <text
                x={x}
                y={y - 8}
                className="fill-content-secondary text-[0.625rem] font-mono"
                textAnchor="middle"
              >
                {l.mean.toFixed(1)}
              </text>
              {/* Level label */}
              <text
                x={x}
                y={chartH + 14}
                className="fill-content text-[0.625rem]"
                textAnchor="middle"
              >
                {l.level}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary text + Investigate button */}
      <div className="flex items-center justify-between mt-1">
        <div className="text-[0.6875rem] text-content-secondary">
          {t('fi.best')}: <span className="text-green-500 font-semibold">{effect.bestLevel}</span>
          {' · '}
          {t('fi.range')}: <span className="font-mono">{effect.effectRange.toFixed(1)}</span>
        </div>
        {effect.isSignificant && onInvestigate && (
          <button
            onClick={() => onInvestigate(effect)}
            className="text-[0.625rem] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-500/10"
            title={`Investigate ${effect.factor}: create a finding with target "${effect.worstLevel}" → "${effect.bestLevel}"`}
          >
            {t('fi.investigate')}
          </button>
        )}
      </div>
    </div>
  );
};

const MainEffectsPlot: React.FC<MainEffectsPlotProps> = ({ result, onInvestigateFactor }) => {
  const { t } = useTranslation();
  if (!result || result.factors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="main-effects-plot">
      <div className="text-[0.75rem] font-semibold text-content-secondary uppercase tracking-wider">
        {t('fi.layer2')}
      </div>
      <div className="flex gap-2 flex-wrap">
        {result.factors.map(effect => (
          <FactorPanel
            key={effect.factor}
            effect={effect}
            grandMean={result.grandMean}
            onInvestigate={onInvestigateFactor}
          />
        ))}
      </div>
    </div>
  );
};

export default MainEffectsPlot;
