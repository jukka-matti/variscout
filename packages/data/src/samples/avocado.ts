import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Avocado Coating: Regression Analysis (Week 12 Case)
// Story: More coating = longer shelf life, but operator variation matters
const generateAvocadoCoatingData = () => {
  const data: Record<string, unknown>[] = [];
  const coatingLevels = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const processes = ['Spray', 'Dip'];
  const materials = ['Carnauba', 'Polyethylene'];

  let id = 1;
  for (const process of processes) {
    for (const material of materials) {
      for (const coating of coatingLevels) {
        for (let rep = 0; rep < 5; rep++) {
          // Shelf life increases with coating (regression relationship)
          // Base: 8 days + 3 days per ml/kg coating
          const baseShelfLife = 8 + coating * 3;
          // Dip process adds ~2 days, Polyethylene adds ~1 day
          const processBonus = process === 'Dip' ? 2 : 0;
          const materialBonus = material === 'Polyethylene' ? 1 : 0;
          const shelfLife = generateNormal(baseShelfLife + processBonus + materialBonus, 1.5);

          data.push({
            Sample_ID: id++,
            Coating_ml_kg: coating,
            Process: process,
            Material: material,
            Shelf_Life_Days: round(shelfLife),
          });
        }
      }
    }
  }
  return data;
};

export const avocado: SampleDataset = {
  name: 'Case: Avocado Coating',
  description: 'Regression analysis - optimizing shelf life through coating.',
  icon: 'trending-up',
  urlKey: 'avocado',
  data: generateAvocadoCoatingData(),
  config: {
    outcome: 'Shelf_Life_Days',
    factors: ['Coating_ml_kg', 'Process', 'Material'],
    specs: { lsl: 10, target: 15 },
  },
};
