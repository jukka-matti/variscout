import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Textiles: Cotton Fabric Strength (Common ITC Sector)
// Scenario: Testing tensile strength of woven cotton for garment manufacturing.
const generateTextileData = () => {
  const data: Record<string, unknown>[] = [];

  for (let i = 0; i < 150; i++) {
    const loom = i < 75 ? 'Loom #101 (Vintage)' : 'Loom #205 (Modern)';
    // Vintage loom has lower average strength
    const strength = i < 75 ? generateNormal(42, 3) : generateNormal(48, 1.5);

    data.push({
      id: i + 1,
      'Tensile Strength (N)': round(strength),
      'Loom ID': loom,
      Batch: `B-${Math.floor(i / 20)}`,
      Operator: i % 3 === 0 ? 'Op_X' : i % 3 === 1 ? 'Op_Y' : 'Op_Z',
    });
  }
  return data;
};

export const textiles: SampleDataset = {
  name: 'Textiles: Fabric Strength',
  description: 'Quality control for cotton tensile strength in garment production.',
  icon: 'shirt',
  urlKey: 'textiles-strength',
  data: generateTextileData(),
  config: {
    outcome: 'Tensile Strength (N)',
    factors: ['Loom ID', 'Operator'],
    specs: { lsl: 40, target: 45 },
  },
};
