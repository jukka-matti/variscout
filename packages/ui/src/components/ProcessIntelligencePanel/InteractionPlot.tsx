/**
 * InteractionPlot — Factor Intelligence Layer 3 visualization.
 *
 * Multi-line chart showing outcome means for each combination of two factors.
 * Non-parallel lines = interaction (one factor's effect depends on the other).
 * Includes ΔR² badge showing additional variance explained by the interaction.
 */
import React from 'react';
import type { InteractionResult } from '@variscout/core/stats';
import { operatorColors } from '@variscout/charts';
import { useTranslation } from '@variscout/hooks';

export interface InteractionPlotProps {
  /** Interaction results (typically only the top 1-2 significant ones) */
  interactions: InteractionResult[];
}

/** Color palette for interaction lines — reuses the shared operator palette. */
const LINE_COLORS = operatorColors;

/** Single interaction panel for one factor pair. */
const InteractionPanel: React.FC<{ interaction: InteractionResult }> = ({ interaction }) => {
  const { t, tf } = useTranslation();
  const { factorA, factorB, levelsA, levelsB, cellMeans, deltaRSquared, isSignificant, pValue } =
    interaction;

  // Build lookup: levelB → array of { levelA, mean }
  const seriesMap = new Map<string, Array<{ levelA: string; mean: number }>>();
  for (const b of levelsB) {
    seriesMap.set(b, []);
  }
  for (const cell of cellMeans) {
    seriesMap.get(cell.levelB)?.push({ levelA: cell.levelA, mean: cell.mean });
  }
  // Sort each series by levelA order
  for (const series of seriesMap.values()) {
    series.sort((a, b) => levelsA.indexOf(a.levelA) - levelsA.indexOf(b.levelA));
  }

  // Compute y scale
  const allMeans = cellMeans.map(c => c.mean);
  const minMean = Math.min(...allMeans);
  const maxMean = Math.max(...allMeans);
  const range = maxMean - minMean || 1;
  const padding = range * 0.15;
  const yMin = minMean - padding;
  const yMax = maxMean + padding;
  const yRange = yMax - yMin;

  const chartH = 130;
  const chartW = Math.max(160, levelsA.length * 70);
  const marginLeft = 35;
  const plotW = chartW - marginLeft - 10;
  const toY = (val: number) => chartH - ((val - yMin) / yRange) * chartH;
  const toX = (i: number) =>
    marginLeft + (levelsA.length === 1 ? plotW / 2 : (i / (levelsA.length - 1)) * plotW);

  return (
    <div
      className={`bg-surface-secondary rounded-lg p-3 border ${
        isSignificant ? 'border-amber-500/30' : 'border-edge'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[0.8125rem] text-content">
          {factorA} × {factorB}
        </span>
        <div className="flex gap-1.5 items-center">
          <span
            className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${
              isSignificant
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-surface-tertiary text-content-muted'
            }`}
          >
            ΔR²={Number.isFinite(deltaRSquared) ? deltaRSquared.toFixed(3) : '—'}
          </span>
          {isSignificant && (
            <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">
              p{'<'}
              {!Number.isFinite(pValue) ? '—' : pValue < 0.001 ? '0.001' : pValue.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        height={chartH + 24}
        viewBox={`0 0 ${chartW} ${chartH + 24}`}
        className="overflow-visible"
      >
        {/* Y-axis labels */}
        <text
          x={marginLeft - 4}
          y={8}
          className="fill-content-muted text-[0.5625rem]"
          textAnchor="end"
        >
          {Number.isFinite(yMax) ? yMax.toFixed(0) : ''}
        </text>
        <text
          x={marginLeft - 4}
          y={chartH}
          className="fill-content-muted text-[0.5625rem]"
          textAnchor="end"
        >
          {Number.isFinite(yMin) ? yMin.toFixed(0) : ''}
        </text>

        {/* Series lines */}
        {[...seriesMap.entries()].map(([levelB, points], bi) => {
          const color = LINE_COLORS[bi % LINE_COLORS.length];
          if (points.length < 2) return null;
          return (
            <g key={levelB}>
              <polyline
                points={points
                  .map(p => `${toX(levelsA.indexOf(p.levelA))},${toY(p.mean)}`)
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {points.map(p => (
                <circle
                  key={p.levelA}
                  cx={toX(levelsA.indexOf(p.levelA))}
                  cy={toY(p.mean)}
                  r={3.5}
                  fill={color}
                />
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {levelsA.map((level, idx) => (
          <text
            key={level}
            x={toX(idx)}
            y={chartH + 14}
            className="fill-content text-[0.625rem]"
            textAnchor="middle"
          >
            {level}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mt-1">
        {levelsB.map((level, i) => (
          <div key={level} className="flex items-center gap-1">
            <div
              className="w-3 h-[3px] rounded-sm"
              style={{ background: LINE_COLORS[i % LINE_COLORS.length] }}
            />
            <span className="text-[0.6875rem] text-content-secondary">{level}</span>
          </div>
        ))}
      </div>

      {/* Interaction interpretation */}
      <div className="text-[0.6875rem] text-content-secondary mt-1.5">
        {isSignificant ? tf('fi.interactionDetected', { factorA, factorB }) : t('fi.noInteraction')}
      </div>
    </div>
  );
};

const InteractionPlot: React.FC<InteractionPlotProps> = ({ interactions }) => {
  const { t } = useTranslation();
  if (!interactions || interactions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="interaction-plot">
      <div className="text-[0.75rem] font-semibold text-content-secondary uppercase tracking-wider">
        {t('fi.layer3')}
      </div>
      <div className="flex flex-col gap-2">
        {interactions.map(interaction => (
          <InteractionPanel
            key={`${interaction.factorA}×${interaction.factorB}`}
            interaction={interaction}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractionPlot;
