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
    <div
      style={{
        flex: '1 1 160px',
        minWidth: 140,
        maxWidth: 280,
        background: 'var(--color-surface-secondary, #1e1e2e)',
        borderRadius: 8,
        padding: '12px 16px',
        border: '1px solid var(--color-edge, #2a2a3e)',
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
          {effect.factor}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {effect.isSignificant && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
              }}
            >
              p {'<'} 0.05
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-content-tertiary, #888)',
              fontFamily: 'monospace',
            }}
          >
            η²={effect.etaSquared.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        height={chartH + 24}
        viewBox={`0 0 ${chartW} ${chartH + 24}`}
        style={{ overflow: 'visible' }}
      >
        {/* Grand mean dashed line */}
        <line
          x1={0}
          y1={grandMeanY}
          x2={chartW}
          y2={grandMeanY}
          stroke="var(--color-content-tertiary, #555)"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <text
          x={chartW - 2}
          y={grandMeanY - 4}
          fill="var(--color-content-tertiary, #666)"
          fontSize={9}
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
            stroke="var(--color-accent, #6366f1)"
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
          return (
            <g key={l.level}>
              <circle
                cx={x}
                cy={y}
                r={isBest || isWorst ? 5 : 4}
                fill={isBest ? '#22c55e' : isWorst ? '#ef4444' : 'var(--color-accent, #6366f1)'}
                stroke={isBest ? '#22c55e' : isWorst ? '#ef4444' : 'var(--color-accent, #6366f1)'}
                strokeWidth={isBest || isWorst ? 2 : 1}
              />
              {/* Mean value label */}
              <text
                x={x}
                y={y - 8}
                fill="var(--color-content-secondary, #aaa)"
                fontSize={10}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {l.mean.toFixed(1)}
              </text>
              {/* Level label */}
              <text
                x={x}
                y={chartH + 14}
                fill="var(--color-content, #e0e0e0)"
                fontSize={10}
                textAnchor="middle"
              >
                {l.level}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary text */}
      <div style={{ fontSize: 11, color: 'var(--color-content-secondary, #999)', marginTop: 4 }}>
        Best: <span style={{ color: '#22c55e', fontWeight: 600 }}>{effect.bestLevel}</span>
        {' · '}
        Range: <span style={{ fontFamily: 'monospace' }}>{effect.effectRange.toFixed(1)}</span>
      </div>
    </div>
  );
};

const MainEffectsPlot: React.FC<MainEffectsPlotProps> = ({ result }) => {
  if (!result || result.factors.length === 0) return null;

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
        Layer 2 · Main Effects
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {result.factors.map(effect => (
          <FactorPanel key={effect.factor} effect={effect} grandMean={result.grandMean} />
        ))}
      </div>
    </div>
  );
};

export default MainEffectsPlot;
