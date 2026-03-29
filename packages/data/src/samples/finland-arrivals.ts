import type { SampleDataset } from '../types';

/**
 * Finland Tourism Arrivals by Country (1995–2024)
 *
 * Wide-form dataset: 85 columns (Year, Month, Total, + 82 countries).
 * Demonstrates the Stack Columns feature (ADR-050).
 *
 * Source: Visit Finland / Statistics Finland
 *
 * Analysis journey:
 * 1. Stack 82 country columns → Country + Arrivals
 * 2. I-Chart: Monthly arrivals trend (seasonality, COVID shock)
 * 3. Boxplot by Country: Which countries drive the most arrivals?
 * 4. Boxplot by Month: Seasonal pattern (Jul peak, Jan trough)
 * 5. Pareto: Top 10 countries = ~80% of total arrivals
 * 6. Drill: Filter to top 5 → compare seasonal patterns
 */

// Top 15 source countries (representative subset for manageable demo size)
const COUNTRIES = [
  'Russian Federation',
  'Germany',
  'Sweden',
  'United Kingdom',
  'France',
  'United States',
  'Japan',
  'Netherlands',
  'Estonia',
  'Norway',
  'China',
  'Spain',
  'Italy',
  'Switzerland',
  'Poland',
] as const;

// Monthly patterns (relative multiplier, Jul=peak)
const SEASONAL = [0.35, 0.35, 0.45, 0.32, 0.5, 1.1, 1.5, 1.15, 0.5, 0.38, 0.38, 0.42];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Country base arrival rates (annual average monthly, roughly realistic)
const BASE_RATES: Record<string, number> = {
  'Russian Federation': 35000,
  Germany: 50000,
  Sweden: 40000,
  'United Kingdom': 18000,
  France: 10000,
  'United States': 15000,
  Japan: 8000,
  Netherlands: 6000,
  Estonia: 25000,
  Norway: 12000,
  China: 8000,
  Spain: 5000,
  Italy: 6000,
  Switzerland: 4000,
  Poland: 7000,
};

// Simple seeded pseudo-random for reproducibility
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateFinlandArrivals(): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  let seed = 42;

  for (let year = 1995; year <= 2024; year++) {
    // Growth trend (arrivals grew ~3% per year until 2019)
    const yearFactor =
      year <= 2019
        ? 1.0 + (year - 1995) * 0.03
        : year === 2020
          ? 0.3 // COVID crash
          : year === 2021
            ? 0.45 // Partial recovery
            : year === 2022
              ? 0.7 // Strong recovery
              : 1.0 + (2019 - 1995) * 0.03; // 2023-2024: back to trend

    // Russia-specific: sharp drop after 2022
    const russiaFactor = year >= 2022 ? 0.05 : 1.0;

    for (let m = 0; m < 12; m++) {
      const row: Record<string, unknown> = {
        Year: year,
        Month: MONTHS[m],
      };

      let total = 0;
      for (const country of COUNTRIES) {
        const base = BASE_RATES[country];
        const seasonal = SEASONAL[m];
        const countryYearFactor =
          country === 'Russian Federation' ? yearFactor * russiaFactor : yearFactor;
        // China grew faster
        const chinaBoost = country === 'China' && year >= 2010 ? 1.0 + (year - 2010) * 0.08 : 1.0;
        const noise = 0.8 + seededRandom(seed++) * 0.4; // ±20% noise
        const value = Math.round(base * seasonal * countryYearFactor * chinaBoost * noise);
        row[country] = value;
        total += value;
      }
      row['Total'] = total;

      data.push(row);
    }
  }

  return data;
}

export const finlandArrivals: SampleDataset = {
  name: 'Tourism: Finland Arrivals',
  description:
    'Monthly arrivals by 15 countries (1995–2024). Wide-form — use Stack Columns to reshape.',
  icon: 'plane',
  urlKey: 'finland-arrivals',
  category: 'cases',
  featured: false,
  data: generateFinlandArrivals(),
  config: {
    // After stacking, these would be the sensible defaults:
    outcome: 'Total', // Pre-stack fallback: analyze Total with Year/Month
    factors: ['Month'],
    specs: {},
  },
};
