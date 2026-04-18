import React from 'react';

/**
 * Color scheme for FactorSelector component
 */
export interface FactorSelectorColorScheme {
  /** Container classes */
  container: string;
  /** Selected button classes */
  selected: string;
  /** Unselected button classes */
  unselected: string;
  /** Filter indicator border class */
  indicatorBorder: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: FactorSelectorColorScheme = {
  container: 'bg-surface border-edge',
  selected: 'bg-blue-600 text-white shadow-sm',
  unselected: 'text-content hover:bg-surface-secondary',
  indicatorBorder: 'border-surface',
};

export interface FactorSelectorProps {
  factors: string[];
  selected: string;
  onChange: (factor: string) => void;
  hasActiveFilter?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: FactorSelectorColorScheme;
  /** Column aliases for display (shows alias instead of raw column name) */
  columnAliases?: Record<string, string>;
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
  colorScheme = defaultColorScheme,
  columnAliases,
}) => {
  if (factors.length === 0) return null;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div className={`inline-flex ${colorScheme.container} rounded-lg p-0.5 border ${className}`}>
      {factors.map(factor => {
        const isSelected = selected === factor;
        const showIndicator = hasActiveFilter && isSelected;

        return (
          <button
            key={factor}
            onClick={() => onChange(factor)}
            className={`
              ${sizeClasses[size]} font-medium rounded-md transition-all relative
              ${isSelected ? colorScheme.selected : colorScheme.unselected}
            `}
          >
            {columnAliases?.[factor] || factor}
            {showIndicator && (
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ${colorScheme.indicatorBorder ? `border ${colorScheme.indicatorBorder}` : ''}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FactorSelector;
