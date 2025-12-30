import React from 'react';
import { X } from 'lucide-react';
import { useData } from '../context/DataContext';

interface FilterChipProps {
  factor: string;
  values: any[];
  factorLabel: string;
  valueLabels: Record<string, string>;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  factor,
  values,
  factorLabel,
  valueLabels,
  onRemove,
}) => {
  // Format values with labels and truncation
  const formattedValues = values.slice(0, 3).map(v => valueLabels[v] || String(v));
  const hasMore = values.length > 3;
  const valueText = hasMore
    ? `${formattedValues.join(', ')} +${values.length - 3}`
    : formattedValues.join(', ');

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs hover:bg-slate-600 transition-colors group flex-shrink-0">
      <span className="text-slate-400">{factorLabel}:</span>
      <span className="text-white font-medium">{valueText}</span>
      <button
        onClick={onRemove}
        className="p-0.5 text-slate-400 hover:text-red-400 rounded-full hover:bg-red-400/10 transition-colors"
        aria-label={`Remove ${factorLabel} filter`}
      >
        <X size={12} />
      </button>
    </div>
  );
};

const FilterBar: React.FC = () => {
  const { filters, setFilters, columnAliases, valueLabels } = useData();

  // Get active filters (non-empty arrays)
  const activeFilters = Object.entries(filters).filter(
    ([_, values]) => Array.isArray(values) && values.length > 0
  ) as [string, any[]][];

  // Don't render if no active filters
  if (activeFilters.length === 0) return null;

  const handleRemoveFilter = (factor: string) => {
    const newFilters = { ...filters };
    delete newFilters[factor];
    setFilters(newFilters);
  };

  const handleClearAll = () => {
    setFilters({});
  };

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-slate-900/50 border-b border-slate-800 overflow-x-auto scrollbar-hide">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-nowrap">
        {activeFilters.map(([factor, values]) => (
          <FilterChip
            key={factor}
            factor={factor}
            values={values}
            factorLabel={columnAliases[factor] || factor}
            valueLabels={valueLabels[factor] || {}}
            onRemove={() => handleRemoveFilter(factor)}
          />
        ))}
      </div>

      {/* Divider and Clear All */}
      <div className="flex-shrink-0 flex items-center gap-2 ml-auto pl-2">
        <div className="h-4 w-px bg-slate-700" />
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors whitespace-nowrap"
        >
          <X size={14} />
          <span className="hidden sm:inline">Clear All</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
