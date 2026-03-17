import React, { useMemo } from 'react';
import type { BoxplotGroupData } from './types';
import { useChartTheme } from './useChartTheme';

export interface BoxplotStatsTableProps {
  /** Boxplot data with pre-calculated statistics */
  data: BoxplotGroupData[];
  /** Category contributions - Map from category key to % of total variation */
  categoryContributions?: Map<string | number, number>;
  /** Threshold for "high variation" highlight (default: 50) */
  variationThreshold?: number;
  /** Compact mode for space-constrained layouts */
  compact?: boolean;
}

/**
 * Shared stats table for boxplot charts
 * Displays: Group | n | Mean | Median | StdDev | Variation %
 * Highlights:
 * - Row with highest StdDev (★ indicator)
 * - Row with highest variation contribution (red text)
 */
const BoxplotStatsTable: React.FC<BoxplotStatsTableProps> = ({
  data,
  categoryContributions,
  variationThreshold = 50,
  compact = false,
}) => {
  const { isDark, formatStat } = useChartTheme();

  // Find the row with highest StdDev
  const highestStdDevKey = useMemo(() => {
    if (data.length === 0) return null;
    let maxStdDev = -Infinity;
    let maxKey = data[0].key;
    for (const d of data) {
      if (d.stdDev > maxStdDev) {
        maxStdDev = d.stdDev;
        maxKey = d.key;
      }
    }
    return maxKey;
  }, [data]);

  // Find the row with highest variation contribution
  const highestVariationKey = useMemo(() => {
    if (!categoryContributions || categoryContributions.size === 0) return null;
    let maxContribution = -Infinity;
    let maxKey: string | number | null = null;
    categoryContributions.forEach((contribution, key) => {
      if (contribution > maxContribution) {
        maxContribution = contribution;
        maxKey = key;
      }
    });
    return maxKey;
  }, [categoryContributions]);

  if (data.length === 0) return null;

  const showVariation = categoryContributions && categoryContributions.size > 0;

  // Theme-aware colors
  const headerBg = isDark ? 'bg-slate-800' : 'bg-slate-100';
  const rowEvenBg = isDark ? 'bg-slate-900/50' : 'bg-white';
  const rowOddBg = isDark ? 'bg-slate-800/30' : 'bg-slate-50';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const highlightText = 'text-red-400';
  const starColor = 'text-amber-400';

  const fontSize = compact ? 'text-xs' : 'text-sm';
  const padding = compact ? 'px-2 py-1' : 'px-3 py-2';

  return (
    <div className={`mt-4 overflow-x-auto ${fontSize}`}>
      <table className={`w-full border-collapse border ${borderColor}`}>
        <thead>
          <tr className={headerBg}>
            <th
              className={`${padding} text-left font-semibold ${textPrimary} border ${borderColor}`}
            >
              Group
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              n
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              Mean
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              Median
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              StdDev
            </th>
            {showVariation && (
              <th
                className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
              >
                Variation %
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const isHighestStdDev = d.key === highestStdDevKey;
            const contribution = categoryContributions?.get(d.key);
            const isHighestVariation = d.key === highestVariationKey;
            const isHighVariation =
              contribution !== undefined && contribution >= variationThreshold;
            const rowBg = i % 2 === 0 ? rowEvenBg : rowOddBg;

            return (
              <tr key={d.key} className={rowBg}>
                <td className={`${padding} ${textPrimary} border ${borderColor} font-medium`}>
                  {d.key}
                </td>
                <td
                  className={`${padding} text-right ${textSecondary} border ${borderColor} tabular-nums`}
                >
                  {d.values.length}
                </td>
                <td
                  className={`${padding} text-right ${textSecondary} border ${borderColor} tabular-nums`}
                >
                  {formatStat(d.mean)}
                </td>
                <td
                  className={`${padding} text-right ${textSecondary} border ${borderColor} tabular-nums`}
                >
                  {formatStat(d.median)}
                </td>
                <td
                  className={`${padding} text-right border ${borderColor} tabular-nums ${
                    isHighestStdDev ? `font-semibold ${textPrimary}` : textSecondary
                  }`}
                >
                  {isHighestStdDev && <span className={`${starColor} mr-1`}>★</span>}
                  {formatStat(d.stdDev, 3)}
                </td>
                {showVariation && (
                  <td
                    className={`${padding} text-right border ${borderColor} tabular-nums ${
                      isHighVariation || isHighestVariation
                        ? `font-semibold ${highlightText}`
                        : textSecondary
                    }`}
                  >
                    {contribution !== undefined ? `${Math.round(contribution)}%` : '-'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BoxplotStatsTable;
