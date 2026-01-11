import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Grade colors (matching @variscout/ui for coffee grading)
const gradeColors = {
  specialty: '#22c55e', // green-500 - highest quality
  premium: '#eab308', // yellow-500 - good quality
  exchange: '#f97316', // orange-500 - acceptable
  offGrade: '#ef4444', // red-500 - below standard
};

// Coffee Moisture: Drying Bed Comparison (Africa Case)
// Story: Bed C consistently fails export spec (10-12% moisture)
const generateCoffeeMoistureData = () => {
  const data: Record<string, unknown>[] = [];
  const beds = ['Bed A', 'Bed B', 'Bed C'];

  for (let i = 0; i < 30; i++) {
    const bedIndex = Math.floor(i / 10);
    const bed = beds[bedIndex];
    // Beds A and B are in spec (10-12%), Bed C runs high (12-14%)
    const mean = bedIndex === 2 ? 13.2 : 11.0;
    const std = bedIndex === 2 ? 0.5 : 0.3;
    const moisture = generateNormal(mean, std);

    data.push({
      Batch_ID: i + 1,
      Drying_Bed: bed,
      Moisture_pct: round(moisture),
    });
  }
  return data;
};

// Coffee Quality: Defect Counts (ITC Sector)
// Scenario: Counting total defects per 300g sample.
const generateCoffeeDefectsData = () => {
  const data: Record<string, unknown>[] = [];

  for (let i = 0; i < 150; i++) {
    const coop = i < 50 ? 'Coop North' : i < 100 ? 'Coop Central' : 'Coop South';
    // North is high quality (low defects), South is struggling
    const meanDefects = i < 50 ? 3 : i < 100 ? 7 : 20;
    const defects = Math.max(0, Math.round(generateNormal(meanDefects, i < 100 ? 2 : 8)));

    data.push({
      id: i + 1,
      'Total Defects (per 300g)': defects,
      Cooperative: coop,
      'Processing Method': i % 2 === 0 ? 'Washed' : 'Natural',
      Date: new Date(2023, 11, 1 + Math.floor(i / 5)).toISOString().split('T')[0],
    });
  }
  return data;
};

export const coffee: SampleDataset = {
  name: 'Case: Coffee Moisture',
  description: 'Drying bed comparison - which bed keeps failing export spec?',
  icon: 'coffee',
  urlKey: 'coffee',
  data: generateCoffeeMoistureData(),
  config: {
    outcome: 'Moisture_pct',
    factors: ['Drying_Bed'],
    specs: { lsl: 10, usl: 12, target: 11 },
  },
};

export const coffeeDefects: SampleDataset = {
  name: 'Coffee: Defect Analysis',
  description: 'Defect counts per 300g sample (Specialty vs Off-Grade detection).',
  icon: 'coffee',
  urlKey: 'coffee-defects',
  data: generateCoffeeDefectsData(),
  config: {
    outcome: 'Total Defects (per 300g)',
    factors: ['Cooperative', 'Processing Method'],
    specs: { target: 0 },
    grades: [
      { max: 5, label: 'Specialty', color: gradeColors.specialty },
      { max: 8, label: 'Premium', color: gradeColors.premium },
      { max: 23, label: 'Exchange', color: gradeColors.exchange },
      { max: 999, label: 'Off-Grade', color: gradeColors.offGrade },
    ],
  },
};
