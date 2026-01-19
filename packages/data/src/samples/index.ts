// Sample dataset exports
export { journey, journeyBefore, journeyAfter } from './journey';
export { bottleneck } from './bottleneck';
export { hospitalWard } from './hospital-ward';
export { coffee, coffeeDefects } from './coffee';
export { packaging } from './packaging';
export { avocado } from './avocado';
export { cookieWeight } from './cookie-weight';
export { weldDefects } from './weld-defects';
export { callWait } from './call-wait';
export { delivery } from './delivery';
export { sockMystery } from './sock-mystery';
export { mangoExport } from './mango-export';
export { textiles } from './textiles';
export { pizza } from './pizza';
export { sachets } from './sachets';

// Re-export types
export type { SampleDataset, SampleConfig, SpecLimits, GradeDefinition } from '../types';

// Import all for SAMPLES array
import { journey, journeyBefore, journeyAfter } from './journey';
import { bottleneck } from './bottleneck';
import { hospitalWard } from './hospital-ward';
import { coffee, coffeeDefects } from './coffee';
import { packaging } from './packaging';
import { avocado } from './avocado';
import { cookieWeight } from './cookie-weight';
import { weldDefects } from './weld-defects';
import { callWait } from './call-wait';
import { delivery } from './delivery';
import { sockMystery } from './sock-mystery';
import { mangoExport } from './mango-export';
import { textiles } from './textiles';
import { pizza } from './pizza';
import { sachets } from './sachets';
import type { SampleDataset } from '../types';

/**
 * All available sample datasets
 */
export const SAMPLES: SampleDataset[] = [
  // ITC Sector Samples
  mangoExport,
  textiles,
  coffeeDefects,
  // Case Studies
  bottleneck,
  hospitalWard,
  coffee,
  packaging,
  avocado,
  cookieWeight,
  weldDefects,
  callWait,
  delivery,
  sockMystery,
  // Performance Mode (Multi-Channel Analysis)
  sachets,
  // Journey/Training
  journey,
  journeyBefore,
  journeyAfter,
  pizza,
];

/**
 * Map of urlKey to SampleDataset for quick lookup
 */
export const SAMPLES_BY_KEY: Record<string, SampleDataset> = SAMPLES.reduce(
  (acc, sample) => {
    acc[sample.urlKey] = sample;
    return acc;
  },
  {} as Record<string, SampleDataset>
);

/**
 * Get a sample dataset by its URL key
 */
export function getSample(urlKey: string): SampleDataset | undefined {
  return SAMPLES_BY_KEY[urlKey];
}
