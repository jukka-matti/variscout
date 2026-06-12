/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 * Azure supports larger datasets (250K rows vs PWA's 50K) thanks to
 * Transferable ArrayBuffer optimization in the Web Worker pipeline.
 */

import {
  useDataIngestion as useDataIngestionBase,
  useStoreDataIngestionActions,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

const AZURE_LIMITS = {
  rowHardLimit: 250_000,
  rowWarningThreshold: 100_000,
};

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const actions = useStoreDataIngestionActions();

  return useDataIngestionBase(actions, {
    ...options,
    limits: AZURE_LIMITS,
  });
};
