/**
 * Re-export useFilterNavigation from @variscout/hooks
 * with Azure-specific context wrapper
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
 * Automatically uses the Azure app's DataContext.
 * Passes external filterStack for project persistence (breadcrumbs survive save/reload).
 * For the context-injection version, use @variscout/hooks directly.
 *
 * @param options - Configuration options
 * @returns Filter navigation state and functions
 */
export function useFilterNavigation(
  options: UseFilterNavigationOptions = {}
): UseFilterNavigationReturn {
  const { filters, setFilters, columnAliases, filterStack, setFilterStack } = useData();

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
