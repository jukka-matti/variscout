/**
 * Re-export useDrillDown from @variscout/hooks
 * with PWA-specific context wrapper
 */
import {
  useDrillDown as useDrillDownBase,
  type UseDrillDownOptions,
  type UseDrillDownReturn,
} from '@variscout/hooks';
import { useData } from '../context/DataContext';

export type { UseDrillDownOptions, UseDrillDownReturn };

/**
 * Hook for managing drill-down navigation state
 *
 * Automatically uses the PWA's DataContext.
 * For the context-injection version, use @variscout/hooks directly.
 *
 * @param options - Configuration options
 * @returns Drill-down state and navigation functions
 */
export function useDrillDown(options: UseDrillDownOptions = {}): UseDrillDownReturn {
  const { filters, setFilters, columnAliases } = useData();

  return useDrillDownBase({ filters, setFilters, columnAliases }, options);
}

export default useDrillDown;
