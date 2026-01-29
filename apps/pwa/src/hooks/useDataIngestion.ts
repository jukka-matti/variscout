/**
 * useDataIngestion - PWA wrapper for shared data ingestion hook
 *
 * This wrapper adds PWA-specific functionality:
 * - loadSample() for loading built-in sample datasets
 * - Integration with PWA's DataContext via useData()
 */

import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import {
  useDataIngestion as useDataIngestionBase,
  type UseDataIngestionOptions,
} from '@variscout/hooks';
import { validateData } from '@variscout/core';
import { SampleDataset } from '../data/sampleData';

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
  const { handleFileUpload, handleParetoFileUpload, clearParetoFile, clearData } =
    useDataIngestionBase(actions, options);

  // PWA-specific: Load sample dataset
  const loadSample = useCallback(
    (sample: SampleDataset) => {
      setRawData(sample.data);
      setDataFilename(sample.name);
      setOutcome(sample.config.outcome);
      setFactors(sample.config.factors);
      setSpecs(sample.config.specs);
      setGrades(sample.config.grades || []);
      // Run validation for sample data too
      const report = validateData(sample.data, sample.config.outcome);
      setDataQualityReport(report);
      // Reset Pareto to derived mode
      setParetoMode('derived');
      setSeparateParetoData(null);
      setSeparateParetoFilename(null);
      // Handle performance mode samples
      if (sample.config.performanceMode && sample.config.measureColumns) {
        setMeasureColumns(sample.config.measureColumns);
        setPerformanceMode(true);
      } else {
        setMeasureColumns([]);
        setPerformanceMode(false);
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setGrades,
      setDataQualityReport,
      setParetoMode,
      setSeparateParetoData,
      setSeparateParetoFilename,
      setMeasureColumns,
      setPerformanceMode,
    ]
  );

  return {
    handleFileUpload,
    handleParetoFileUpload,
    clearParetoFile,
    loadSample,
    clearData,
  };
};
