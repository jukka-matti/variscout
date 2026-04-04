/**
 * Re-export useFilterNavigation from @variscout/hooks
 * with PWA-specific store-backed wrapper
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

  return useFilterNavigationBase({ filters, setFilters, columnAliases }, options);
}

export default useFilterNavigation;
