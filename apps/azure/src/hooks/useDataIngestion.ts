/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 * Azure supports larger datasets (250K rows vs PWA's 50K) thanks to
 * Transferable ArrayBuffer optimization in the Web Worker pipeline.
 */

import { useIsMobile } from '@variscout/ui';
import { useProjectStore, useAnalyzeStore } from '@variscout/stores';
import type { Hypothesis, CausalLink } from '@variscout/core';
import {
  useDataIngestion as useDataIngestionBase,
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
    setFindings: useProjectStore(s => s.setFindings),
    setCategories: useProjectStore(s => s.setCategories),
    setDefectMapping: useProjectStore(s => s.setDefectMapping),
    setHypotheses: (hubs: Hypothesis[]) => useAnalyzeStore.getState().resetHubs(hubs),
    setCausalLinks: (links: CausalLink[]) =>
      useAnalyzeStore.getState().loadAnalyzeState({ causalLinks: links }),
    setProcessContext: useProjectStore(s => s.setProcessContext),
    getProcessContext: () => useProjectStore.getState().processContext,
    setSubgroupConfig: useProjectStore(s => s.setSubgroupConfig),
    setDisplayOptions: useProjectStore(s => s.setDisplayOptions),
    getDisplayOptions: () => useProjectStore.getState().displayOptions,
  };

  const isMobile = useIsMobile(640);

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? AZURE_MOBILE_LIMITS : AZURE_LIMITS,
  });
};
