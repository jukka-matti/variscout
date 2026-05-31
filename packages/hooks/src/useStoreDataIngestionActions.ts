import type { CausalLink, Hypothesis } from '@variscout/core';
import { useAnalyzeStore, useProjectStore } from '@variscout/stores';
import type { DataIngestionActions } from './useDataIngestion';

export function useStoreDataIngestionActions(): DataIngestionActions {
  return {
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
    setDefectMapping: useProjectStore(s => s.setDefectMapping),
    setFindings: useProjectStore(s => s.setFindings),
    setCategories: useProjectStore(s => s.setCategories),
    setHypotheses: (hubs: Hypothesis[]) => useAnalyzeStore.getState().resetHubs(hubs),
    setCausalLinks: (links: CausalLink[]) =>
      useAnalyzeStore.getState().loadAnalyzeState({ causalLinks: links }),
    setProcessContext: useProjectStore(s => s.setProcessContext),
    getProcessContext: () => useProjectStore.getState().processContext,
    setSubgroupConfig: useProjectStore(s => s.setSubgroupConfig),
    setDisplayOptions: useProjectStore(s => s.setDisplayOptions),
    getDisplayOptions: () => useProjectStore.getState().displayOptions,
  };
}
