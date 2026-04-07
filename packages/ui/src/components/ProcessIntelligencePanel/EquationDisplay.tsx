import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { BestSubsetResult } from '@variscout/core/stats';
import type { PredictorInfo } from '@variscout/core/types';

export interface EquationDisplayProps {
  bestSubset: BestSubsetResult;
  grandMean: number;
  outcome: string;
  interactionDetected?: boolean;
  /** Quality characteristic type — determines worst/best interpretation */
  characteristicType?: 'nominal' | 'smaller' | 'larger';
  className?: string;

  // === NEW: continuous / mixed model props ===

  /** Factor types for mixed equation display */
  factorTypes?: Map<string, 'continuous' | 'categorical'>;
  /** Predictors for continuous factors (from BestSubsetResult.predictors) */
  predictors?: PredictorInfo[];
  /** Intercept value (for expanded equation) */
  intercept?: number;
  /** RMSE */
  rmse?: number;
  /** Number of observations */
  n?: number;
  /** F-statistic */
  fStatistic?: number;
  /** Whether quadratic terms are present */
  hasQuadraticTerms?: boolean;
  /** Model warnings */
  warnings?: string[];
  /** Callback when a factor chip is clicked */
  onFactorClick?: (factor: string) => void;
}

// ============================================================================
// Utilities
// ============================================================================

/** Format a number to reasonable precision (1-2 decimals based on magnitude). */
function fmt(value: number): string {
  if (!Number.isFinite(value)) return '—';
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

// ============================================================================
// Trust badge
// ============================================================================

interface TrustBadgeProps {
  r2Adj: number;
  isSignificant: boolean;
}

function TrustBadge({ r2Adj, isSignificant }: TrustBadgeProps): React.ReactElement {
  let label: string;
  let colorClass: string;

  if (!isSignificant || r2Adj < 0.3) {
    label = 'Weak model';
    colorClass = 'text-red-400';
  } else if (r2Adj >= 0.6) {
    label = 'Strong model';
    colorClass = 'text-green-400';
  } else {
    label = 'Moderate model';
    colorClass = 'text-amber-400';
  }

  return (
    <span
      className={`text-[0.5625rem] font-medium flex items-center gap-0.5 ${colorClass}`}
      data-testid="trust-badge"
    >
      <span aria-hidden="true">&#9679;</span>
      {label}
    </span>
  );
}

// ============================================================================
// Factor chip builders
// ============================================================================

interface FactorChipSummary {
  factorName: string;
  label: string;
  /** Absolute effect magnitude for ranking */
  magnitude: number;
  isQuadratic: boolean;
  isInteraction: boolean;
}

/**
 * Compute the dominant direction/label for a continuous factor given its linear
 * predictor (and optional quadratic predictor).
 */
function buildContinuousChipLabel(
  factorName: string,
  linearPredictor: PredictorInfo,
  quadraticPredictor: PredictorInfo | undefined
): { label: string; magnitude: number; isQuadratic: boolean } {
  if (quadraticPredictor) {
    // Quadratic: vertex = -b / (2c). c < 0 → peak, c > 0 → valley.
    const b = linearPredictor.coefficient;
    const c = quadraticPredictor.coefficient;
    const vertex = -b / (2 * c);
    const effectAtVertex = Math.abs(b * vertex + c * vertex * vertex);

    if (c < 0) {
      return {
        label: `${factorName} peak ${fmt(vertex)} \u2191${fmt(effectAtVertex)}`,
        magnitude: effectAtVertex,
        isQuadratic: true,
      };
    } else {
      return {
        label: `${factorName} valley ${fmt(vertex)} \u2193${fmt(effectAtVertex)}`,
        magnitude: effectAtVertex,
        isQuadratic: true,
      };
    }
  }

  // Linear only
  const coeff = linearPredictor.coefficient;
  const arrow = coeff >= 0 ? '\u2191' : '\u2193';
  return {
    label: `${factorName} ${coeff >= 0 ? '+' : ''}${fmt(coeff)}/unit ${arrow}`,
    magnitude: Math.abs(coeff),
    isQuadratic: false,
  };
}

/**
 * Compute the chip label for an interaction term.
 * Groups multiple PredictorInfo entries for the same factor pair (e.g. cont×cat
 * produces m-1 dummies) and shows the most significant coefficient.
 */
function buildInteractionChipLabel(interactionPredictors: PredictorInfo[]): {
  label: string;
  magnitude: number;
} {
  if (interactionPredictors.length === 0) {
    return { label: '?', magnitude: 0 };
  }

  // Pick the entry with the largest absolute coefficient as representative
  const top = interactionPredictors.reduce((best, cur) =>
    Math.abs(cur.coefficient) > Math.abs(best.coefficient) ? cur : best
  );

  const [factorA, factorB] = top.sourceFactors ?? [top.factorName, '?'];
  const label = `${factorA} \u00D7 ${factorB}`;

  return { label, magnitude: Math.abs(top.coefficient) };
}

/**
 * Compute the dominant level label for a categorical factor.
 */
function buildCategoricalChipLabel(
  factorName: string,
  levelEffects: Map<string, number> | undefined
): { label: string; magnitude: number } {
  if (!levelEffects || levelEffects.size === 0) {
    return { label: factorName, magnitude: 0 };
  }

  // Find the level with the largest absolute effect
  let dominantLevel = '';
  let dominantEffect = 0;

  for (const [level, effect] of levelEffects) {
    if (Math.abs(effect) > Math.abs(dominantEffect)) {
      dominantEffect = effect;
      dominantLevel = level;
    }
  }

  const arrow = dominantEffect >= 0 ? '\u2191' : '\u2193';
  return {
    label: `${factorName}: ${dominantLevel} ${arrow}${fmt(Math.abs(dominantEffect))}`,
    magnitude: Math.abs(dominantEffect),
  };
}

/**
 * Build chip summaries ranked by absolute effect magnitude.
 */
function buildFactorChips(
  factors: string[],
  predictors: PredictorInfo[],
  factorTypes: Map<string, 'continuous' | 'categorical'> | undefined,
  levelEffects: Map<string, Map<string, number>>
): FactorChipSummary[] {
  const chips: FactorChipSummary[] = [];
  const processedFactors = new Set<string>();

  for (const factorName of factors) {
    if (processedFactors.has(factorName)) continue;
    processedFactors.add(factorName);

    const fType = factorTypes?.get(factorName);

    if (
      fType === 'continuous' ||
      (!fType && predictors.some(p => p.factorName === factorName && p.type === 'continuous'))
    ) {
      const linear = predictors.find(p => p.factorName === factorName && p.type === 'continuous');
      const quadratic = predictors.find(p => p.factorName === factorName && p.type === 'quadratic');

      if (linear) {
        const { label, magnitude, isQuadratic } = buildContinuousChipLabel(
          factorName,
          linear,
          quadratic
        );
        chips.push({ factorName, label, magnitude, isQuadratic, isInteraction: false });
      }
    } else {
      const effects = levelEffects.get(factorName);
      const { label, magnitude } = buildCategoricalChipLabel(factorName, effects);
      chips.push({ factorName, label, magnitude, isQuadratic: false, isInteraction: false });
    }
  }

  // Interaction terms: group by sourceFactors pair key and add one chip per pair
  const interactionPredictors = predictors.filter(p => p.type === 'interaction');
  const interactionGroups = new Map<string, PredictorInfo[]>();

  for (const p of interactionPredictors) {
    const [a, b] = p.sourceFactors ?? [p.factorName, ''];
    const key = [a, b].sort().join('\x00');
    if (!interactionGroups.has(key)) interactionGroups.set(key, []);
    interactionGroups.get(key)!.push(p);
  }

  for (const [key, group] of interactionGroups) {
    const { label, magnitude } = buildInteractionChipLabel(group);
    chips.push({ factorName: key, label, magnitude, isQuadratic: false, isInteraction: true });
  }

  // Rank by absolute magnitude descending
  return chips.sort((a, b) => b.magnitude - a.magnitude);
}

// ============================================================================
// Math equation builder
// ============================================================================

/**
 * Build the full math equation string from predictors + intercept.
 * e.g. "ŷ = 60.1 + 0.40×Temp − 0.002×Temp² + 12.3(Supplier A)"
 */
function buildMathEquation(predictors: PredictorInfo[], intercept: number): string {
  const parts: string[] = [`\u0177 = ${fmt(intercept)}`];

  // Group by factor name to order: continuous before quadratic, then categorical
  const seen = new Set<string>();

  // First pass: continuous + quadratic
  for (const p of predictors) {
    if (p.type === 'continuous' || p.type === 'quadratic') {
      const sign = p.coefficient >= 0 ? '+' : '\u2212';
      const absCoeff = fmt(Math.abs(p.coefficient));
      const termName = p.type === 'quadratic' ? `${p.factorName}\u00B2` : p.factorName;
      parts.push(`${sign} ${absCoeff}\u00D7${termName}`);
    }
  }

  // Second pass: categorical (one entry per factor, show strongest level)
  for (const p of predictors) {
    if (p.type === 'categorical' && p.level && !seen.has(p.factorName)) {
      seen.add(p.factorName);
      // Find all levels for this factor and show top contributor
      const factorPredictors = predictors.filter(
        fp => fp.type === 'categorical' && fp.factorName === p.factorName
      );
      const top = factorPredictors.reduce((best, cur) =>
        Math.abs(cur.coefficient) > Math.abs(best.coefficient) ? cur : best
      );
      const sign = top.coefficient >= 0 ? '+' : '\u2212';
      parts.push(`${sign} ${fmt(Math.abs(top.coefficient))}(${top.factorName}: ${top.level})`);
    }
  }

  // Third pass: interaction terms (one entry per source-factor pair, show strongest)
  const interactionSeen = new Set<string>();
  for (const p of predictors) {
    if (p.type === 'interaction' && p.sourceFactors) {
      const [a, b] = p.sourceFactors;
      const key = [a, b].sort().join('\x00');
      if (interactionSeen.has(key)) continue;
      interactionSeen.add(key);

      const pairPredictors = predictors.filter(
        fp =>
          fp.type === 'interaction' &&
          fp.sourceFactors != null &&
          [fp.sourceFactors[0], fp.sourceFactors[1]].sort().join('\x00') === key
      );
      const top = pairPredictors.reduce((best, cur) =>
        Math.abs(cur.coefficient) > Math.abs(best.coefficient) ? cur : best
      );
      const sign = top.coefficient >= 0 ? '+' : '\u2212';
      parts.push(`${sign} ${fmt(Math.abs(top.coefficient))}\u00D7(${a}\u00D7${b})`);
    }
  }

  return parts.join(' ');
}

// ============================================================================
// Main component
// ============================================================================

/**
 * EquationDisplay — compact regression equation card for the PI panel.
 *
 * Two modes:
 * 1. **Natural language mode** (when `predictors` provided): shows predicted
 *    value, trust badge, and tappable factor chips. Expandable to full math
 *    equation with model statistics.
 * 2. **Legacy categorical mode** (when `predictors` absent): shows the original
 *    formatEquation output, R²adj badge, worst/best predictions, and cell counts.
 */
const EquationDisplay: React.FC<EquationDisplayProps> = ({
  bestSubset,
  grandMean,
  outcome,
  interactionDetected,
  characteristicType,
  className,
  factorTypes,
  predictors,
  intercept,
  rmse,
  n,
  fStatistic,
  hasQuadraticTerms,
  warnings,
  onFactorClick,
}) => {
  // Both state vars hoisted unconditionally (Rules of Hooks)
  const [expanded, setExpanded] = useState(false);
  const [cellsExpanded, setCellsExpanded] = useState(false);

  const r2Pct = Number.isFinite(bestSubset.rSquaredAdj)
    ? (bestSubset.rSquaredAdj * 100).toFixed(0)
    : '—';
  const pLabel = !Number.isFinite(bestSubset.pValue)
    ? 'p = —'
    : bestSubset.pValue < 0.001
      ? 'p < 0.001'
      : `p = ${bestSubset.pValue.toFixed(3)}`;

  // ── Natural language mode (predictors provided) ──────────────────────────
  if (predictors && predictors.length > 0) {
    const interceptValue = intercept ?? bestSubset.intercept ?? grandMean;
    const chips = buildFactorChips(
      bestSubset.factors,
      predictors,
      factorTypes ?? bestSubset.factorTypes,
      bestSubset.levelEffects
    );

    const visibleChips = chips.slice(0, 3);
    const hiddenCount = chips.length - visibleChips.length;

    const mathEquation = buildMathEquation(predictors, interceptValue);

    // Model stats line
    const nVal =
      n ??
      (bestSubset.cellMeans.size > 0
        ? [...bestSubset.cellMeans.values()].reduce((s, c) => s + c.n, 0)
        : undefined);
    const dfModel = bestSubset.dfModel;
    const dfError = nVal != null ? nVal - dfModel - 1 : undefined;
    const fVal = fStatistic ?? bestSubset.fStatistic;
    const rmseVal = rmse ?? bestSubset.rmse;

    const modelStatsLine = [
      `R\u00B2adj\u00A0=\u00A0${r2Pct}%`,
      rmseVal != null ? `\u03C3\u0302\u00A0=\u00A0${fmt(rmseVal)}` : null,
      nVal != null ? `n\u00A0=\u00A0${nVal}` : null,
      fVal != null && dfError != null
        ? `F(${dfModel},${dfError})\u00A0=\u00A0${fmt(fVal)},\u00A0${pLabel}`
        : pLabel,
    ]
      .filter(Boolean)
      .join(' \u00B7 ');

    const hasInteractionTerms = predictors.some(p => p.type === 'interaction');

    const allWarnings = [
      ...(warnings ?? bestSubset.warnings ?? []),
      ...(interactionDetected
        ? ['Interaction detected \u2014 model assumes additive effects']
        : []),
      ...((hasQuadraticTerms ?? bestSubset.hasQuadraticTerms)
        ? ['Quadratic terms included \u2014 curved relationship']
        : []),
    ];

    return (
      <div
        className={`bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/15 rounded-lg p-3 ${className ?? ''}`}
        data-testid="equation-display"
      >
        {/* Header row: label + trust badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[0.625rem] uppercase tracking-wider text-blue-400 font-medium">
            Best model
          </span>
          <TrustBadge r2Adj={bestSubset.rSquaredAdj} isSignificant={bestSubset.isSignificant} />
        </div>

        {/* Predicted value */}
        <div className="text-xs text-content-secondary mb-1.5" data-testid="equation-predicted">
          Predicted <span className="text-content font-medium">{outcome}</span> ={' '}
          <span className="font-mono font-semibold text-blue-300">{fmt(interceptValue)}</span>
        </div>

        {/* Factor chips */}
        <div className="flex flex-wrap gap-1.5 mb-2" data-testid="equation-factor-chips">
          {visibleChips.map(chip => (
            <button
              key={chip.factorName}
              type="button"
              onClick={() => onFactorClick?.(chip.factorName)}
              className={`
                text-[0.6rem] leading-tight px-2 py-0.5 rounded-full
                transition-colors
                ${
                  chip.isInteraction
                    ? 'border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:text-purple-200 hover:border-purple-500/50'
                    : chip.isQuadratic
                      ? 'bg-slate-800 border border-slate-700 text-purple-300 hover:text-purple-200 hover:border-slate-500'
                      : 'bg-slate-800 border border-slate-700 text-content-secondary hover:text-content hover:border-slate-500'
                }
              `}
              data-testid={`equation-chip-${chip.factorName}`}
            >
              {chip.label}
            </button>
          ))}
          {hiddenCount > 0 && (
            <span
              className="text-[0.6rem] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-content-muted"
              data-testid="equation-chips-overflow"
            >
              +{hiddenCount} more
            </span>
          )}
        </div>

        {/* Expandable math equation */}
        <div className="border-t border-edge/40 pt-1.5">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[0.5625rem] text-content-muted hover:text-content transition-colors"
            data-testid="equation-expand-toggle"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Show equation</span>
          </button>

          {expanded && (
            <div className="mt-1.5" data-testid="equation-math-expanded">
              <div
                className="text-[0.6rem] font-mono text-content leading-relaxed break-words"
                data-testid="equation-math-text"
              >
                {mathEquation}
              </div>
              <div
                className="mt-0.5 text-[0.5625rem] font-mono text-content-muted"
                data-testid="equation-model-stats"
              >
                {modelStatsLine}
              </div>
            </div>
          )}
        </div>

        {/* Warnings */}
        {allWarnings.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {allWarnings.map((w, i) => (
              <div
                key={i}
                className="text-[0.625rem] text-amber-500"
                data-testid={`equation-warning-${i}`}
              >
                &#9888; {w}
              </div>
            ))}
          </div>
        )}

        {/* Interaction qualification note */}
        {hasInteractionTerms && (
          <div
            className="text-xs text-content-secondary mt-1 px-2"
            data-testid="equation-interaction-note"
          >
            Model includes factor interactions — predictions account for combined effects.
          </div>
        )}
      </div>
    );
  }

  // ── Legacy categorical mode ───────────────────────────────────────────────
  const extremes = getExtremes(bestSubset, characteristicType ?? 'nominal', grandMean);
  const equation = formatEquation(bestSubset, grandMean, outcome);

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
          R&#178;adj {r2Pct}%
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
            onClick={() => setCellsExpanded(v => !v)}
            className="flex items-center gap-1 text-[0.5625rem] text-content-muted hover:text-content transition-colors"
            data-testid="equation-cell-toggle"
          >
            {cellsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Cell counts ({bestSubset.cellMeans.size} cells)</span>
          </button>
          {cellsExpanded && (
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
