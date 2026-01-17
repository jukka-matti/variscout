import React from 'react';
import { ChevronRight, X, Home } from 'lucide-react';
import type { BreadcrumbItem } from '@variscout/core';
import VariationBar from './VariationBar';

interface DrillBreadcrumbProps {
  /** Breadcrumb items from useDrillDown hook (with variation data) */
  items: BreadcrumbItem[];
  /** Called when user clicks a breadcrumb to navigate */
  onNavigate: (id: string) => void;
  /** Called when user clicks Clear All */
  onClearAll?: () => void;
  /** Called when user clicks remove on individual breadcrumb item */
  onRemove?: (id: string) => void;
  /** Show clear all button */
  showClearAll?: boolean;
  /** Final cumulative variation percentage (for badge display) */
  cumulativeVariationPct?: number | null;
  /** Compact mode for mobile - shows chips without breadcrumb arrows */
  compact?: boolean;
}

/**
 * Breadcrumb navigation bar for drill-down state
 *
 * Shows the current drill path with clickable items to navigate back.
 * Also supports compact mode for mobile displays.
 *
 * @example
 * ```tsx
 * const { breadcrumbs, drillTo, clearDrill } = useDrillDown();
 *
 * <DrillBreadcrumb
 *   items={breadcrumbs}
 *   onNavigate={drillTo}
 *   onClearAll={clearDrill}
 * />
 * ```
 */

/**
 * Format a label with variation percentage inline
 * e.g., "Shift: Night" -> "Shift: Night (67%)"
 */
function formatLabelWithVariation(label: string, variationPct?: number): string {
  if (variationPct === undefined || variationPct === null) {
    return label;
  }
  return `${label} (${Math.round(variationPct)}%)`;
}

const DrillBreadcrumb: React.FC<DrillBreadcrumbProps> = ({
  items,
  onNavigate,
  onClearAll,
  onRemove,
  showClearAll = true,
  cumulativeVariationPct,
  compact = false,
}) => {
  // Don't render if only root item (no drills active)
  if (items.length <= 1) return null;

  // Determine if we should show variation bar
  const showVariationBar = cumulativeVariationPct !== undefined && cumulativeVariationPct !== null;

  // Compact mode: show chips without breadcrumb trail (for mobile)
  if (compact) {
    // Filter out root item for compact display
    const filterItems = items.filter(item => item.id !== 'root');
    if (filterItems.length === 0) return null;

    return (
      <div className="flex flex-col bg-surface/50 border-b border-edge">
        {/* Main compact row */}
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-nowrap min-w-0">
            {filterItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-1 px-2.5 py-1 bg-surface-tertiary/50 rounded-full text-xs flex-shrink-0"
              >
                <span className="text-white truncate max-w-[150px]">
                  {formatLabelWithVariation(item.label, item.localVariationPct)}
                </span>
                {onRemove && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="p-0.5 text-content-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    aria-label={`Remove ${item.label} filter`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Clear All button */}
          {showClearAll && onClearAll && filterItems.length > 1 && (
            <button
              onClick={onClearAll}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-content-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors whitespace-nowrap"
              aria-label="Clear all filters"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Variation Bar - compact mode shows bar only, no labels */}
        {showVariationBar && (
          <div className="px-4 pb-2">
            <VariationBar
              isolatedPct={cumulativeVariationPct!}
              showLabels={false}
              className="max-w-[200px]"
            />
          </div>
        )}
      </div>
    );
  }

  // Standard breadcrumb mode
  return (
    <div className="flex flex-col bg-surface/50 border-b border-edge">
      {/* Main breadcrumb row */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-1 overflow-x-auto scrollbar-hide">
        {/* Breadcrumb trail */}
        <nav
          className="flex items-center gap-1 flex-nowrap min-w-0"
          aria-label="Drill-down navigation"
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isRoot = item.id === 'root';

            return (
              <React.Fragment key={item.id}>
                {/* Separator (not before first item) */}
                {index > 0 && (
                  <ChevronRight
                    size={14}
                    className="text-content-muted flex-shrink-0"
                    aria-hidden="true"
                  />
                )}

                {/* Breadcrumb item */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => onNavigate(item.id)}
                    disabled={isLast}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
                      transition-colors
                      ${
                        isLast
                          ? 'bg-surface-tertiary/50 text-white font-medium cursor-default'
                          : 'text-content-secondary hover:text-white hover:bg-surface-tertiary/30'
                      }
                    `}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {isRoot && <Home size={12} className="flex-shrink-0" />}
                    <span className="truncate max-w-[180px]">
                      {isRoot
                        ? item.label
                        : formatLabelWithVariation(item.label, item.localVariationPct)}
                    </span>
                  </button>

                  {/* Remove button for non-root items */}
                  {!isRoot && onRemove && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                      className="p-0.5 text-content-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      aria-label={`Remove ${item.label} filter`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Clear All button */}
        <div className="flex-shrink-0 flex items-center gap-2 ml-auto pl-2">
          {showClearAll && onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-content-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors whitespace-nowrap"
              aria-label="Clear all filters"
            >
              <X size={14} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Variation Bar - shown below breadcrumbs when cumulative variation is available */}
      {showVariationBar && (
        <div className="px-4 sm:px-6 pb-2">
          <VariationBar
            isolatedPct={cumulativeVariationPct!}
            showLabels={true}
            className="max-w-xs"
          />
        </div>
      )}
    </div>
  );
};

export default DrillBreadcrumb;
