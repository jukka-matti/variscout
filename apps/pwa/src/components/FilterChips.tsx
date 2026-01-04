import React from 'react';
import { X } from 'lucide-react';

interface FilterChipsProps {
  filters: Record<string, string[]>;
  columnAliases?: Record<string, string>;
  onRemoveFilter: (factor: string) => void;
  onClearAll: () => void;
}

/**
 * Displays active filters as removable chips
 * Provides quick visual feedback and one-click removal
 */
const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  columnAliases = {},
  onRemoveFilter,
  onClearAll,
}) => {
  // Guard against undefined filters
  if (!filters) return null;

  const activeFilters = Object.entries(filters).filter(
    ([_, values]) => Array.isArray(values) && values.length > 0
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2 bg-slate-900/50 border-b border-slate-800">
      {activeFilters.map(([factor, values]) => {
        const displayName = columnAliases[factor] || factor;
        const displayValues = values.slice(0, 3).join(', ');
        const suffix = values.length > 3 ? ` +${values.length - 3}` : '';

        return (
          <div
            key={factor}
            className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 pl-2.5 pr-1.5 py-1 rounded-lg text-xs group"
          >
            <span className="text-slate-400">{displayName}:</span>
            <span className="font-medium">
              {displayValues}
              {suffix}
            </span>
            <button
              onClick={() => onRemoveFilter(factor)}
              className="p-0.5 hover:bg-blue-500/30 rounded transition-colors"
              title={`Remove ${displayName} filter`}
            >
              <X size={12} className="text-blue-400 group-hover:text-blue-200" />
            </button>
          </div>
        );
      })}
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-white px-2 py-1 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterChips;
