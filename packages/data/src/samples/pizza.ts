import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Pizza Delivery: LSS Training Classic Case
// Story: Delivery time variation analysis for Green Belt training
const generatePizzaData = () => {
  const data: Record<string, unknown>[] = [];
  const stores = ['Store North', 'Store Central', 'Store South'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['Lunch', 'Dinner', 'Late Night'];

  let id = 1;
  for (let week = 0; week < 4; week++) {
    for (const day of days) {
      for (const store of stores) {
        for (const timeSlot of timeSlots) {
          // Store South has higher variation (newer drivers)
          const baseMean = store === 'Store South' ? 35 : 28;
          const std = store === 'Store South' ? 8 : 4;
          // Dinner rush adds time
          const rushPenalty = timeSlot === 'Dinner' ? 5 : timeSlot === 'Late Night' ? -3 : 0;
          const deliveryTime = Math.max(15, generateNormal(baseMean + rushPenalty, std));

          data.push({
            Order_ID: id++,
            Week: week + 1,
            Day: day,
            Store: store,
            Time_Slot: timeSlot,
            Delivery_Time_min: round(deliveryTime),
          });
        }
      }
    }
  }
  return data;
};

export const pizza: SampleDataset = {
  name: 'LSS Training: Pizza Delivery',
  description: 'Classic Green Belt training case - reduce delivery time variation.',
  icon: 'timer',
  urlKey: 'pizza',
  data: generatePizzaData(),
  config: {
    outcome: 'Delivery_Time_min',
    factors: ['Store', 'Time_Slot', 'Day'],
    specs: { target: 30, usl: 45 },
  },
};
