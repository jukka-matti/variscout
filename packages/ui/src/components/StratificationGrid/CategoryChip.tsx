import React from 'react';
import type { StratificationGridColorScheme } from './StratificationGrid';

interface CategoryChipProps {
  value: string | number;
  count: number;
  contributionPct: number;
  maxContributionPct: number;
  onClick?: () => void;
  colorScheme: StratificationGridColorScheme;
}

/**
 * Single category row within a factor card.
 * Shows value name + contribution bar + percentage.
 * Click triggers immediate single-category filter.
 */
const CategoryChip: React.FC<CategoryChipProps> = ({
  value,
  count,
  contributionPct,
  maxContributionPct,
  onClick,
  colorScheme: c,
}) => {
  const barWidth =
    maxContributionPct > 0 ? Math.max(2, (contributionPct / maxContributionPct) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded-md transition-colors ${c.chipHoverBg}`}
      data-testid={`category-chip-${value}`}
    >
      {/* Value label */}
      <span className={`flex-1 text-sm ${c.textPrimary} truncate min-w-0`}>{String(value)}</span>

      {/* Contribution bar + percentage */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`w-14 h-1.5 ${c.progressBg} rounded-full overflow-hidden`}>
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className={`text-xs ${c.textSecondary} w-8 text-right tabular-nums`}>
          {Math.round(contributionPct)}%
        </span>
      </div>

      {/* Count (small, muted) */}
      <span className={`text-[10px] ${c.textMuted} w-6 text-right tabular-nums`}>n={count}</span>
    </button>
  );
};

export default CategoryChip;
