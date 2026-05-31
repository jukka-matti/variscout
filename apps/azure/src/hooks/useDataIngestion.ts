/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 * Azure supports larger datasets (250K rows vs PWA's 50K) thanks to
 * Transferable ArrayBuffer optimization in the Web Worker pipeline.
 */

import { useIsMobile } from '@variscout/ui';
import {
  useDataIngestion as useDataIngestionBase,
  useStoreDataIngestionActions,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

const AZURE_LIMITS = {
  rowHardLimit: 250_000,
  rowWarningThreshold: 100_000,
};

const AZURE_MOBILE_LIMITS = {
  rowHardLimit: 50_000,
  rowWarningThreshold: 10_000,
};

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const actions = useStoreDataIngestionActions();
  const isMobile = useIsMobile(640);

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? AZURE_MOBILE_LIMITS : AZURE_LIMITS,
  });
};
