/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Azure's DataContext via useData().
 * Azure supports larger datasets (100K rows vs PWA's 50K).
 */

import { useData } from '../context/DataContext';
import {
  useDataIngestion as useDataIngestionBase,
  type UseDataIngestionOptions,
} from '@variscout/hooks';

const AZURE_LIMITS = {
  rowHardLimit: 100_000,
  rowWarningThreshold: 10_000,
};

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

  return useDataIngestionBase(actions, { ...options, limits: AZURE_LIMITS });
};
