/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * Thin wrapper that connects shared hook to PWA's DataContext via useData().
 */

import { useIsMobile } from '@variscout/ui';
import { useData } from '../context/DataContext';
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
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    setYamazumiMapping,
  };

  return useDataIngestionBase(actions, {
    ...options,
    limits: isMobile ? MOBILE_LIMITS : undefined,
  });
};
