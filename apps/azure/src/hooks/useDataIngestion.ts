/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to Azure's DataContext via useData().
 * Azure supports larger datasets (250K rows vs PWA's 50K) thanks to
 * Transferable ArrayBuffer optimization in the Web Worker pipeline.
 */

import { useIsMobile } from '@variscout/ui';
import { useData } from '../context/DataContext';
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

  const isMobile = useIsMobile(640);

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? AZURE_MOBILE_LIMITS : AZURE_LIMITS,
  });
};
