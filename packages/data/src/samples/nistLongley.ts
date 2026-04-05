import type { SampleDataset } from '../types';

// NIST Longley Dataset — classic numerical regression benchmark
// Source: NIST Statistical Reference Datasets (StRD)
// https://www.itl.nist.gov/div898/strd/lls/data/Longley.shtml
//
// 16 observations, 7 variables (1 response + 6 predictors).
// Certified OLS solution available from NIST for validation.

const rawData: Array<{
  Y: number;
  GNP_Deflator: number;
  GNP: number;
  Unemployed: number;
  Armed_Forces: number;
  Population: number;
  Year: number;
}> = [
  {
    Y: 60323,
    GNP_Deflator: 83.0,
    GNP: 234289,
    Unemployed: 2356,
    Armed_Forces: 1590,
    Population: 107608,
    Year: 1947,
  },
  {
    Y: 61122,
    GNP_Deflator: 88.5,
    GNP: 259426,
    Unemployed: 2325,
    Armed_Forces: 1456,
    Population: 108632,
    Year: 1948,
  },
  {
    Y: 60171,
    GNP_Deflator: 88.2,
    GNP: 258054,
    Unemployed: 3682,
    Armed_Forces: 1616,
    Population: 109773,
    Year: 1949,
  },
  {
    Y: 61187,
    GNP_Deflator: 89.5,
    GNP: 284599,
    Unemployed: 3351,
    Armed_Forces: 1650,
    Population: 110929,
    Year: 1950,
  },
  {
    Y: 63221,
    GNP_Deflator: 96.2,
    GNP: 328975,
    Unemployed: 2099,
    Armed_Forces: 3099,
    Population: 112075,
    Year: 1951,
  },
  {
    Y: 63639,
    GNP_Deflator: 98.1,
    GNP: 346999,
    Unemployed: 1932,
    Armed_Forces: 3594,
    Population: 113270,
    Year: 1952,
  },
  {
    Y: 64989,
    GNP_Deflator: 99.0,
    GNP: 365385,
    Unemployed: 1870,
    Armed_Forces: 3547,
    Population: 115094,
    Year: 1953,
  },
  {
    Y: 63761,
    GNP_Deflator: 100.0,
    GNP: 363112,
    Unemployed: 3578,
    Armed_Forces: 3350,
    Population: 116219,
    Year: 1954,
  },
  {
    Y: 66019,
    GNP_Deflator: 101.2,
    GNP: 397469,
    Unemployed: 2904,
    Armed_Forces: 3048,
    Population: 117388,
    Year: 1955,
  },
  {
    Y: 67857,
    GNP_Deflator: 104.6,
    GNP: 419180,
    Unemployed: 2822,
    Armed_Forces: 2857,
    Population: 118734,
    Year: 1956,
  },
  {
    Y: 68169,
    GNP_Deflator: 108.4,
    GNP: 442769,
    Unemployed: 2936,
    Armed_Forces: 2798,
    Population: 120445,
    Year: 1957,
  },
  {
    Y: 66513,
    GNP_Deflator: 110.8,
    GNP: 444546,
    Unemployed: 4681,
    Armed_Forces: 2637,
    Population: 121950,
    Year: 1958,
  },
  {
    Y: 68655,
    GNP_Deflator: 112.6,
    GNP: 482704,
    Unemployed: 3813,
    Armed_Forces: 2552,
    Population: 123366,
    Year: 1959,
  },
  {
    Y: 69564,
    GNP_Deflator: 114.2,
    GNP: 502601,
    Unemployed: 3931,
    Armed_Forces: 2514,
    Population: 124505,
    Year: 1960,
  },
  {
    Y: 69331,
    GNP_Deflator: 115.7,
    GNP: 518173,
    Unemployed: 4806,
    Armed_Forces: 2572,
    Population: 125368,
    Year: 1961,
  },
  {
    Y: 70551,
    GNP_Deflator: 116.9,
    GNP: 554894,
    Unemployed: 4007,
    Armed_Forces: 2827,
    Population: 127852,
    Year: 1962,
  },
];

export const nistLongley: SampleDataset = {
  name: 'NIST Longley',
  description:
    'NIST Statistical Reference Dataset — 6 continuous predictors, 16 observations. Classic numerical regression benchmark for validating OLS implementations.',
  icon: 'landmark',
  urlKey: 'nist-longley',
  category: 'standard',
  featured: false,
  data: rawData.map(row => ({
    Employment: row.Y,
    GNP_Deflator: row.GNP_Deflator,
    GNP: row.GNP,
    Unemployed: row.Unemployed,
    Armed_Forces: row.Armed_Forces,
    Population: row.Population,
    Year: row.Year,
  })),
  config: {
    outcome: 'Employment',
    factors: ['GNP_Deflator', 'GNP', 'Unemployed', 'Armed_Forces', 'Population', 'Year'],
    specs: {},
  },
};
