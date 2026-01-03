import type { AnovaResult } from '@variscout/core';

interface AnovaResultsProps {
  result: AnovaResult | null;
  factorLabel: string;
}

/**
 * Displays one-way ANOVA results below the Boxplot
 * Shows group means, significance test, and plain-language insight
 */
const AnovaResults = ({ result, factorLabel }: AnovaResultsProps) => {
  if (!result) return null;

  const { groups, pValue, isSignificant, insight, etaSquared } = result;

  // Format p-value for display
  const formatPValue = (p: number): string => {
    if (p < 0.001) return '< 0.001';
    if (p < 0.01) return p.toFixed(3);
    return p.toFixed(2);
  };

  // Effect size interpretation
  const getEffectSizeLabel = (eta: number): string => {
    if (eta >= 0.14) return 'large';
    if (eta >= 0.06) return 'medium';
    return 'small';
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ANOVA: {factorLabel}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            isSignificant ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isSignificant ? 'Significant' : 'Not Significant'}
        </span>
      </div>

      {/* Group means and sample sizes */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-2">
        {groups.map(group => (
          <span key={group.name} className="text-slate-300">
            <span className="text-slate-500">{group.name}:</span>{' '}
            <span className="font-mono">{group.mean.toFixed(1)}</span>
            <span className="text-slate-500 ml-1">(n={group.n})</span>
          </span>
        ))}
      </div>

      {/* Significance result */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-400">
          Different?{' '}
          <span className={isSignificant ? 'text-green-400 font-semibold' : 'text-slate-300'}>
            {isSignificant ? 'YES' : 'NO'}
          </span>
          <span className="text-slate-500 ml-1">(p = {formatPValue(pValue)})</span>
        </span>
        {etaSquared > 0 && (
          <span className="text-slate-500 text-xs">
            η² = {etaSquared.toFixed(2)} ({getEffectSizeLabel(etaSquared)} effect)
          </span>
        )}
      </div>

      {/* Plain-language insight */}
      {isSignificant && insight && (
        <div className="mt-2 text-sm text-blue-400 font-medium">{insight}</div>
      )}
    </div>
  );
};

export default AnovaResults;
