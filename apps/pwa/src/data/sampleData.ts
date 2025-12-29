export interface SampleDataset {
  name: string;
  description: string;
  icon: string;
  data: any[];
  config: {
    outcome: string;
    factors: string[];
    specs: { usl?: number; lsl?: number; target?: number };
    grades?: { max: number; label: string; color: string }[];
  };
}

// Helper to generate random normal distribution
const generateNormal = (mean: number, std: number) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
};

// 1. Agri-Food: Mango Export Compliance (Common ITC Sector)
// Scenario: Exporting mangoes to EU requires strict weight classes.
const mangoData = Array.from({ length: 150 }, (_, i) => {
  const farm = i < 50 ? 'Farm A (Smallholder)' : i < 100 ? 'Farm B (Co-op)' : 'Farm C (Commercial)';
  // Farm A has higher variance (less standardized)
  const weight =
    i < 50 ? generateNormal(320, 25) : i < 100 ? generateNormal(330, 15) : generateNormal(325, 10);
  return {
    id: i + 1,
    'Fruit Weight (g)': Number(weight.toFixed(1)),
    'Origin Farm': farm,
    Variety: 'Kent',
    'Harvest Date': new Date(2023, 10, 1 + Math.floor(i / 10)).toISOString().split('T')[0],
  };
});

// 2. Textiles: Cotton Fabric Strength (Common ITC Sector)
// Scenario: Testing tensile strength of woven cotton for garment manufacturing.
const textileData = Array.from({ length: 150 }, (_, i) => {
  const loom = i < 75 ? 'Loom #101 (Vintage)' : 'Loom #205 (Modern)';
  // Vintage loom has lower average strength
  const strength = i < 75 ? generateNormal(42, 3) : generateNormal(48, 1.5);
  return {
    id: i + 1,
    'Tensile Strength (N)': Number(strength.toFixed(1)),
    'Loom ID': loom,
    Batch: `B-${Math.floor(i / 20)}`,
    Operator: i % 3 === 0 ? 'Op_X' : i % 3 === 1 ? 'Op_Y' : 'Op_Z',
  };
});

// 3. Coffee Quality: Defect Counts (ITC Sector)
// Scenario: Counting total defects per 300g sample.
// Spec: < 5 is Specialty, < 8 is Premium, < 23 is Exchange, > 23 is Off-Grade.
// For Lite version with single USL, we set USL = 23 (Exchange vs Off-Grade boundary)
const coffeeData = Array.from({ length: 150 }, (_, i) => {
  const coop = i < 50 ? 'Coop North' : i < 100 ? 'Coop Central' : 'Coop South';
  // North is high quality (low defects), South is struggling
  const meanDefects = i < 50 ? 3 : i < 100 ? 7 : 20;
  const defects = Math.max(0, Math.round(generateNormal(meanDefects, i < 100 ? 2 : 8)));

  return {
    id: i + 1,
    'Total Defects (per 300g)': defects,
    Cooperative: coop,
    'Processing Method': i % 2 === 0 ? 'Washed' : 'Natural',
    Date: new Date(2023, 11, 1 + Math.floor(i / 5)).toISOString().split('T')[0],
  };
});

export const SAMPLES: SampleDataset[] = [
  {
    name: 'Agri-Food: Mango Export',
    description: 'Weight compliance analysis for fruit export to EU markets.',
    icon: 'apple',
    data: mangoData,
    config: {
      outcome: 'Fruit Weight (g)',
      factors: ['Origin Farm', 'Variety'],
      specs: { lsl: 300, usl: 350, target: 325 },
    },
  },
  {
    name: 'Textiles: Fabric Strength',
    description: 'Quality control for cotton tensile strength in garment production.',
    icon: 'shirt',
    data: textileData,
    config: {
      outcome: 'Tensile Strength (N)',
      factors: ['Loom ID', 'Operator'],
      specs: { lsl: 40, target: 45 },
    },
  },
  {
    name: 'Coffee: Defect Analysis',
    description: 'Defect counts per 300g sample (Specialty vs Off-Grade detection).',
    icon: 'coffee',
    data: coffeeData,
    config: {
      outcome: 'Total Defects (per 300g)',
      factors: ['Cooperative', 'Processing Method'],
      specs: { target: 0 },
      grades: [
        { max: 5, label: 'Specialty', color: '#22c55e' }, // Green
        { max: 8, label: 'Premium', color: '#eab308' }, // Yellow
        { max: 23, label: 'Exchange', color: '#f97316' }, // Orange
        { max: 999, label: 'Off-Grade', color: '#ef4444' }, // Red
      ],
    },
  },
];
