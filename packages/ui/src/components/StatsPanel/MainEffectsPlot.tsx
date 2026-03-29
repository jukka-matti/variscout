/**
 * MainEffectsPlot — Factor Intelligence Layer 2 visualization.
 *
 * Shows per-factor panels with level means as connected dots.
 * Steeper slope = bigger effect. Significant factors get a badge.
 */
import React from 'react';
import type { MainEffectsResult, FactorMainEffect } from '@variscout/core/stats';

export interface MainEffectsPlotProps {
  result: MainEffectsResult | null;
}

/** Single factor panel within the main effects plot. */
const FactorPanel: React.FC<{ effect: FactorMainEffect; grandMean: number }> = ({
  effect,
  grandMean,
}) => {
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
          className="fill-content-muted text-[9px]"
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
          const dotColor = isBest ? '#22c55e' : isWorst ? '#ef4444' : '#6366f1';
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
                className="fill-content-secondary text-[10px] font-mono"
                textAnchor="middle"
              >
                {l.mean.toFixed(1)}
              </text>
              {/* Level label */}
              <text x={x} y={chartH + 14} className="fill-content text-[10px]" textAnchor="middle">
                {l.level}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary text */}
      <div className="text-[0.6875rem] text-content-secondary mt-1">
        Best: <span className="text-green-500 font-semibold">{effect.bestLevel}</span>
        {' · '}
        Range: <span className="font-mono">{effect.effectRange.toFixed(1)}</span>
      </div>
    </div>
  );
};

const MainEffectsPlot: React.FC<MainEffectsPlotProps> = ({ result }) => {
  if (!result || result.factors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="main-effects-plot">
      <div className="text-[0.75rem] font-semibold text-content-secondary uppercase tracking-wider">
        Layer 2 · Main Effects
      </div>
      <div className="flex gap-2 flex-wrap">
        {result.factors.map(effect => (
          <FactorPanel key={effect.factor} effect={effect} grandMean={result.grandMean} />
        ))}
      </div>
    </div>
  );
};

export default MainEffectsPlot;
