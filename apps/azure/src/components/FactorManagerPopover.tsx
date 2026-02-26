import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Settings2, Check } from 'lucide-react';
import { useColumnClassification } from '@variscout/hooks';
import { getMaxCategoryContribution, type DataRow, type FilterAction } from '@variscout/core';

const MAX_FACTORS = 6;

interface FactorManagerPopoverProps {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  onFactorsChange: (newFactors: string[]) => void;
  onFiltersChange: (newFilters: Record<string, (string | number)[]>) => void;
  factorVariations?: Map<string, number>;
  /** Ordered filter drill trail (for cleanup on factor removal) */
  filterStack?: FilterAction[];
  /** Update filter stack when removing factors with active drill entries */
  onFilterStackChange?: (stack: FilterAction[]) => void;
}

const FactorManagerPopover: React.FC<FactorManagerPopoverProps> = ({
  rawData,
  outcome,
  factors,
  filters,
  onFactorsChange,
  onFiltersChange,
  factorVariations,
  filterStack,
  onFilterStackChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFactors, setPendingFactors] = useState<string[]>(factors);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Get categorical columns from data
  const { categorical } = useColumnClassification(rawData, {
    excludeColumn: outcome,
    maxCategoricalUnique: 20,
  });

  // Compute variation contribution for each categorical column
  const columnVariations = useMemo(() => {
    const map = new Map<string, number>();
    if (!outcome || rawData.length === 0) return map;

    for (const col of categorical) {
      // Use provided factorVariations for active factors, otherwise compute
      if (factorVariations?.has(col)) {
        map.set(col, factorVariations.get(col)!);
      } else {
        const contribution = getMaxCategoryContribution(rawData, outcome, col);
        if (contribution !== null) {
          map.set(col, contribution * 100);
        }
      }
    }
    return map;
  }, [categorical, rawData, outcome, factorVariations]);

  // Sort categorical columns: active factors first, then by variation (highest first)
  const sortedCategorical = useMemo(() => {
    return [...categorical].sort((a, b) => {
      const aActive = factors.includes(a) ? 1 : 0;
      const bActive = factors.includes(b) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      const aVar = columnVariations.get(a) ?? 0;
      const bVar = columnVariations.get(b) ?? 0;
      return bVar - aVar;
    });
  }, [categorical, factors, columnVariations]);

  // Sync pendingFactors when factors prop changes
  useEffect(() => {
    setPendingFactors(factors);
  }, [factors]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPendingFactors(factors); // reset on cancel
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, factors]);

  const toggleFactor = (col: string) => {
    setPendingFactors(prev =>
      prev.includes(col)
        ? prev.filter(f => f !== col)
        : prev.length < MAX_FACTORS
          ? [...prev, col]
          : prev
    );
  };

  const handleApply = () => {
    // Find removed factors to clean up their filters and filterStack
    const removedFactors = factors.filter(f => !pendingFactors.includes(f));
    if (removedFactors.length > 0) {
      const cleanedFilters = { ...filters };
      for (const removed of removedFactors) {
        delete cleanedFilters[removed];
      }
      onFiltersChange(cleanedFilters);

      // Also clean filterStack entries for removed factors
      if (filterStack && onFilterStackChange) {
        const removedSet = new Set(removedFactors);
        const cleanedStack = filterStack.filter(
          entry => !entry.factor || !removedSet.has(entry.factor)
        );
        if (cleanedStack.length !== filterStack.length) {
          onFilterStackChange(cleanedStack);
        }
      }
    }

    onFactorsChange(pendingFactors);
    setIsOpen(false);
  };

  const hasChanges = useMemo(() => {
    if (pendingFactors.length !== factors.length) return true;
    return (
      pendingFactors.some((f, i) => f !== factors[i]) ||
      factors.some(f => !pendingFactors.includes(f))
    );
  }, [pendingFactors, factors]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-content-secondary hover:text-content bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-lg transition-colors"
        title="Manage analysis factors"
        aria-label="Manage factors"
      >
        <Settings2 size={14} />
        <span>Factors</span>
        <span className="text-xs text-content-muted">
          ({factors.length}/{MAX_FACTORS})
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-secondary border border-edge rounded-xl shadow-xl shadow-black/30 z-50 overflow-hidden">
          <div className="p-3 border-b border-edge">
            <h3 className="text-sm font-semibold text-content">Manage Factors</h3>
            <p className="text-xs text-content-muted mt-1">
              Select up to {MAX_FACTORS} categorical columns to analyze.
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {sortedCategorical.map(col => {
              const isSelected = pendingFactors.includes(col);
              const isDisabled = !isSelected && pendingFactors.length >= MAX_FACTORS;
              const variationPct = columnVariations.get(col);

              return (
                <button
                  key={col}
                  onClick={() => !isDisabled && toggleFactor(col)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : isDisabled
                        ? 'text-content-muted cursor-not-allowed'
                        : 'text-content-secondary hover:text-content hover:bg-surface-tertiary/50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-edge-secondary'
                    }`}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>
                  <span className="truncate flex-1">{col}</span>
                  {variationPct != null && (
                    <span className="text-xs text-content-muted tabular-nums flex-shrink-0">
                      {variationPct.toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}

            {categorical.length === 0 && (
              <p className="text-xs text-content-muted text-center py-4">
                No categorical columns found in dataset.
              </p>
            )}
          </div>

          <div className="p-3 border-t border-edge flex justify-end gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setPendingFactors(factors);
              }}
              className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactorManagerPopover;
