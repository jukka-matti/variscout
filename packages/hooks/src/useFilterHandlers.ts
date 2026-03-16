import { useCallback } from 'react';

export interface UseFilterHandlersOptions {
  clearFilters: () => void;
  removeFilter: (factor: string) => void;
  updateFilterValues: (factor: string, newValues: (string | number)[]) => void;
}

export interface UseFilterHandlersReturn {
  handleClearAllFilters: () => void;
  handleRemoveFilter: (factor: string) => void;
  handleUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
}

/**
 * Shared filter handler callbacks for Dashboard components.
 * Wraps filter navigation functions with stable useCallback references.
 */
export function useFilterHandlers({
  clearFilters,
  removeFilter,
  updateFilterValues,
}: UseFilterHandlersOptions): UseFilterHandlersReturn {
  const handleClearAllFilters = useCallback(() => clearFilters(), [clearFilters]);

  const handleRemoveFilter = useCallback((factor: string) => removeFilter(factor), [removeFilter]);

  const handleUpdateFilterValues = useCallback(
    (factor: string, newValues: (string | number)[]) => updateFilterValues(factor, newValues),
    [updateFilterValues]
  );

  return { handleClearAllFilters, handleRemoveFilter, handleUpdateFilterValues };
}
