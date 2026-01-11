import type { SampleDataset } from '../types';
import { generateNormal } from '../utils';

// Sock Mystery: Classic Training Case
// Story: Socks keep disappearing. Is it the washer, dryer, or something else?
const generateSockMysteryData = () => {
  const data: Record<string, unknown>[] = [];
  const washers = ['Washer A', 'Washer B'];
  const dryers = ['Dryer 1', 'Dryer 2', 'Dryer 3'];
  const loadSizes = ['Small', 'Medium', 'Large'];

  let id = 1;
  for (let week = 0; week < 12; week++) {
    for (const washer of washers) {
      for (const dryer of dryers) {
        for (const loadSize of loadSizes) {
          // The real cause: Dryer 2 has a gap in the drum seal
          // But students often suspect large loads or Washer B first
          const baseLoss = dryer === 'Dryer 2' ? 2.5 : 0.3;
          // Slight load size effect (red herring)
          const loadEffect = loadSize === 'Large' ? 0.3 : loadSize === 'Small' ? -0.1 : 0;
          const socksLost = Math.max(0, Math.round(generateNormal(baseLoss + loadEffect, 0.8)));

          data.push({
            Load_ID: id++,
            Week: week + 1,
            Washer: washer,
            Dryer: dryer,
            Load_Size: loadSize,
            Socks_Lost: socksLost,
          });
        }
      }
    }
  }
  return data;
};

export const sockMystery: SampleDataset = {
  name: 'Case: Sock Mystery',
  description: 'Classic training case - where do the socks go?',
  icon: 'help-circle',
  urlKey: 'sock-mystery',
  data: generateSockMysteryData(),
  config: {
    outcome: 'Socks_Lost',
    factors: ['Dryer', 'Washer', 'Load_Size'],
    specs: { target: 0, usl: 2 },
  },
};
