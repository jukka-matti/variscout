import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { BestSubsetResult } from '@variscout/core/stats';

export interface EquationDisplayProps {
  bestSubset: BestSubsetResult;
  grandMean: number;
  outcome: string;
  interactionDetected?: boolean;
  /** Quality characteristic type — determines worst/best interpretation */
  characteristicType?: 'nominal' | 'smaller' | 'larger';
  className?: string;
}

/** Format a number to reasonable precision (1-2 decimals based on magnitude). */
function fmt(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

/**
 * Build a compact equation string from level effects.
 * e.g. "Fill Weight = 12.1 + Shift(Day -0.3, Night +0.8)"
 */
export function formatEquation(
  bestSubset: BestSubsetResult,
  grandMean: number,
  outcome: string
): string {
  const parts: string[] = [`${outcome} = ${fmt(grandMean)}`];

  for (const factor of bestSubset.factors) {
    const effects = bestSubset.levelEffects.get(factor);
    if (!effects || effects.size === 0) continue;

    const levelParts = [...effects.entries()]
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([level, effect]) => {
        const sign = effect >= 0 ? '+' : '\u2212';
        return `${level} ${sign}${fmt(Math.abs(effect))}`;
      });

    parts.push(`${factor}(${levelParts.join(', ')})`);
  }

  return parts.join(' + ');
}

/**
 * Compute worst and best predicted cases from cell means.
 *
 * Interpretation depends on characteristic type:
 * - nominal: worst = farthest from grand mean, best = closest to grand mean
 * - smaller: worst = highest predicted, best = lowest predicted
 * - larger: worst = lowest predicted, best = highest predicted
 */
function getExtremes(
  bestSubset: BestSubsetResult,
  characteristicType: 'nominal' | 'smaller' | 'larger' = 'nominal',
  grandMean?: number
): {
  worst: { predicted: number; levels: string[] };
  best: { predicted: number; levels: string[] };
  range: number;
} | null {
  if (bestSubset.cellMeans.size === 0) return null;

  const entries = [...bestSubset.cellMeans.entries()];

  let worstKey = '';
  let bestKey = '';
  let worstMean = 0;
  let bestMean = 0;

  if (characteristicType === 'nominal') {
    // Nominal: worst = farthest from grand mean, best = closest to grand mean
    const ref = grandMean ?? 0;
    let worstDist = -Infinity;
    let bestDist = Infinity;

    for (const [key, { mean }] of entries) {
      const dist = Math.abs(mean - ref);
      if (dist > worstDist) {
        worstDist = dist;
        worstMean = mean;
        worstKey = key;
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestMean = mean;
        bestKey = key;
      }
    }
  } else if (characteristicType === 'larger') {
    // Larger-is-better: worst = lowest, best = highest
    worstMean = Infinity;
    bestMean = -Infinity;

    for (const [key, { mean }] of entries) {
      if (mean < worstMean) {
        worstMean = mean;
        worstKey = key;
      }
      if (mean > bestMean) {
        bestMean = mean;
        bestKey = key;
      }
    }
  } else {
    // Smaller-is-better (default for 'smaller'): worst = highest, best = lowest
    worstMean = -Infinity;
    bestMean = Infinity;

    for (const [key, { mean }] of entries) {
      if (mean > worstMean) {
        worstMean = mean;
        worstKey = key;
      }
      if (mean < bestMean) {
        bestMean = mean;
        bestKey = key;
      }
    }
  }

  return {
    worst: { predicted: worstMean, levels: worstKey.split('\x00') },
    best: { predicted: bestMean, levels: bestKey.split('\x00') },
    range: Math.abs(worstMean - bestMean),
  };
}

/**
 * EquationDisplay — compact regression equation card for the PI panel.
 *
 * Shows the best additive model equation, R²adj badge, worst/best predictions,
 * and an expandable cell-count section.
 */
const EquationDisplay: React.FC<EquationDisplayProps> = ({
  bestSubset,
  grandMean,
  outcome,
  interactionDetected,
  characteristicType,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const extremes = getExtremes(bestSubset, characteristicType ?? 'nominal', grandMean);

  const equation = formatEquation(bestSubset, grandMean, outcome);
  const r2Pct = (bestSubset.rSquaredAdj * 100).toFixed(0);
  const pLabel = bestSubset.pValue < 0.001 ? 'p < 0.001' : `p = ${bestSubset.pValue.toFixed(3)}`;

  return (
    <div
      className={`bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/15 rounded-lg p-3 ${className ?? ''}`}
      data-testid="equation-display"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[0.625rem] uppercase tracking-wider text-blue-400 font-medium">
          Best model
        </span>
        <span className="text-[0.5625rem] font-mono bg-blue-500/15 text-blue-300 rounded px-1 py-0.5">
          R²adj {r2Pct}%
        </span>
        <span className="text-[0.5625rem] text-content-muted">{pLabel}</span>
      </div>

      {/* Equation */}
      <div
        className="text-xs font-mono text-content leading-relaxed break-words"
        data-testid="equation-text"
      >
        {equation}
      </div>

      {/* Worst / Best row */}
      {extremes && (
        <div
          className="mt-1.5 text-[0.6875rem] text-content-secondary flex flex-wrap gap-x-3 gap-y-0.5"
          data-testid="equation-extremes"
        >
          <span>
            Worst: {extremes.worst.levels.join(' + ')} = {fmt(extremes.worst.predicted)}
          </span>
          <span>
            Best: {extremes.best.levels.join(' + ')} = {fmt(extremes.best.predicted)}
          </span>
          <span>Range: {fmt(extremes.range)}</span>
        </div>
      )}

      {/* Interaction warning */}
      {interactionDetected && (
        <div
          className="mt-1.5 text-[0.625rem] text-amber-500"
          data-testid="equation-interaction-warning"
        >
          &#9888; Interaction detected — model assumes additive effects
        </div>
      )}

      {/* Expandable cell counts */}
      {bestSubset.cellMeans.size > 0 && (
        <div className="mt-2 border-t border-edge/40 pt-1.5">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[0.5625rem] text-content-muted hover:text-content transition-colors"
            data-testid="equation-cell-toggle"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Cell counts ({bestSubset.cellMeans.size} cells)</span>
          </button>
          {expanded && (
            <div className="mt-1 flex flex-wrap gap-1" data-testid="equation-cell-counts">
              {[...bestSubset.cellMeans.entries()].map(([key, { n }]) => (
                <span
                  key={key}
                  className={`text-[0.5625rem] font-mono rounded px-1 py-0.5 ${
                    n < 5
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-surface-secondary text-content-muted'
                  }`}
                >
                  {/* eslint-disable-next-line no-control-regex */}
                  {key.replace(/\x00/g, '+')}={n}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquationDisplay;
