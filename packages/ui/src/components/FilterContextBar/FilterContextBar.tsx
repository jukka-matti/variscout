import React from 'react';
import type { FilterChipData } from '@variscout/hooks';

/**
 * Color scheme for FilterContextBar component
 */
export interface FilterContextBarColorScheme {
  /** Text color for factor labels (e.g., 'text-content-secondary' or 'text-slate-400') */
  textLabel: string;
  /** Text color for values (e.g., 'text-content-muted' or 'text-slate-500') */
  textValue: string;
  /** Text color for the variation percentage — kept for interface compat; actual color now uses CSS var(--accent-hex) */
  textVariation: string;
  /** Separator color (e.g., 'text-content-muted' or 'text-slate-600') */
  textSeparator: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: FilterContextBarColorScheme = {
  textLabel: 'text-content-secondary',
  textValue: 'text-content-muted',
  textVariation: 'text-blue-400',
  textSeparator: 'text-content-muted',
};

export interface FilterContextBarProps {
  /** Filter chip data from useVariationTracking */
  filterChipData: FilterChipData[];
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Final cumulative variation percentage */
  cumulativeVariationPct?: number | null;
  /** Whether to show the bar (respects displayOptions.showFilterContext) */
  show?: boolean;
  /** Color scheme for styling */
  colorScheme?: FilterContextBarColorScheme;
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
  colorScheme = defaultColorScheme,
}) => {
  if (!show || !filterChipData || filterChipData.length === 0) {
    return null;
  }

  const hasVariation = cumulativeVariationPct !== undefined && cumulativeVariationPct !== null;

  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 text-[11px] leading-tight overflow-hidden"
      aria-label="Active filter context"
    >
      {filterChipData.map((chip, i) => {
        const label = columnAliases[chip.factor] || chip.factor;
        return (
          <React.Fragment key={chip.factor}>
            {i > 0 && (
              <span className={colorScheme.textSeparator} aria-hidden="true">
                {'\u2192'}
              </span>
            )}
            <span className="whitespace-nowrap">
              <span className={`font-medium ${colorScheme.textLabel}`}>{label}:</span>{' '}
              <span className={colorScheme.textValue}>{formatValues(chip.values)}</span>
            </span>
          </React.Fragment>
        );
      })}
      {hasVariation && (
        <>
          <span
            className="ml-auto pl-2 whitespace-nowrap font-medium"
            style={{ color: 'var(--accent-hex, #60a5fa)' }}
          >
            {Math.round(cumulativeVariationPct!)}% in focus
          </span>
        </>
      )}
    </div>
  );
};

export default FilterContextBar;
