import React from 'react';
import { ChevronRight, X, Home } from 'lucide-react';
import type { BreadcrumbItem } from '@variscout/core';

interface DrillBreadcrumbProps {
  /** Breadcrumb items from useDrillDown hook */
  items: BreadcrumbItem[];
  /** Called when user clicks a breadcrumb to navigate */
  onNavigate: (id: string) => void;
  /** Called when user clicks Clear All */
  onClearAll?: () => void;
  /** Show clear all button */
  showClearAll?: boolean;
}

/**
 * Breadcrumb navigation bar for drill-down state
 *
 * Shows the current drill path with clickable items to navigate back.
 * Styled to match FilterBar for visual consistency.
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
const DrillBreadcrumb: React.FC<DrillBreadcrumbProps> = ({
  items,
  onNavigate,
  onClearAll,
  showClearAll = true,
}) => {
  // Don't render if only root item (no drills active)
  if (items.length <= 1) return null;

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
              <button
                onClick={() => onNavigate(item.id)}
                disabled={isLast}
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
                  transition-colors flex-shrink-0
                  ${
                    isLast
                      ? 'bg-slate-700/50 text-white font-medium cursor-default'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
                aria-current={isLast ? 'page' : undefined}
              >
                {isRoot && <Home size={12} className="flex-shrink-0" />}
                <span className="truncate max-w-[150px]">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Spacer + Clear All */}
      {showClearAll && onClearAll && (
        <div className="flex-shrink-0 flex items-center gap-2 ml-auto pl-2">
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors whitespace-nowrap"
            aria-label="Clear all filters"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DrillBreadcrumb;
