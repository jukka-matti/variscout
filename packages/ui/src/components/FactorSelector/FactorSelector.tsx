import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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

/** Shared base props for both variants */
interface FactorSelectorBaseProps {
  factors: string[];
  selected: string;
  onChange: (factor: string) => void;
  hasActiveFilter?: boolean;
  className?: string;
  /** Column aliases for display (shows alias instead of raw column name) */
  columnAliases?: Record<string, string>;
}

/** Tabs variant — pill-button segmented control */
export interface FactorSelectorTabsProps extends FactorSelectorBaseProps {
  variant: 'tabs';
  size?: 'sm' | 'md';
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: FactorSelectorColorScheme;
}

/** Dropdown variant — compact inline dropdown with optional label */
export interface FactorSelectorDropdownProps extends FactorSelectorBaseProps {
  variant: 'dropdown';
  /** Label shown before the trigger, e.g. "Factor" */
  label?: string;
  /** data-testid for the trigger button */
  testId?: string;
}

export type FactorSelectorProps = FactorSelectorTabsProps | FactorSelectorDropdownProps;

// ---------------------------------------------------------------------------
// Tabs variant
// ---------------------------------------------------------------------------

const FactorSelectorTabs: React.FC<FactorSelectorTabsProps> = ({
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

// ---------------------------------------------------------------------------
// Dropdown variant
// ---------------------------------------------------------------------------

const FactorSelectorDropdown: React.FC<FactorSelectorDropdownProps> = ({
  factors,
  selected,
  onChange,
  hasActiveFilter,
  label,
  className = '',
  columnAliases,
  testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (factors.length === 0) return null;

  const displayName = columnAliases?.[selected] || selected;
  const showIndicator = hasActiveFilter;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      {label && (
        <span className="text-xs text-content-muted font-medium whitespace-nowrap">{label}:</span>
      )}
      <button
        data-testid={testId}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="relative flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-surface-tertiary/50 text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors max-w-[140px]"
        title={label ? `${label}: ${displayName}` : displayName}
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown
          size={10}
          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        {showIndicator && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-surface" />
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={label ?? 'Factor'}
          className="absolute top-full left-0 mt-1 z-50 min-w-[120px] bg-surface border border-edge rounded-lg shadow-lg py-1"
        >
          {factors.map(factor => {
            const isSelected = selected === factor;
            const name = columnAliases?.[factor] || factor;
            return (
              <button
                key={factor}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(factor);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-content hover:bg-surface-secondary'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Discriminated-union dispatcher
// ---------------------------------------------------------------------------

const FactorSelector: React.FC<FactorSelectorProps> = props => {
  if (props.variant === 'dropdown') {
    return <FactorSelectorDropdown {...props} />;
  }
  return <FactorSelectorTabs {...props} />;
};

export default FactorSelector;
