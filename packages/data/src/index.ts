/**
 * @variscout/data - Sample datasets for VariScout demos and case studies
 *
 * This package provides sample datasets used across VariScout applications:
 * - PWA demo data selection
 * - Marketing website case studies
 * - Training materials
 */

// Types
export type { SampleDataset, SampleCategory, SampleInvestigationState, ComputedChartData } from './types';

// Sample datasets
export { SAMPLES, getSample } from './samples';

// Computed data utilities
export { getCachedComputedData } from './computed';
