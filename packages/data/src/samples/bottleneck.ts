import type { SampleDataset } from '../types';
import { createNormalGenerator, clamp } from '../utils';

// Bottleneck: Process Step Analysis (ESTIEM Training Case)
// Story: Step 3 was blamed, but Step 2 has 3x the variation
const generateBottleneckData = () => {
  const normal = createNormalGenerator(1201);
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
          const cycleTime = Math.round(normal(mean, std));
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
  category: 'cases',
  featured: true,
  data: generateBottleneckData(),
  config: {
    outcome: 'Cycle_Time_sec',
    factors: ['Step', 'Shift'],
    specs: { target: 40 },
    processMap: {
      version: 1,
      ctsColumn: 'Cycle_Time_sec',
      nodes: [
        { id: 'step-1', name: 'Step 1', order: 0, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-2', name: 'Step 2', order: 1, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-3', name: 'Step 3', order: 2, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-4', name: 'Step 4', order: 3, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-5', name: 'Step 5', order: 4, ctqColumn: 'Cycle_Time_sec' },
      ],
      tributaries: [{ id: 'trib-shift', stepId: 'step-2', column: 'Shift', role: 'shift' }],
      subgroupAxes: [],
      hunches: [
        {
          id: 'h-step2',
          text: 'Step 2 is the constraint — widest spread',
          tributaryId: 'trib-shift',
        },
      ],
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    },
  },
};
