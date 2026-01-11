import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Call Wait Time: Service Center Analysis
// Story: Queue D (Technical Support) has 3x wait time due to understaffing
const generateCallWaitTimeData = () => {
  const data: Record<string, unknown>[] = [];
  const queues = ['Sales', 'Billing', 'General', 'Technical'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  let id = 1;
  for (let week = 0; week < 4; week++) {
    for (const day of days) {
      for (const hour of hours) {
        for (const queue of queues) {
          // Technical queue has 3x wait time (understaffed)
          const baseMean = queue === 'Technical' ? 12 : 4;
          // Lunch hour (12-13) has longer waits
          const lunchPenalty = hour === 12 || hour === 13 ? 2 : 0;
          const waitTime = Math.max(0.5, generateNormal(baseMean + lunchPenalty, baseMean * 0.4));

          data.push({
            Call_ID: id++,
            Week: week + 1,
            Day: day,
            Hour: hour,
            Queue: queue,
            Wait_Time_min: round(waitTime),
          });
        }
      }
    }
  }
  return data;
};

export const callWait: SampleDataset = {
  name: 'Case: Call Wait Time',
  description: 'Service center analysis - which queue needs help?',
  icon: 'phone',
  urlKey: 'call-wait',
  data: generateCallWaitTimeData(),
  config: {
    outcome: 'Wait_Time_min',
    factors: ['Queue', 'Hour', 'Day'],
    specs: { target: 3, usl: 8 },
  },
};
