import React from 'react';
import type { FilterChipData } from '@variscout/hooks';

export interface FilterContextBarProps {
  /** Filter chip data from useVariationTracking */
  filterChipData: FilterChipData[];
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Final cumulative variation percentage */
  cumulativeVariationPct?: number | null;
  /** Whether to show the bar (respects displayOptions.showFilterContext) */
  show?: boolean;
}

/**
 * Format selected values for compact display.
 * Shows up to 2 values, then "+N" for overflow.
 */
function formatValues(values: (string | number)[]): string {
  if (values.length === 0) return '';
  const displayed = values.slice(0, 2).map(String);
  const overflow = values.length > 2 ? ` +${values.length - 2}` : '';
  return displayed.join(', ') + overflow;
}

/**
 * Compact, non-interactive filter context summary for chart cards.
 *
 * Renders inside chart card containers so it gets captured by
 * html-to-image toBlob() when copying charts to clipboard.
 *
 * Format: `Shift: Night -> Machine: A, C   58% in focus`
 */
const FilterContextBar: React.FC<FilterContextBarProps> = ({
  filterChipData,
  columnAliases = {},
  cumulativeVariationPct,
  show = true,
}) => {
  if (!show || !filterChipData || filterChipData.length === 0) {
    return null;
  }

  const hasVariation = cumulativeVariationPct !== undefined && cumulativeVariationPct !== null;

  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 text-[0.6875rem] leading-tight overflow-hidden"
      aria-label="Active filter context"
    >
      {filterChipData.map((chip, i) => {
        const label = columnAliases[chip.factor] || chip.factor;
        return (
          <React.Fragment key={chip.factor}>
            {i > 0 && (
              <span className="text-content-muted" aria-hidden="true">
                {'\u2192'}
              </span>
            )}
            <span className="whitespace-nowrap">
              <span className="font-medium text-content-secondary">{label}:</span>{' '}
              <span className="text-content-muted">{formatValues(chip.values)}</span>
            </span>
          </React.Fragment>
        );
      })}
      {hasVariation && (
        <>
          <span className="ml-auto pl-2 whitespace-nowrap font-medium text-blue-400">
            {Math.round(cumulativeVariationPct!)}% in focus
          </span>
        </>
      )}
    </div>
  );
};

export default FilterContextBar;
