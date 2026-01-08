import React from 'react';

interface FactorSelectorProps {
  factors: string[];
  selected: string;
  onChange: (factor: string) => void;
  hasActiveFilter?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Segmented pill-button control for selecting which factor to display
 */
const FactorSelector: React.FC<FactorSelectorProps> = ({
  factors,
  selected,
  onChange,
  hasActiveFilter = false,
  size = 'sm',
}) => {
  if (factors.length === 0) return null;

  const baseClasses =
    size === 'md'
      ? 'px-3 py-1.5 text-sm font-medium rounded-md'
      : 'px-2 py-1 text-xs font-medium rounded';

  return (
    <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-700/50">
      {factors.map(factor => {
        const isSelected = factor === selected;
        return (
          <button
            key={factor}
            onClick={() => onChange(factor)}
            className={`
              ${baseClasses}
              transition-all relative
              ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }
            `}
          >
            {factor}
            {/* Amber indicator when filter is active on this factor */}
            {hasActiveFilter && isSelected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FactorSelector;
