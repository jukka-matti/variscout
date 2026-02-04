/**
 * 100-Channel Large Scale Test Dataset
 *
 * Scenario: A massive 100-channel sensor array for monitoring industrial process.
 * Designed to test Performance Mode scalability and visualization quality.
 *
 * Teaching Points:
 * - Scalability: How the UI handles 100+ columns
 * - Ranking: Identifying worst performers among many channels
 * - Variability: Mix of good, marginal, and critical channels
 */

import type { SampleDataset } from '../types';

// Helper to generate normal distribution values
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// Generate measurement rows
function generateLargeScaleData(): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const numChannels = 100;
  const numRows = 100;

  // Pre-generate channel configs to ensure consistency
  const channelConfigs = Array.from({ length: numChannels }, (_, i) => {
    // Channels 1-70: Good (Centered, Low Spread)
    if (i < 70) {
      return { mean: 100.0, stdDev: 1.2 }; // Cp ~2.7, Cpk ~2.7
    }
    // Channels 71-80: Spread Issue (Centered, High Spread)
    if (i < 80) {
      return { mean: 100.0, stdDev: 4.5 }; // Cp ~0.74, Cpk ~0.74 (Visible gap in Boxplot)
    }
    // Channels 81-90: Centering Issue (Off-center, Low Spread)
    if (i < 90) {
      return { mean: 94.0, stdDev: 1.2 }; // Cp ~2.7, Cpk ~1.11 (Cp > Cpk)
    }
    // Channels 91-100: Critical Centering (Highly off-center, Low Spread)
    return { mean: 91.0, stdDev: 1.2 }; // Cp ~2.7, Cpk ~0.27 (Dramatic difference)
  });

  for (let r = 0; r < numRows; r++) {
    const row: Record<string, unknown> = {
      Timestamp: new Date(Date.now() - (numRows - r) * 60000).toISOString(),
      Batch: `B${Math.floor(r / 20) + 1}`,
    };

    channelConfigs.forEach((config, i) => {
      row[`CH${String(i + 1).padStart(3, '0')}`] = Number(
        normalRandom(config.mean, config.stdDev).toFixed(2)
      );
    });

    data.push(row);
  }

  return data;
}

const measureColumns = Array.from({ length: 100 }, (_, i) => `CH${String(i + 1).padStart(3, '0')}`);

export const largeScale: SampleDataset = {
  name: 'Case: The 100-Channel Test',
  description: 'A massive 100-sensor array dataset for testing dashboard scalability.',
  icon: 'factory',
  urlKey: 'large-scale',
  category: 'cases',
  featured: true,
  data: generateLargeScaleData(),
  config: {
    outcome: 'CH001',
    factors: ['Batch'],
    specs: {
      lsl: 90,
      usl: 110,
      target: 100,
    },
    performanceMode: true,
    measureColumns,
  },
};
