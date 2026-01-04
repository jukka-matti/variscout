import React from 'react';

interface FactorSelectorProps {
  factors: string[];
  selected: string;
  onChange: (factor: string) => void;
  hasActiveFilter?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Segmented control for factor selection
 * Modern pill-button style with filter indicator
 */
const FactorSelector: React.FC<FactorSelectorProps> = ({
  factors,
  selected,
  onChange,
  hasActiveFilter,
  size = 'sm',
  className = '',
}) => {
  if (factors.length === 0) return null;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div
      className={`inline-flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 ${className}`}
    >
      {factors.map(factor => {
        const isSelected = selected === factor;
        const showIndicator = hasActiveFilter && isSelected;

        return (
          <button
            key={factor}
            onClick={() => onChange(factor)}
            className={`
              ${sizeClasses[size]} font-medium rounded-md transition-all relative
              ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }
            `}
          >
            {factor}
            {showIndicator && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-slate-900" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FactorSelector;
