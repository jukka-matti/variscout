import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { FilterChipData } from '@variscout/hooks';
import { VariationBar, type VariationBarColorScheme } from '../VariationBar';
import { FilterChipDropdown, type FilterChipDropdownColorScheme } from '../FilterChipDropdown';

/**
 * Color scheme for FilterBreadcrumb component
 */
export interface FilterBreadcrumbColorScheme {
  /** Container background (e.g., 'bg-surface/50' or 'bg-slate-900/50') */
  containerBg: string;
  /** Border color (e.g., 'border-edge' or 'border-slate-800') */
  border: string;
  /** Muted text (e.g., 'text-content-muted' or 'text-slate-500') */
  textMuted: string;
  /** Secondary text (e.g., 'text-content-secondary' or 'text-slate-400') */
  textSecondary: string;
  /** Chip default background (e.g., 'bg-surface-tertiary/50' or 'bg-slate-700/50') */
  chipBg: string;
  /** Chip hover background (e.g., 'hover:bg-surface-tertiary/70' or 'hover:bg-slate-700/70') */
  chipHoverBg: string;
  /** Remove button border (e.g., 'border-edge/50' or 'border-slate-600/50') */
  removeBorder: string;
  /** VariationBar color scheme */
  variationBar: VariationBarColorScheme;
  /** FilterChipDropdown color scheme */
  dropdown: FilterChipDropdownColorScheme;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: FilterBreadcrumbColorScheme = {
  containerBg: 'bg-surface/50',
  border: 'border-edge',
  textMuted: 'text-content-muted',
  textSecondary: 'text-content-secondary',
  chipBg: 'bg-surface-tertiary/50',
  chipHoverBg: 'hover:bg-surface-tertiary/70',
  removeBorder: 'border-edge/50',
  variationBar: {
    barBg: 'bg-surface-tertiary/50',
    tooltipBg: 'bg-surface-secondary',
    tooltipBorder: 'border-edge',
    contentText: 'text-content',
    mutedText: 'text-content-muted',
  },
  dropdown: {
    secondaryBg: 'bg-surface-secondary',
    tertiaryBg: 'bg-surface-tertiary/50',
    surfaceBg: 'bg-surface',
    border: 'border-edge',
    borderSecondary: 'border-edge',
    textSecondary: 'text-content-secondary',
    textMuted: 'text-content-muted',
    hoverBg: 'hover:bg-surface-tertiary/50',
    selectedBg: 'bg-surface-tertiary/30',
    progressBg: 'bg-surface-tertiary',
  },
};

/**
 * Azure color scheme using Tailwind Slate palette
 */
export const azureColorScheme: FilterBreadcrumbColorScheme = {
  containerBg: 'bg-slate-900/50',
  border: 'border-slate-800',
  textMuted: 'text-slate-500',
  textSecondary: 'text-slate-400',
  chipBg: 'bg-slate-700/50',
  chipHoverBg: 'hover:bg-slate-700/70',
  removeBorder: 'border-slate-600/50',
  variationBar: {
    barBg: 'bg-slate-700/50',
    tooltipBg: 'bg-slate-800',
    tooltipBorder: 'border-slate-700',
    contentText: 'text-slate-300',
    mutedText: 'text-slate-500',
  },
  dropdown: {
    secondaryBg: 'bg-slate-800',
    tertiaryBg: 'bg-slate-700/50',
    surfaceBg: 'bg-slate-900',
    border: 'border-slate-700',
    borderSecondary: 'border-slate-600',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    hoverBg: 'hover:bg-slate-700/50',
    selectedBg: 'bg-slate-700/30',
    progressBg: 'bg-slate-700',
  },
};

export interface FilterBreadcrumbProps {
  /** Filter chip data from useVariationTracking */
  filterChipData: FilterChipData[];
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Called when filter values are updated (for multi-select) */
  onUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
  /** Called when a filter is removed entirely */
  onRemoveFilter: (factor: string) => void;
  /** Called when user clicks Clear All */
  onClearAll?: () => void;
  /** Final cumulative variation percentage (for variation bar display) */
  cumulativeVariationPct?: number | null;
  /** Color scheme for styling */
  colorScheme?: FilterBreadcrumbColorScheme;
  /** Optional click handler for VariationBar (e.g., to open investigation panel) */
  onVariationBarClick?: () => void;
}

/**
 * Format selected values for chip display
 * Shows up to 2 values, then "+N" for overflow
 */
function formatChipValues(values: (string | number)[]): string {
  if (values.length === 0) return '';
  const displayed = values.slice(0, 2).map(String);
  const overflow = values.length > 2 ? ` +${values.length - 2}` : '';
  return displayed.join(', ') + overflow;
}

/**
 * Enhanced filter breadcrumb using chips instead of breadcrumb trail
 *
 * Features:
 * - Filter chips with contribution % (not local eta-squared)
 * - Multi-select dropdown for each chip
 * - Remove button per chip
 * - Clear all button
 * - Variation bar showing total isolated variation
 *
 * Design:
 * ```
 * [Shift: Night v 45%] [Machine: A, C v 32%]      [x Clear]
 *
 * [||||||||||||||||------------------] 60% of variation isolated
 * ```
 *
 * @example
 * ```tsx
 * // Using PWA semantic tokens (default)
 * <FilterBreadcrumb
 *   filterChipData={filterChipData}
 *   onUpdateFilterValues={handleUpdate}
 *   onRemoveFilter={handleRemove}
 *   cumulativeVariationPct={45}
 * />
 *
 * // Using Azure color scheme
 * <FilterBreadcrumb
 *   filterChipData={filterChipData}
 *   onUpdateFilterValues={handleUpdate}
 *   onRemoveFilter={handleRemove}
 *   cumulativeVariationPct={45}
 *   colorScheme={azureColorScheme}
 * />
 * ```
 */
const FilterBreadcrumb: React.FC<FilterBreadcrumbProps> = ({
  filterChipData,
  columnAliases = {},
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAll,
  cumulativeVariationPct,
  colorScheme = defaultColorScheme,
  onVariationBarClick,
}) => {
  // Track which chip's dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Handle chip click to open dropdown
  const handleChipClick = useCallback(
    (factor: string, event: React.MouseEvent<HTMLButtonElement>) => {
      if (openDropdown === factor) {
        setOpenDropdown(null);
        setDropdownAnchorRect(null);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownAnchorRect(rect);
        setOpenDropdown(factor);
      }
    },
    [openDropdown]
  );

  // Handle dropdown close
  const handleDropdownClose = useCallback(() => {
    setOpenDropdown(null);
    setDropdownAnchorRect(null);
  }, []);

  // Handle values change from dropdown
  const handleValuesChange = useCallback(
    (factor: string, newValues: (string | number)[]) => {
      onUpdateFilterValues(factor, newValues);
      // If all values deselected, close dropdown (filter will be removed)
      if (newValues.length === 0) {
        handleDropdownClose();
      }
    },
    [onUpdateFilterValues, handleDropdownClose]
  );

  // Handle remove chip
  const handleRemoveChip = useCallback(
    (factor: string, event: React.MouseEvent) => {
      event.stopPropagation();
      onRemoveFilter(factor);
    },
    [onRemoveFilter]
  );

  // Show variation bar when we have cumulative variation
  const showVariationBar = cumulativeVariationPct !== undefined && cumulativeVariationPct !== null;

  // Ensure filterChipData is an array
  const chips = filterChipData || [];

  // Empty state: no filters applied
  if (chips.length === 0) {
    if (!showVariationBar) return null;

    return (
      <div
        className={`flex flex-col ${colorScheme.containerBg} border-b ${colorScheme.border}`}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2">
          <span className={`text-sm ${colorScheme.textMuted}`}>No filters applied</span>
        </div>
        <div className="px-4 sm:px-6 pb-2">
          <VariationBar
            isolatedPct={0}
            showLabels={true}
            className="max-w-xs"
            colorScheme={colorScheme.variationBar}
            onClick={onVariationBarClick}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${colorScheme.containerBg} border-b ${colorScheme.border}`}
      aria-live="polite"
    >
      {/* Chips row */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2">
        {/* Filter chips */}
        {chips.map(chipData => {
          const factorLabel = columnAliases[chipData.factor] || chipData.factor;
          const isOpen = openDropdown === chipData.factor;

          return (
            <div key={chipData.factor} className="flex items-center gap-0.5">
              {/* Main chip button */}
              <button
                ref={el => {
                  if (el) chipRefs.current.set(chipData.factor, el);
                  else chipRefs.current.delete(chipData.factor);
                }}
                onClick={e => handleChipClick(chipData.factor, e)}
                data-testid={`filter-chip-${chipData.factor}`}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-full text-xs
                  transition-colors
                  ${isOpen ? 'bg-blue-500/20 text-blue-300' : `${colorScheme.chipBg} text-white ${colorScheme.chipHoverBg}`}
                `}
                title={`${factorLabel} contributes ${Math.round(chipData.contributionPct)}% of total variation. Click to modify selection.`}
              >
                {/* Factor and values */}
                <span className="font-medium">{factorLabel}:</span>
                <span className="max-w-[120px] truncate">{formatChipValues(chipData.values)}</span>

                {/* Dropdown indicator */}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />

                {/* Contribution badge */}
                <span
                  className={`
                    px-1.5 py-0.5 rounded text-[10px] font-medium
                    ${
                      chipData.contributionPct >= 50
                        ? 'bg-green-500/20 text-green-400'
                        : chipData.contributionPct >= 30
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }
                  `}
                >
                  {Math.round(chipData.contributionPct)}%
                </span>
              </button>

              {/* Remove button */}
              <button
                onClick={e => handleRemoveChip(chipData.factor, e)}
                data-testid={`filter-chip-remove-${chipData.factor}`}
                className={`
                  px-1.5 py-1.5 rounded-r-full ${colorScheme.textMuted}
                  hover:text-red-400 hover:bg-red-400/10
                  ${colorScheme.chipBg} border-l ${colorScheme.removeBorder}
                  transition-colors
                `}
                aria-label={`Remove ${factorLabel} filter`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Clear All button */}
        {onClearAll && chips.length > 0 && (
          <button
            onClick={onClearAll}
            data-testid="filter-clear-all"
            className={`
              flex items-center gap-1 px-2 py-1 ml-auto
              text-xs ${colorScheme.textSecondary}
              hover:text-red-400 hover:bg-red-400/10
              rounded transition-colors whitespace-nowrap
            `}
            aria-label="Clear all filters"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Variation Bar */}
      {showVariationBar && (
        <div className="px-4 sm:px-6 pb-2">
          <VariationBar
            isolatedPct={cumulativeVariationPct!}
            showLabels={true}
            className="max-w-xs"
            colorScheme={colorScheme.variationBar}
            onClick={onVariationBarClick}
          />
        </div>
      )}

      {/* Dropdown portal */}
      {openDropdown && dropdownAnchorRect && (
        <FilterChipDropdown
          chipData={chips.find(c => c.factor === openDropdown)!}
          factorLabel={columnAliases[openDropdown] || openDropdown}
          onValuesChange={handleValuesChange}
          onClose={handleDropdownClose}
          anchorRect={dropdownAnchorRect}
          colorScheme={colorScheme.dropdown}
        />
      )}
    </div>
  );
};

export default FilterBreadcrumb;
