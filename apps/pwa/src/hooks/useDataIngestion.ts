/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 */

import { useIsMobile } from '@variscout/ui';
import {
  useDataIngestion as useDataIngestionBase,
  useStoreDataIngestionActions,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

const MOBILE_LIMITS = {
  rowHardLimit: 10_000,
  rowWarningThreshold: 2_000,
};

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const isMobile = useIsMobile(640);
  const actions = useStoreDataIngestionActions();

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? MOBILE_LIMITS : undefined,
  });
};
