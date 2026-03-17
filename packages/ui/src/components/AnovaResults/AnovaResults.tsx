import type { AnovaResult } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';

/**
 * Color scheme for AnovaResults component
 * Allows customization for different app themes (PWA vs Azure)
 */
export interface AnovaResultsColorScheme {
  /** Background color class (e.g., 'bg-surface/50' or 'bg-slate-900/50') */
  background: string;
  /** Border color class (e.g., 'border-edge/50' or 'border-slate-700/50') */
  border: string;
  /** Header text color (e.g., 'text-content-secondary' or 'text-slate-400') */
  headerText: string;
  /** Primary content text (e.g., 'text-content' or 'text-slate-300') */
  contentText: string;
  /** Muted/secondary text (e.g., 'text-content-muted' or 'text-slate-500') */
  mutedText: string;
  /** Secondary content text (e.g., 'text-content-secondary' or 'text-slate-400') */
  secondaryText: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: AnovaResultsColorScheme = {
  background: 'bg-surface/50',
  border: 'border-edge/50',
  headerText: 'text-content-secondary',
  contentText: 'text-content',
  mutedText: 'text-content-muted',
  secondaryText: 'text-content-secondary',
};

export interface AnovaResultsProps {
  /** ANOVA calculation result from @variscout/core */
  result: AnovaResult | null;
  /** Display label for the factor being analyzed */
  factorLabel: string;
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: AnovaResultsColorScheme;
}

/**
 * Format p-value for display (accepts a locale-aware formatter)
 */
function formatPValue(p: number, fmt: (v: number, d?: number) => string): string {
  if (p < 0.001) return '< 0.001';
  if (p < 0.01) return fmt(p, 3);
  return fmt(p);
}

/**
 * Displays one-way ANOVA results
 *
 * Shows group means, significance test, and plain-language insight.
 * Used in boxplot views to explain variation between groups.
 *
 * @example
 * ```tsx
 * // Using PWA semantic tokens (default)
 * <AnovaResults result={anovaResult} factorLabel="Shift" />
 * ```
 */
const AnovaResults = ({
  result,
  factorLabel,
  colorScheme = defaultColorScheme,
}: AnovaResultsProps) => {
  const { getTerm } = useGlossary();
  const { formatStat } = useTranslation();

  if (!result) return null;

  const { groups, pValue, etaSquared, fStatistic } = result;

  return (
    <div
      data-testid="anova-results"
      className={`${colorScheme.background} border ${colorScheme.border} rounded-lg p-3 mt-2`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-semibold ${colorScheme.headerText} uppercase tracking-wider`}
        >
          ANOVA: {factorLabel}
        </span>
      </div>

      {/* Group means and sample sizes */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-2">
        {groups.map(group => (
          <span key={group.name} className={colorScheme.contentText}>
            <span className={colorScheme.mutedText}>{group.name}:</span>{' '}
            <span className="font-mono">{formatStat(group.mean, 1)}</span>
            <span className={`${colorScheme.mutedText} ml-1`}>(n={group.n})</span>
          </span>
        ))}
      </div>

      {/* Significance result */}
      <div className={`flex items-center gap-4 text-sm mt-2 border-t ${colorScheme.border} pt-2`}>
        <span className={`${colorScheme.secondaryText} flex items-center gap-1`}>
          <span data-testid="anova-significance" className={`font-mono ${colorScheme.contentText}`}>
            F = {formatStat(fStatistic)}, p = {formatPValue(pValue, formatStat)}
          </span>
          <HelpTooltip term={getTerm('fStatistic')} iconSize={12} />
        </span>
        {etaSquared > 0 && (
          <span
            data-testid="anova-eta-squared"
            className={`${colorScheme.mutedText} text-xs flex items-center gap-1`}
          >
            η² = {formatStat(etaSquared)}
            <HelpTooltip term={getTerm('etaSquared')} iconSize={12} />
          </span>
        )}
      </div>
    </div>
  );
};

export default AnovaResults;
