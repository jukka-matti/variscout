import type { SampleDataset } from '../types';
import { generateNormal } from '../utils';

// Weld Defects: Manufacturing Quality
// Story: Robot Cell B has 4x defect rate due to fixture misalignment
const generateWeldDefectsData = () => {
  const data: Record<string, unknown>[] = [];
  const cells = ['Cell A', 'Cell B', 'Cell C'];
  const defectTypes = ['Porosity', 'Undercut', 'Spatter', 'Incomplete Fusion', 'Crack'];
  const startDate = new Date('2025-10-01');

  let id = 1;
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue; // Skip weekends

    for (const cell of cells) {
      // Cell B has 4x the defect rate
      const baseRate = cell === 'Cell B' ? 12 : 3;
      const defectCount = Math.max(0, Math.round(generateNormal(baseRate, baseRate * 0.3)));

      // For Cell B, porosity dominates (fixture issue causes gas entrapment)
      const primaryDefect =
        cell === 'Cell B'
          ? 'Porosity'
          : defectTypes[Math.floor(Math.random() * defectTypes.length)];

      data.push({
        Record_ID: id++,
        Date: currentDate.toISOString().split('T')[0],
        Weld_Cell: cell,
        Defect_Count: defectCount,
        Primary_Defect: primaryDefect,
      });
    }
  }
  return data;
};

export const weldDefects: SampleDataset = {
  name: 'Case: Weld Defects',
  description: 'Robot cell analysis - find the fixture problem.',
  icon: 'zap',
  urlKey: 'weld-defects',
  data: generateWeldDefectsData(),
  config: {
    outcome: 'Defect_Count',
    factors: ['Weld_Cell', 'Primary_Defect'],
    specs: { target: 3, usl: 10 },
  },
};
