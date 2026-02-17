/**
 * @variscout/data - Sample datasets for VariScout demos and case studies
 *
 * This package provides sample datasets used across VariScout applications:
 * - PWA demo data selection
 * - Marketing website case studies
 * - Training materials
 */

// Types
export type {
  SampleDataset,
  SampleCategory,
  SampleConfig,
  SpecLimits,
  ComputedChartData,
  IChartPoint,
  BoxplotGroup,
  ParetoItem,
  PrecomputedStats,
} from './types';

// Sample datasets
export {
  SAMPLES,
  SAMPLES_BY_KEY,
  getSample,
  // Individual samples
  journey,
  journeyBefore,
  journeyAfter,
  bottleneck,
  hospitalWard,
  coffee,
  coffeeDefects,
  packaging,
  avocado,
  cookieWeight,
  weldDefects,
  callWait,
  delivery,
  sockMystery,
  mangoExport,
  textiles,
  pizza,
  sachets,
  ovenZonesData,
} from './samples';

// Computed data utilities
export {
  computeIChartData,
  computeBoxplotData,
  computeParetoData,
  computeStats,
  getComputedData,
  getCachedComputedData,
} from './computed';

// Utilities
export { generateNormal, clamp, round, dateOffset, seedRandom, mulberry32 } from './utils';
