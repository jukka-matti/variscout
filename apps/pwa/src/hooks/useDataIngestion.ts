/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 */

import { useIsMobile } from '@variscout/ui';
import { useProjectStore } from '@variscout/stores';
import {
  useDataIngestion as useDataIngestionBase,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

const MOBILE_LIMITS = {
  rowHardLimit: 10_000,
  rowWarningThreshold: 2_000,
};

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const isMobile = useIsMobile(640);

  const actions = {
    setRawData: useProjectStore(s => s.setRawData),
    setOutcome: useProjectStore(s => s.setOutcome),
    setFactors: useProjectStore(s => s.setFactors),
    setSpecs: useProjectStore(s => s.setSpecs),
    setFilters: useProjectStore(s => s.setFilters),
    setDataFilename: useProjectStore(s => s.setDataFilename),
    setDataQualityReport: useProjectStore(s => s.setDataQualityReport),
    setParetoMode: useProjectStore(s => s.setParetoMode),
    setSeparateParetoData: useProjectStore(s => s.setSeparateParetoData),
    setSeparateParetoFilename: useProjectStore(s => s.setSeparateParetoFilename),
    setMeasureColumns: useProjectStore(s => s.setMeasureColumns),
    setMeasureLabel: useProjectStore(s => s.setMeasureLabel),
    setAnalysisMode: useProjectStore(s => s.setAnalysisMode),
    setYamazumiMapping: useProjectStore(s => s.setYamazumiMapping),
    setFindings: useProjectStore(s => s.setFindings),
    setQuestions: useProjectStore(s => s.setQuestions),
    setCategories: useProjectStore(s => s.setCategories),
  };

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? MOBILE_LIMITS : undefined,
  });
};
