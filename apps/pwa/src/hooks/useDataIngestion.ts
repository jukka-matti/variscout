/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to PWA's DataContext via useData().
 */

import { useData } from '../context/DataContext';
import {
  useDataIngestion as useDataIngestionBase,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

export const useDataIngestion = (options?: UseDataIngestionOptions) => {
  const {
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    setYamazumiMapping,
  } = useData();

  const actions = {
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    setYamazumiMapping,
  };

  return useDataIngestionBase(actions, options);
};
