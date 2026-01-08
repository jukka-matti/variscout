import React from 'react';
import { ChevronRight, X, Home } from 'lucide-react';
import type { BreadcrumbItem } from '@variscout/core';
import { getVariationImpactLevel, getVariationInsight } from '@variscout/core';

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
}

/**
 * Get color classes for variation badge based on impact level
 */
function getVariationBadgeColors(impactLevel: 'high' | 'moderate' | 'low'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (impactLevel) {
    case 'high':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'low':
    default:
      return {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
      };
  }
}

/**
 * Format a label with variation percentage inline
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
}) => {
  // Don't render if only root item (no drills active)
  if (items.length <= 1) return null;

  // Determine cumulative badge properties
  const showCumulativeBadge =
    cumulativeVariationPct !== undefined && cumulativeVariationPct !== null;
  const impactLevel = showCumulativeBadge ? getVariationImpactLevel(cumulativeVariationPct!) : null;
  const badgeColors = impactLevel ? getVariationBadgeColors(impactLevel) : null;
  const insightText = showCumulativeBadge ? getVariationInsight(cumulativeVariationPct!) : null;

  return (
    <div className="flex items-center gap-1 px-4 sm:px-6 py-2 bg-slate-900/50 border-b border-slate-800 overflow-x-auto scrollbar-hide">
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
                  className="text-slate-600 flex-shrink-0"
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
                        ? 'bg-slate-700/50 text-white font-medium cursor-default'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
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
                    className="p-0.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
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

      {/* Cumulative Variation Badge + Clear All */}
      <div className="flex-shrink-0 flex items-center gap-2 ml-auto pl-2">
        {/* Cumulative Variation Badge */}
        {showCumulativeBadge && badgeColors && (
          <div className="relative group">
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}
                cursor-help
              `}
              aria-label={`${Math.round(cumulativeVariationPct!)}% of total variation isolated`}
            >
              {Math.round(cumulativeVariationPct!)}%
            </span>

            {/* Tooltip */}
            <div
              className="
                absolute bottom-full right-0 mb-2 w-64 p-3 rounded-lg
                bg-slate-800 border border-slate-700 shadow-xl
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 z-50
                text-xs
              "
            >
              <div className={`font-semibold ${badgeColors.text} mb-1`}>
                {Math.round(cumulativeVariationPct!)}% of total variation isolated
              </div>
              <p className="text-slate-300">{insightText}</p>
              <div className="mt-2 pt-2 border-t border-slate-700 text-slate-500">
                {impactLevel === 'high' && '🔴 High impact — strong case for action'}
                {impactLevel === 'moderate' && '🟡 Moderate impact — worth investigating'}
                {impactLevel === 'low' && '⚪ One of several contributing factors'}
              </div>
              {/* Tooltip arrow */}
              <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800 border-r border-b border-slate-700" />
            </div>
          </div>
        )}

        {/* Divider */}
        {showClearAll && onClearAll && <div className="h-4 w-px bg-slate-700" />}

        {/* Clear All */}
        {showClearAll && onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors whitespace-nowrap"
            aria-label="Clear all filters"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DrillBreadcrumb;
