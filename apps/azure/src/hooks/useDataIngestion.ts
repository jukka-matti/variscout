/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * This wrapper integrates the shared hook with Azure's DataContext.
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
    setGrades,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
  } = useData();

  // Build actions object for the shared hook
  const actions = {
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setGrades,
    setFilters,
    setDataFilename,
    setDataQualityReport,
    setParetoMode,
    setSeparateParetoData,
    setSeparateParetoFilename,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
  };

  // Use the shared hook for common functionality
  return useDataIngestionBase(actions, options);
};
