import type { SampleDataset } from '../types';

/**
 * Manufacturing Defects: Event-log defect dataset
 *
 * Story: Injection molding plant tracking defect events across 3 machines
 * and 2 shifts over 2 weeks. Machine M3 has notably more defects (worn mold),
 * and night shift shows higher defect rates (reduced supervision).
 *
 * Columns: Date, Shift, Machine, Product, DefectType
 * - 5 defect types: Scratch, Dent, Contamination, Seal_Failure, Dimension_OOS
 * - 3 machines: M1, M2, M3
 * - 2 shifts: Day, Night
 * - 2 products: Widget_A, Widget_B
 * - 2-week date range
 *
 * This dataset auto-detects as defect format (event-log shape, high confidence).
 */

function generateDefectEvents(): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const machines = ['M1', 'M2', 'M3'];
  const shifts = ['Day', 'Night'];
  const products = ['Widget_A', 'Widget_B'];
  const defectTypes = ['Scratch', 'Dent', 'Contamination', 'Seal_Failure', 'Dimension_OOS'];

  // Seeded pseudo-random for deterministic output
  let seed = 42;
  function rand(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  const startDate = new Date('2025-11-03'); // Monday

  let id = 1;
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    // Skip weekends
    const dow = currentDate.getDay();
    if (dow === 0 || dow === 6) continue;

    const dateStr = currentDate.toISOString().split('T')[0];

    for (const shift of shifts) {
      for (const machine of machines) {
        // M3 has 3x defects; Night shift has 1.5x defects
        let baseRate = 2;
        if (machine === 'M3') baseRate = 6;
        if (shift === 'Night') baseRate = Math.round(baseRate * 1.5);

        const eventCount = Math.max(1, Math.round(baseRate + (rand() - 0.5) * baseRate * 0.6));

        for (let e = 0; e < eventCount; e++) {
          // M3 has heavy Seal_Failure concentration (worn mold)
          let defectType: string;
          if (machine === 'M3' && rand() < 0.55) {
            defectType = 'Seal_Failure';
          } else {
            defectType = defectTypes[Math.floor(rand() * defectTypes.length)];
          }

          const product = products[Math.floor(rand() * products.length)];

          data.push({
            Event_ID: id++,
            Date: dateStr,
            Shift: shift,
            Machine: machine,
            Product: product,
            DefectType: defectType,
          });
        }
      }
    }
  }

  return data;
}

export const manufacturingDefects: SampleDataset = {
  name: 'Case: Manufacturing Defects',
  description: 'Injection molding defects - find the worn mold.',
  icon: 'alert-triangle',
  urlKey: 'manufacturing-defects',
  category: 'cases',
  featured: false,
  data: generateDefectEvents(),
  config: {
    outcome: 'DefectType',
    factors: ['Machine', 'Shift', 'Product'],
    specs: {},
    analysisMode: 'defect',
    defectMapping: {
      dataShape: 'event-log',
      defectTypeColumn: 'DefectType',
      aggregationUnit: 'Date',
    },
  },
};
