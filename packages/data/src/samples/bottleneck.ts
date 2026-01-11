import type { SampleDataset } from '../types';
import { generateNormal, clamp } from '../utils';

// Bottleneck: Process Step Analysis (ESTIEM Training Case)
// Story: Step 3 was blamed, but Step 2 has 3x the variation
const generateBottleneckData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const shifts = ['Morning', 'Afternoon'];
  const data: Record<string, unknown>[] = [];
  let id = 1;

  for (let step = 1; step <= 5; step++) {
    for (const shift of shifts) {
      for (const day of days) {
        for (let rep = 0; rep < 3; rep++) {
          // Step 2 has 3x the variation (std=10 vs std=2-3 for others)
          const mean = step === 2 ? 40 : step === 3 ? 45 : step === 1 ? 32 : step === 4 ? 34 : 30;
          const std = step === 2 ? 10 : 2;
          const cycleTime = Math.round(generateNormal(mean, std));
          data.push({
            Observation: id++,
            Step: `Step ${step}`,
            Cycle_Time_sec: clamp(cycleTime, 15, 60),
            Shift: shift,
            Day: day,
          });
        }
      }
    }
  }
  return data;
};

export const bottleneck: SampleDataset = {
  name: 'Case: The Bottleneck',
  description: 'Process step analysis - which step is really the bottleneck?',
  icon: 'factory',
  urlKey: 'bottleneck',
  data: generateBottleneckData(),
  config: {
    outcome: 'Cycle_Time_sec',
    factors: ['Step', 'Shift'],
    specs: { target: 40 },
  },
};
