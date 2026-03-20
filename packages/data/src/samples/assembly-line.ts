import type { SampleDataset } from '../types';
import { seedRandom, generateNormal, clamp, round } from '../utils';

/**
 * Electronics PCB Assembly Line — Yamazumi (Time Study) analysis.
 *
 * 8 process steps, each with multiple activities classified by type
 * (VA / NVA-Required / Waste / Wait). Key insight: Testing has high
 * total time but low waste; Wave Solder has moderate total but ~40%
 * waste from equipment jams. Product B has more waste in Wave Solder.
 */

interface ActivityTemplate {
  activity: string;
  type: 'VA' | 'NVA-Required' | 'Waste' | 'Wait';
  baseCycleTime: number;
  stdDev: number;
  reason?: string;
  /** If set, applies only to this product. Otherwise both. */
  productOnly?: 'Product A' | 'Product B';
  /** Extra waste rows for Product B in Wave Solder */
  productBExtra?: { baseCycleTime: number; stdDev: number };
}

interface StepTemplate {
  step: string;
  activities: ActivityTemplate[];
  repsPerProduct: number;
}

const STEPS: StepTemplate[] = [
  {
    step: 'Pick',
    repsPerProduct: 4,
    activities: [
      { activity: 'Component retrieval', type: 'VA', baseCycleTime: 8, stdDev: 1.2 },
      { activity: 'Bin search', type: 'NVA-Required', baseCycleTime: 5, stdDev: 1.5 },
      {
        activity: 'Walking to bin',
        type: 'Waste',
        baseCycleTime: 4,
        stdDev: 1.0,
        reason: 'Poor layout',
      },
      {
        activity: 'Waiting for feeder',
        type: 'Wait',
        baseCycleTime: 3,
        stdDev: 1.8,
        reason: 'Waiting for material',
      },
    ],
  },
  {
    step: 'Place',
    repsPerProduct: 4,
    activities: [
      { activity: 'Component alignment', type: 'VA', baseCycleTime: 12, stdDev: 1.5 },
      { activity: 'Visual check', type: 'NVA-Required', baseCycleTime: 4, stdDev: 0.8 },
      {
        activity: 'Repositioning',
        type: 'Waste',
        baseCycleTime: 3,
        stdDev: 1.2,
        reason: 'Unnecessary motion',
      },
    ],
  },
  {
    step: 'Solder',
    repsPerProduct: 3,
    activities: [
      { activity: 'Reflow soldering', type: 'VA', baseCycleTime: 18, stdDev: 2.0 },
      { activity: 'Temperature logging', type: 'NVA-Required', baseCycleTime: 3, stdDev: 0.5 },
      { activity: 'Flux application', type: 'VA', baseCycleTime: 6, stdDev: 1.0 },
    ],
  },
  {
    step: 'Wave Solder',
    repsPerProduct: 4,
    activities: [
      { activity: 'Through-hole soldering', type: 'VA', baseCycleTime: 15, stdDev: 2.5 },
      { activity: 'Board staging', type: 'NVA-Required', baseCycleTime: 5, stdDev: 1.0 },
      {
        activity: 'Clearing jam',
        type: 'Waste',
        baseCycleTime: 12,
        stdDev: 4.0,
        reason: 'Equipment jam',
        productBExtra: { baseCycleTime: 18, stdDev: 5.0 },
      },
      {
        activity: 'Rework defective joint',
        type: 'Waste',
        baseCycleTime: 10,
        stdDev: 3.0,
        reason: 'Rework',
      },
      {
        activity: 'Waiting for conveyor',
        type: 'Wait',
        baseCycleTime: 6,
        stdDev: 2.5,
        reason: 'Waiting for material',
      },
    ],
  },
  {
    step: 'Inspect',
    repsPerProduct: 3,
    activities: [
      { activity: 'AOI scan', type: 'VA', baseCycleTime: 10, stdDev: 1.0 },
      { activity: 'Manual verification', type: 'NVA-Required', baseCycleTime: 8, stdDev: 1.5 },
      {
        activity: 'Re-scan after false alarm',
        type: 'Waste',
        baseCycleTime: 5,
        stdDev: 2.0,
        reason: 'Rework',
      },
    ],
  },
  {
    step: 'Test',
    repsPerProduct: 4,
    activities: [
      { activity: 'Functional test', type: 'VA', baseCycleTime: 25, stdDev: 3.0 },
      { activity: 'Test fixture setup', type: 'NVA-Required', baseCycleTime: 10, stdDev: 2.0 },
      { activity: 'Test log upload', type: 'NVA-Required', baseCycleTime: 4, stdDev: 0.8 },
      {
        activity: 'Waiting for test station',
        type: 'Wait',
        baseCycleTime: 6,
        stdDev: 3.0,
        reason: 'Waiting for material',
      },
    ],
  },
  {
    step: 'Clean',
    repsPerProduct: 4,
    activities: [
      { activity: 'Ultrasonic cleaning', type: 'VA', baseCycleTime: 14, stdDev: 1.5 },
      { activity: 'Drying cycle', type: 'NVA-Required', baseCycleTime: 8, stdDev: 1.0 },
      {
        activity: 'Moving boards between baths',
        type: 'Waste',
        baseCycleTime: 3,
        stdDev: 0.8,
        reason: 'Unnecessary motion',
      },
    ],
  },
  {
    step: 'Pack',
    repsPerProduct: 4,
    activities: [
      { activity: 'ESD packaging', type: 'VA', baseCycleTime: 10, stdDev: 1.5 },
      { activity: 'Label printing', type: 'NVA-Required', baseCycleTime: 4, stdDev: 0.6 },
      {
        activity: 'Box search',
        type: 'Waste',
        baseCycleTime: 3,
        stdDev: 1.5,
        reason: 'Poor layout',
      },
      {
        activity: 'Waiting for label printer',
        type: 'Wait',
        baseCycleTime: 2,
        stdDev: 1.0,
        reason: 'Waiting for material',
      },
    ],
  },
];

const generateAssemblyLineData = (): Record<string, unknown>[] => {
  seedRandom(2026);
  const data: Record<string, unknown>[] = [];
  const products: Array<'Product A' | 'Product B'> = ['Product A', 'Product B'];

  for (const stepTemplate of STEPS) {
    for (const product of products) {
      const reps = stepTemplate.repsPerProduct;
      for (let r = 0; r < reps; r++) {
        for (const act of stepTemplate.activities) {
          // Skip if activity is restricted to the other product
          if (act.productOnly && act.productOnly !== product) continue;

          // Product B gets worse waste times in Wave Solder
          const isProductBWaveSolderWaste = product === 'Product B' && act.productBExtra;

          const mean = isProductBWaveSolderWaste
            ? act.productBExtra!.baseCycleTime
            : act.baseCycleTime;
          const std = isProductBWaveSolderWaste ? act.productBExtra!.stdDev : act.stdDev;

          const cycleTime = round(clamp(generateNormal(mean, std), 1, 80), 1);

          data.push({
            Step: stepTemplate.step,
            Activity: act.activity,
            Activity_Type: act.type,
            Cycle_Time: cycleTime,
            Product: product,
            Reason: act.reason ?? '',
          });
        }
      }
    }
  }

  return data;
};

export const assemblyLine: SampleDataset = {
  name: 'Case: PCB Assembly Line',
  description: 'Electronics assembly time study — where is the waste hiding in 8 process steps?',
  icon: 'cpu',
  urlKey: 'assembly-line',
  category: 'cases',
  featured: false,
  data: generateAssemblyLineData(),
  config: {
    outcome: 'Cycle_Time',
    factors: ['Step', 'Activity_Type', 'Product'],
    specs: {},
  },
};
