/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 */

import {
  useDataIngestion as useDataIngestionBase,
  useStoreDataIngestionActions,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const actions = useStoreDataIngestionActions();

  return useDataIngestionBase(actions, {
    ...options,
  });
};
