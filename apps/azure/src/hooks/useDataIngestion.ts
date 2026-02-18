/**
 * useDataIngestion - Azure wrapper for shared data ingestion hook
 *
 * This wrapper adds Azure-specific functionality:
 * - loadSample() for loading built-in sample datasets
 * - Integration with Azure's DataContext via useData()
 */

import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import {
  useDataIngestion as useDataIngestionBase,
  type UseDataIngestionOptions,
} from '@variscout/hooks';
import { validateData } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';

// Azure supports larger datasets than PWA
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
  } = useData();

  // Build actions object for the shared hook
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
  };

  // Use the shared hook for common functionality
  const {
    handleFileUpload,
    handleParetoFileUpload,
    clearParetoFile,
    clearData,
    applyTimeExtraction,
  } = useDataIngestionBase(actions, { ...options, limits: AZURE_LIMITS });

  // Load a built-in sample dataset
  const loadSample = useCallback(
    (sample: SampleDataset) => {
      setRawData(sample.data as any[]);
      setDataFilename(sample.name);
      setOutcome(sample.config.outcome);
      setFactors(sample.config.factors);
      setSpecs(sample.config.specs);
      // Run validation for sample data too
      const report = validateData(sample.data as any[], sample.config.outcome);
      setDataQualityReport(report);
      // Reset Pareto to derived mode
      setParetoMode('derived');
      setSeparateParetoData(null);
      setSeparateParetoFilename(null);
      // Handle performance mode samples
      if (
        sample.config.performanceMode &&
        sample.config.measureColumns &&
        sample.config.measureColumns.length >= 3
      ) {
        setPerformanceMode(true);
        setMeasureColumns(sample.config.measureColumns);
        setMeasureLabel('Channel');
      } else {
        setPerformanceMode(false);
        setMeasureColumns([]);
        setMeasureLabel('Channel');
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      setParetoMode,
      setSeparateParetoData,
      setSeparateParetoFilename,
      setPerformanceMode,
      setMeasureColumns,
      setMeasureLabel,
    ]
  );

  return {
    handleFileUpload,
    handleParetoFileUpload,
    clearParetoFile,
    loadSample,
    clearData,
    applyTimeExtraction,
  };
};
