import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Cookie Weight: Manufacturing SPC Classic
// Story: Baker's dozen cookies must meet weight spec. Oven 2 runs hot.
const generateCookieWeightData = () => {
  const data: Record<string, unknown>[] = [];
  const ovens = ['Oven 1', 'Oven 2', 'Oven 3'];
  const shifts = ['Morning', 'Afternoon', 'Night'];
  const startDate = new Date('2025-11-01');

  let id = 1;
  for (let day = 0; day < 20; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0) continue; // Skip Sundays

    for (const shift of shifts) {
      for (const oven of ovens) {
        for (let batch = 0; batch < 3; batch++) {
          // Oven 2 runs slightly heavy (mean 32g vs 30g target)
          const mean = oven === 'Oven 2' ? 32 : 30;
          // Night shift has more variation (tired operators)
          const std = shift === 'Night' ? 2.5 : 1.5;
          const weight = generateNormal(mean, std);

          data.push({
            Sample_ID: id++,
            Date: currentDate.toISOString().split('T')[0],
            Shift: shift,
            Oven: oven,
            Cookie_Weight_g: round(weight),
          });
        }
      }
    }
  }
  return data;
};

export const cookieWeight: SampleDataset = {
  name: 'Case: Cookie Weight',
  description: 'Classic SPC case - which oven is causing weight variation?',
  icon: 'cookie',
  urlKey: 'cookie-weight',
  data: generateCookieWeightData(),
  config: {
    outcome: 'Cookie_Weight_g',
    factors: ['Oven', 'Shift'],
    specs: { lsl: 27, usl: 33, target: 30 },
  },
};
