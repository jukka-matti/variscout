import React, { useMemo } from 'react';
import type { BoxplotGroupData } from './types';
import { useChartTheme } from './useChartTheme';

export interface BoxplotStatsTableProps {
  /** Boxplot data with pre-calculated statistics */
  data: BoxplotGroupData[];
  /** Compact mode for space-constrained layouts */
  compact?: boolean;
}

/**
 * Shared stats table for boxplot charts
 * Displays: Group | n | Mean | Median | StdDev
 * Highlights: Row with highest StdDev (★ indicator)
 */
const BoxplotStatsTable: React.FC<BoxplotStatsTableProps> = ({ data, compact = false }) => {
  const { formatStat, t } = useChartTheme();

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

  if (data.length === 0) return null;

  // Theme-aware colors using semantic tokens
  const headerBg = 'bg-surface-tertiary';
  const rowEvenBg = 'bg-surface';
  const rowOddBg = 'bg-surface-secondary/30';
  const borderColor = 'border-edge';
  const textPrimary = 'text-content';
  const textSecondary = 'text-content-secondary';
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
              {t('chart.category')}
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              n
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              {t('stats.mean')}
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              {t('stats.median')}
            </th>
            <th
              className={`${padding} text-right font-semibold ${textPrimary} border ${borderColor}`}
            >
              {t('stats.stdDev')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const isHighestStdDev = d.key === highestStdDevKey;
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BoxplotStatsTable;
