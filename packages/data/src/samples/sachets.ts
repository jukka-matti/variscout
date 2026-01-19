/**
 * Coffee Sachet Filling - Multi-Channel Process Capability Case Study
 *
 * Scenario: An 8-head sachet filling machine needs performance analysis.
 * Question: Which filling heads are underperforming and need attention?
 *
 * Specs: LSL=9.5g, Target=10g, USL=10.5g (coffee sachets)
 *
 * Data structure: Wide format with each head as a column
 * - 100 fill cycles measured
 * - Head 3 has bias (runs low) - CRITICAL
 * - Head 7 has high variance - WARNING
 * - Other heads perform well
 */

import type { SampleDataset } from '../types';

// Helper to generate random normal distribution
const generateNormal = (mean: number, std: number): number => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
};

// Generate sachet filler data
const generateSachetData = (): Record<string, unknown>[] => {
  const data: Record<string, unknown>[] = [];
  const numCycles = 100;

  // Head characteristics:
  // H1: Good (mean=10.0, std=0.12)
  // H2: Excellent (mean=10.05, std=0.10)
  // H3: Low bias - CRITICAL! (mean=9.7, std=0.15)
  // H4: Good (mean=10.0, std=0.11)
  // H5: Good (mean=9.95, std=0.10)
  // H6: Good (mean=10.0, std=0.12)
  // H7: High variance - WARNING! (mean=10.0, std=0.25)
  // H8: Good (mean=10.02, std=0.11)

  const headConfigs = [
    { mean: 10.0, std: 0.12 }, // H1 - Good
    { mean: 10.05, std: 0.1 }, // H2 - Excellent
    { mean: 9.7, std: 0.15 }, // H3 - CRITICAL (low bias)
    { mean: 10.0, std: 0.11 }, // H4 - Good
    { mean: 9.95, std: 0.1 }, // H5 - Good
    { mean: 10.0, std: 0.12 }, // H6 - Good
    { mean: 10.0, std: 0.25 }, // H7 - WARNING (high variance)
    { mean: 10.02, std: 0.11 }, // H8 - Good
  ];

  for (let i = 0; i < numCycles; i++) {
    const row: Record<string, unknown> = {
      Cycle: i + 1,
      Batch: `B${Math.floor(i / 20) + 1}`,
      Shift: i % 2 === 0 ? 'Day' : 'Night',
    };

    // Generate measurement for each head
    headConfigs.forEach((config, idx) => {
      const value = generateNormal(config.mean, config.std);
      row[`H${idx + 1}`] = Number(value.toFixed(3));
    });

    data.push(row);
  }

  return data;
};

// Channel column names (filling heads)
const channelColumns = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'];

export const sachets: SampleDataset = {
  name: 'Case: Sachet Performance',
  description: '8-head coffee sachet filler - which heads need attention?',
  icon: 'coffee',
  urlKey: 'sachets',
  data: generateSachetData(),
  config: {
    outcome: 'H1', // Default, but will switch to performance mode
    factors: ['Batch', 'Shift'],
    specs: {
      lsl: 9.5,
      target: 10,
      usl: 10.5,
    },
    performanceMode: true,
    channelColumns,
  },
};
