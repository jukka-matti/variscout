/**
 * InteractionPlot — Factor Intelligence Layer 3 visualization.
 *
 * Multi-line chart showing outcome means for each combination of two factors.
 * Non-parallel lines = interaction (one factor's effect depends on the other).
 * Includes ΔR² badge showing additional variance explained by the interaction.
 */
import React from 'react';
import type { InteractionResult } from '@variscout/core/stats';

export interface InteractionPlotProps {
  /** Interaction results (typically only the top 1-2 significant ones) */
  interactions: InteractionResult[];
}

/** Color palette for interaction lines. */
const LINE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/** Single interaction panel for one factor pair. */
const InteractionPanel: React.FC<{ interaction: InteractionResult }> = ({ interaction }) => {
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
      style={{
        background: 'var(--color-surface-secondary, #1e1e2e)',
        borderRadius: 8,
        padding: '12px 16px',
        border: `1px solid ${isSignificant ? 'rgba(245, 158, 11, 0.3)' : 'var(--color-edge, #2a2a3e)'}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-content, #e0e0e0)' }}>
          {factorA} × {factorB}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: isSignificant ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
              color: isSignificant ? '#f59e0b' : '#6b7280',
            }}
          >
            ΔR²={deltaRSquared.toFixed(3)}
          </span>
          {isSignificant && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
              }}
            >
              p={'<'}
              {pValue < 0.001 ? '0.001' : pValue.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        height={chartH + 24}
        viewBox={`0 0 ${chartW} ${chartH + 24}`}
        style={{ overflow: 'visible' }}
      >
        {/* Y-axis labels */}
        <text
          x={marginLeft - 4}
          y={8}
          fill="var(--color-content-tertiary, #666)"
          fontSize={9}
          textAnchor="end"
        >
          {yMax.toFixed(0)}
        </text>
        <text
          x={marginLeft - 4}
          y={chartH}
          fill="var(--color-content-tertiary, #666)"
          fontSize={9}
          textAnchor="end"
        >
          {yMin.toFixed(0)}
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
            fill="var(--color-content, #e0e0e0)"
            fontSize={10}
            textAnchor="middle"
          >
            {level}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        {levelsB.map((level, i) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 12,
                height: 3,
                borderRadius: 1,
                background: LINE_COLORS[i % LINE_COLORS.length],
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-content-secondary, #999)' }}>
              {level}
            </span>
          </div>
        ))}
      </div>

      {/* Interaction interpretation */}
      <div style={{ fontSize: 11, color: 'var(--color-content-secondary, #999)', marginTop: 6 }}>
        {isSignificant
          ? `Interaction detected: ${factorA}'s effect depends on ${factorB} level.`
          : 'No significant interaction — effects are approximately additive.'}
      </div>
    </div>
  );
};

const InteractionPlot: React.FC<InteractionPlotProps> = ({ interactions }) => {
  if (!interactions || interactions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-content-secondary, #aaa)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Layer 3 · Factor Interactions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
