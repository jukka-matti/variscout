import type { AnovaResult } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';

interface AnovaResultsProps {
  result: AnovaResult | null;
  factorLabel: string;
}

/**
 * Displays one-way ANOVA results below the Boxplot
 * Shows group means, significance test, and plain-language insight
 */
const AnovaResults = ({ result, factorLabel }: AnovaResultsProps) => {
  const { getTerm } = useGlossary();

  if (!result) return null;

  const { groups, pValue, isSignificant, insight, etaSquared, fStatistic } = result;

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
    <div className="bg-surface/50 border border-edge/50 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          ANOVA: {factorLabel}
        </span>
      </div>

      {/* Group means and sample sizes */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-2">
        {groups.map(group => (
          <span key={group.name} className="text-content">
            <span className="text-content-muted">{group.name}:</span>{' '}
            <span className="font-mono">{group.mean.toFixed(1)}</span>
            <span className="text-content-muted ml-1">(n={group.n})</span>
          </span>
        ))}
      </div>

      {/* Significance result */}
      <div className="flex items-center gap-4 text-sm mt-2 border-t border-edge/50 pt-2">
        <span className="text-content-secondary flex items-center gap-1">
          <span className="font-mono text-content">
            F = {fStatistic.toFixed(2)}, p = {formatPValue(pValue)}
          </span>
          <HelpTooltip term={getTerm('fStatistic')} iconSize={12} />
        </span>
        {etaSquared > 0 && (
          <span className="text-content-muted text-xs flex items-center gap-1">
            η² = {etaSquared.toFixed(2)}
            <HelpTooltip term={getTerm('etaSquared')} iconSize={12} />
          </span>
        )}
      </div>
    </div>
  );
};

export default AnovaResults;
