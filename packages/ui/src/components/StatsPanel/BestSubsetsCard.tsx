import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { BestSubsetsResult } from '@variscout/core/stats';

export interface BestSubsetsCardProps {
  /** Best subsets analysis result */
  result: BestSubsetsResult | null;
  /** Maximum number of subsets to show (default: 5) */
  maxRows?: number;
  /** Called when a factor subset is clicked for drill-down */
  onSubsetClick?: (factors: string[]) => void;
}

/**
 * BestSubsetsCard — compact card showing factor ranking by R² adjusted.
 *
 * Displays the top factor subsets that explain the most variation in the outcome.
 * Bar visualization shows relative R² adjusted for quick comparison.
 *
 * Appears in the Summary tab of the StatsPanel when multiple factors are available.
 */
const BestSubsetsCard: React.FC<BestSubsetsCardProps> = ({
  result,
  maxRows = 5,
  onSubsetClick,
}) => {
  const { formatStat } = useTranslation();

  if (!result || result.subsets.length === 0) return null;

  // Only show significant or top models
  const topSubsets = result.subsets.slice(0, maxRows);
  const bestRSquaredAdj = topSubsets[0]?.rSquaredAdj ?? 0;

  // Don't show if best model explains essentially nothing
  if (bestRSquaredAdj <= 0.01) return null;

  return (
    <div
      className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/15 rounded-lg p-3"
      data-testid="best-subsets-card"
    >
      <div className="text-[0.625rem] uppercase tracking-wider text-indigo-400 font-medium mb-2">
        Factor ranking (R² adjusted)
      </div>
      <div className="space-y-1.5">
        {topSubsets.map((subset, i) => {
          const barWidth =
            bestRSquaredAdj > 0 ? Math.max(4, (subset.rSquaredAdj / bestRSquaredAdj) * 100) : 0;
          const isTop = i === 0;

          return (
            <button
              key={subset.factors.join('+')}
              className={`w-full text-left group transition-colors rounded-md px-2 py-1 ${
                onSubsetClick ? 'hover:bg-indigo-500/10 cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => onSubsetClick?.(subset.factors)}
              data-testid={`subset-row-${i}`}
              type="button"
              disabled={!onSubsetClick}
            >
              {/* Factor names */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-xs font-medium truncate ${
                    isTop ? 'text-indigo-300' : 'text-content-secondary'
                  }`}
                >
                  {subset.factors.join(' + ')}
                </span>
                <span
                  className={`text-xs font-mono ml-2 shrink-0 ${
                    isTop ? 'text-indigo-400' : 'text-content-muted'
                  }`}
                >
                  {formatStat(subset.rSquaredAdj * 100, 1)}%
                </span>
              </div>
              {/* Bar */}
              <div className="h-1 bg-surface/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isTop
                      ? 'bg-indigo-500'
                      : subset.isSignificant
                        ? 'bg-indigo-500/50'
                        : 'bg-content-muted/30'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {/* Significance indicator */}
              {!subset.isSignificant && (
                <div className="text-[0.5625rem] text-content-muted mt-0.5">
                  not significant (p={formatStat(subset.pValue, 3)})
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Summary line */}
      <div className="text-[0.625rem] text-content-muted mt-2 leading-relaxed">
        {result.subsets[0].factors.length === 1 ? (
          <>
            <span className="text-indigo-400 font-medium">{result.subsets[0].factors[0]}</span>{' '}
            explains {formatStat(result.subsets[0].rSquaredAdj * 100, 1)}% of variation alone.
          </>
        ) : (
          <>
            <span className="text-indigo-400 font-medium">
              {result.subsets[0].factors.join(' + ')}
            </span>{' '}
            together explain {formatStat(result.subsets[0].rSquaredAdj * 100, 1)}% of variation.
          </>
        )}
      </div>
    </div>
  );
};

export default BestSubsetsCard;
