import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Agri-Food: Mango Export Compliance (Common ITC Sector)
// Scenario: Exporting mangoes to EU requires strict weight classes.
const generateMangoData = () => {
  const data: Record<string, unknown>[] = [];

  for (let i = 0; i < 150; i++) {
    const farm =
      i < 50 ? 'Farm A (Smallholder)' : i < 100 ? 'Farm B (Co-op)' : 'Farm C (Commercial)';
    // Farm A has higher variance (less standardized)
    const weight =
      i < 50
        ? generateNormal(320, 25)
        : i < 100
          ? generateNormal(330, 15)
          : generateNormal(325, 10);

    data.push({
      id: i + 1,
      'Fruit Weight (g)': round(weight),
      'Origin Farm': farm,
      Variety: 'Kent',
      'Harvest Date': new Date(2023, 10, 1 + Math.floor(i / 10)).toISOString().split('T')[0],
    });
  }
  return data;
};

export const mangoExport: SampleDataset = {
  name: 'Agri-Food: Mango Export',
  description: 'Weight compliance analysis for fruit export to EU markets.',
  icon: 'apple',
  urlKey: 'mango-export',
  data: generateMangoData(),
  config: {
    outcome: 'Fruit Weight (g)',
    factors: ['Origin Farm', 'Variety'],
    specs: { lsl: 300, usl: 350, target: 325 },
  },
};
