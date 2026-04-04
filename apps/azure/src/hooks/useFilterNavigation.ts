/**
 * Re-export useFilterNavigation from @variscout/hooks
 * with Azure-specific store-backed wrapper
 */
import {
  useFilterNavigation as useFilterNavigationBase,
  type UseFilterNavigationOptions,
  type UseFilterNavigationReturn,
} from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

export type { UseFilterNavigationOptions, UseFilterNavigationReturn };

/**
 * Hook for managing filter navigation state
 *
 * Reads from Zustand stores instead of DataContext.
 * Passes external filterStack for project persistence (breadcrumbs survive save/reload).
 * For the context-injection version, use @variscout/hooks directly.
 *
 * @param options - Configuration options
 * @returns Filter navigation state and functions
 */
export function useFilterNavigation(
  options: UseFilterNavigationOptions = {}
): UseFilterNavigationReturn {
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const filterStack = useProjectStore(s => s.filterStack);
  const setFilterStack = useProjectStore(s => s.setFilterStack);

  return useFilterNavigationBase(
    { filters, setFilters, columnAliases },
    {
      ...options,
      externalFilterStack: filterStack,
      externalSetFilterStack: setFilterStack,
    }
  );
}

export default useFilterNavigation;
