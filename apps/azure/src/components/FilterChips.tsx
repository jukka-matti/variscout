import React from 'react';
import { X } from 'lucide-react';

interface FilterChipsProps {
  filters: Record<string, any[]>;
  columnAliases: Record<string, string>;
  onRemoveFilter: (factor: string) => void;
  onClearAll: () => void;
}

/**
 * Display active filters as removable chips
 */
const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  columnAliases,
  onRemoveFilter,
  onClearAll,
}) => {
  // Get active filters (those with values)
  const activeFilters = Object.entries(filters || {}).filter(
    ([_, values]) => Array.isArray(values) && values.length > 0
  );

  // Don't render if no active filters
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-slate-800/50 border-b border-slate-700/50 overflow-x-auto scrollbar-hide">
      <span className="text-xs text-slate-500 flex-shrink-0">Filters:</span>

      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map(([factor, values]) => {
          const alias = columnAliases[factor] || factor;
          const displayValues = values.slice(0, 2).map(String);
          const suffix = values.length > 2 ? ` +${values.length - 2}` : '';

          return (
            <div
              key={factor}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs border border-blue-600/30"
            >
              <span className="font-medium">{alias}:</span>
              <span className="text-blue-300">
                {displayValues.join(', ')}
                {suffix}
              </span>
              <button
                onClick={() => onRemoveFilter(factor)}
                className="ml-1 p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                aria-label={`Remove ${alias} filter`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="flex-shrink-0 text-xs text-slate-400 hover:text-red-400 transition-colors ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterChips;
