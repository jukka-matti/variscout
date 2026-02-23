/**
 * Pareto file parsing — pre-aggregated count data
 */

import type { ParetoRow } from './types';
import { parseCSV } from './csv';
import { parseExcel } from './excel';
import { analyzeColumn } from './detection';

export type { ParetoRow };

/**
 * Parse and validate separate Pareto file (pre-aggregated counts).
 * Returns array of { category, count, value? } sorted by count descending.
 */
export async function parseParetoFile(file: File): Promise<ParetoRow[]> {
  // Parse file
  let data: any[];
  if (file.name.endsWith('.csv')) {
    data = await parseCSV(file);
  } else {
    data = await parseExcel(file);
  }

  if (data.length === 0) {
    throw new Error('Pareto file is empty');
  }

  const columns = Object.keys(data[0]);

  // Auto-detect category and count columns
  const columnAnalysis = columns.map(col => analyzeColumn(data, col));

  const categoryCol = columnAnalysis.find(c => c.type === 'categorical' || c.type === 'text');
  const numericCols = columnAnalysis.filter(c => c.type === 'numeric');

  if (!categoryCol) {
    throw new Error('No category column found in Pareto file');
  }
  if (numericCols.length === 0) {
    throw new Error('No numeric (count) column found in Pareto file');
  }

  // First numeric column is count, second (if exists) is value
  const countCol = numericCols[0];
  const valueCol = numericCols.length > 1 ? numericCols[1] : null;

  // Transform to ParetoRow array
  const paretoData: ParetoRow[] = data
    .map(row => {
      const category = String(row[categoryCol.name] ?? 'Unknown');
      const count = Number(row[countCol.name]) || 0;
      const value = valueCol ? Number(row[valueCol.name]) || undefined : undefined;
      return { category, count, value };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return paretoData;
}
