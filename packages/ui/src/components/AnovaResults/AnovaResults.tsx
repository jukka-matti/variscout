import type { AnovaResult } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';

export interface AnovaResultsProps {
  /** ANOVA calculation result from @variscout/core */
  result: AnovaResult | null;
  /** Display label for the factor being analyzed */
  factorLabel: string;
}

/**
 * Format p-value: show as <0.001 when very small, otherwise 3 decimal places.
 */
function formatPValue(p: number): string {
  if (p < 0.001) return '<0.001';
  return p.toFixed(3);
}

/**
 * Format SS with comma separators for readability.
 */
function formatSS(value: number): string {
  if (Math.abs(value) < 1) return value.toFixed(3);
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Compact one-way ANOVA table.
 *
 * Displays the standard ANOVA decomposition (Factor / Error / Total)
 * with DF, SS, F, P columns, and eta-squared as the key takeaway below.
 *
 * Replaces the previous narrative card. Group means are shown separately
 * in BoxplotStatsTable above this component.
 *
 * @example
 * ```tsx
 * <AnovaResults result={anovaResult} factorLabel="Shift" />
 * ```
 */
const AnovaResults = ({ result, factorLabel }: AnovaResultsProps) => {
  const { getTerm } = useGlossary();
  const { formatStat } = useTranslation();

  if (!result) return null;

  const { ssb, ssw, dfBetween, dfWithin, fStatistic, pValue, etaSquared } = result;
  const ssTotal = ssb + ssw;
  const dfTotal = dfBetween + dfWithin;

  return (
    <div
      data-testid="anova-results"
      className="bg-surface-secondary/50 border border-edge/50 rounded-lg p-3 mt-2"
    >
      {/* Header */}
      <span className="text-[0.6875rem] font-semibold text-content-secondary uppercase tracking-wider">
        One-Way ANOVA
      </span>

      {/* ANOVA table */}
      <table
        className="w-full mt-1.5 text-xs font-mono"
        aria-label={`ANOVA table for ${factorLabel}`}
      >
        <thead>
          <tr className="text-content-muted text-left">
            <th className="font-medium pb-1 pr-3">Source</th>
            <th className="font-medium pb-1 pr-3 text-right">DF</th>
            <th className="font-medium pb-1 pr-3 text-right">SS</th>
            <th className="font-medium pb-1 pr-3 text-right">F</th>
            <th className="font-medium pb-1 text-right">P</th>
          </tr>
        </thead>
        <tbody className="text-content">
          {/* Factor row */}
          <tr className="border-t border-edge/30">
            <td className="py-0.5 pr-3">{factorLabel}</td>
            <td className="py-0.5 pr-3 text-right">{dfBetween}</td>
            <td className="py-0.5 pr-3 text-right">{formatSS(ssb)}</td>
            <td className="py-0.5 pr-3 text-right" data-testid="anova-significance">
              {formatStat(fStatistic)}
            </td>
            <td className="py-0.5 text-right">{formatPValue(pValue)}</td>
          </tr>
          {/* Error row */}
          <tr className="border-t border-edge/30">
            <td className="py-0.5 pr-3 text-content-secondary">Error</td>
            <td className="py-0.5 pr-3 text-right">{dfWithin}</td>
            <td className="py-0.5 pr-3 text-right">{formatSS(ssw)}</td>
            <td className="py-0.5 pr-3 text-right"></td>
            <td className="py-0.5 text-right"></td>
          </tr>
          {/* Total row */}
          <tr className="border-t border-edge/50 font-medium">
            <td className="py-0.5 pr-3">Total</td>
            <td className="py-0.5 pr-3 text-right">{dfTotal}</td>
            <td className="py-0.5 pr-3 text-right">{formatSS(ssTotal)}</td>
            <td className="py-0.5 pr-3 text-right"></td>
            <td className="py-0.5 text-right"></td>
          </tr>
        </tbody>
      </table>

      {/* Eta-squared takeaway */}
      {etaSquared > 0 && (
        <div
          data-testid="anova-eta-squared"
          className="mt-2 pt-1.5 border-t border-edge/30 text-xs flex items-center gap-1"
        >
          <span className="font-mono font-semibold text-content">
            &eta;&sup2; = {formatStat(etaSquared, 2)}
          </span>
          <span className="text-content-secondary">
            ({formatStat(etaSquared * 100, 1)}% of variation explained)
          </span>
          <HelpTooltip term={getTerm('etaSquared')} iconSize={12} />
        </div>
      )}
    </div>
  );
};

export default AnovaResults;
