/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Zustand projectStore.
 * Azure supports larger datasets (250K rows vs PWA's 50K) thanks to
 * Transferable ArrayBuffer optimization in the Web Worker pipeline.
 */

import { useIsMobile } from '@variscout/ui';
import { useProjectStore, useInvestigationStore } from '@variscout/stores';
import type { SuspectedCause, CausalLink } from '@variscout/core';
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
    setYamazumiMapping: useProjectStore(s => s.setYamazumiMapping),
    setFindings: useProjectStore(s => s.setFindings),
    setQuestions: useProjectStore(s => s.setQuestions),
    setCategories: useProjectStore(s => s.setCategories),
    setDefectMapping: useProjectStore(s => s.setDefectMapping),
    setSuspectedCauses: (hubs: SuspectedCause[]) =>
      useInvestigationStore.getState().resetHubs(hubs),
    setCausalLinks: (links: CausalLink[]) =>
      useInvestigationStore.getState().loadInvestigationState({ causalLinks: links }),
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
