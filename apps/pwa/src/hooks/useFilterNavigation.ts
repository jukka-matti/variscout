/**
 * Re-export useFilterNavigation from @variscout/hooks
 * with PWA-specific context wrapper
 */
import {
  useFilterNavigation as useFilterNavigationBase,
  type UseFilterNavigationOptions,
  type UseFilterNavigationReturn,
} from '@variscout/hooks';
import { useData } from '../context/DataContext';

export type { UseFilterNavigationOptions, UseFilterNavigationReturn };

/**
 * Hook for managing filter navigation state
 *
 * Automatically uses the PWA's DataContext.
 * For the context-injection version, use @variscout/hooks directly.
 *
 * @param options - Configuration options
 * @returns Filter navigation state and functions
 */
export function useFilterNavigation(
  options: UseFilterNavigationOptions = {}
): UseFilterNavigationReturn {
  const { filters, setFilters, columnAliases } = useData();

  return useFilterNavigationBase({ filters, setFilters, columnAliases }, options);
}

export default useFilterNavigation;
