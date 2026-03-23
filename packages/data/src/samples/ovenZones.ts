/**
 * Multi-Zone Oven Temperature Control Case Study
 *
 * Scenario: 8-zone industrial baking oven with temperature profile
 * 180°C → 230°C → 180°C (entry → peak → exit)
 *
 * Teaching Points:
 * - Zone 3: High variance issue (Cpk ~0.89) - faulty thermocouple
 * - Zone 6: Centering issue (Cpk ~1.07) - burner fouling, 8°C low
 * - Other zones: Cpk 1.52-2.22 (capable to excellent control)
 * - Demonstrates Pareto principle: Fix 2 of 8 zones to eliminate most issues
 * - Shows Cp vs Cpk distinction (variance vs centering problems)
 *
 * Dataset: 100 measurements, 3 products, 3 line speeds, 3 time shifts
 */

import type { SampleDataset } from '../types';

// Helper to generate normal distribution values
function normalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// Generate 100 measurement rows
function generateOvenData(): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];

  const products = ['Digestive', 'Shortbread', 'Oat'];
  const speeds = ['Fast', 'Normal', 'Slow'];
  const shifts = ['Morning', 'Afternoon', 'Night'];

  // Zone configurations: { mean, stdDev, targetCpk }
  const zoneConfigs = {
    Z1_Entry: { mean: 180.0, stdDev: 1.5 }, // Cpk ~2.22 - Excellent
    Z2: { mean: 200.0, stdDev: 1.8 }, // Cpk ~1.85 - Good
    Z3: { mean: 220.0, stdDev: 4.5 }, // Cpk ~0.89 - High variance issue
    Z4_Peak: { mean: 230.0, stdDev: 2.2 }, // Cpk ~1.52 - Adequate
    Z5_Peak: { mean: 230.0, stdDev: 2.0 }, // Cpk ~1.67 - Good
    Z6: { mean: 212.0, stdDev: 2.5 }, // Cpk ~1.07 - Centering issue (8°C low)
    Z7: { mean: 200.0, stdDev: 1.8 }, // Cpk ~1.85 - Good
    Z8_Exit: { mean: 180.0, stdDev: 1.5 }, // Cpk ~2.22 - Excellent
  };

  for (let i = 1; i <= 100; i++) {
    const row: Record<string, unknown> = {
      Measurement_ID: i,
      Product_Type: products[Math.floor(Math.random() * products.length)],
      Line_Speed: speeds[Math.floor(Math.random() * speeds.length)],
      Time_of_Day: shifts[Math.floor(Math.random() * shifts.length)],
    };

    // Generate temperature measurements for each zone
    for (const [zoneName, config] of Object.entries(zoneConfigs)) {
      row[zoneName] = Number(normalRandom(config.mean, config.stdDev).toFixed(2));
    }

    data.push(row);
  }

  return data;
}

// Measure column names (temperature zones)
const measureColumns = ['Z1_Entry', 'Z2', 'Z3', 'Z4_Peak', 'Z5_Peak', 'Z6', 'Z7', 'Z8_Exit'];

export const ovenZonesData: SampleDataset = {
  name: 'Case: Oven Zones',
  description: '8-zone industrial baking oven - identify zones needing maintenance',
  icon: 'flame',
  urlKey: 'oven-zones',
  category: 'cases',
  featured: false,
  data: generateOvenData(),
  config: {
    outcome: 'Z1_Entry', // Default, but will switch to performance mode
    factors: ['Product_Type', 'Line_Speed', 'Time_of_Day'],
    specs: {
      lsl: 170,
      usl: 190,
      target: 180,
    },
    analysisMode: 'performance' as const,
    measureColumns,
  },
};
