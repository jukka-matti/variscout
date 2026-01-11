import type { SampleDataset } from '../types';
import { generateNormal } from '../utils';

// Packaging Defects: Product Line Analysis (Africa Case)
// Story: Product C has systematic underfill problem
const generatePackagingDefectsData = () => {
  const data: Record<string, unknown>[] = [];
  const products = ['Product A', 'Product B', 'Product C', 'Product D'];
  const defectTypes = ['Underfill', 'Seal_Failure', 'Label_Error', 'Overfill'];
  const startDate = new Date('2025-11-01');

  for (let day = 0; day < 20; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue; // Skip weekends

    for (const product of products) {
      // Product C has 3x defect rate for Underfill
      const baseDefects = product === 'Product C' ? 180 : 55;
      const defectCount = Math.round(generateNormal(baseDefects, baseDefects * 0.15));

      data.push({
        Date: currentDate.toISOString().split('T')[0],
        Product: product,
        Defect_Count: Math.max(10, defectCount),
        Defect_Type: product === 'Product C' ? 'Underfill' : defectTypes[products.indexOf(product)],
      });
    }
  }
  return data;
};

export const packaging: SampleDataset = {
  name: 'Case: Packaging Defects',
  description: 'Product line analysis - which product has a defect problem?',
  icon: 'package',
  urlKey: 'packaging',
  data: generatePackagingDefectsData(),
  config: {
    outcome: 'Defect_Count',
    factors: ['Product', 'Defect_Type'],
    specs: { target: 50, usl: 100 },
  },
};
