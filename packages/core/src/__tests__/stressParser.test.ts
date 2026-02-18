/**
 * Parser threshold boundary tests at scale.
 *
 * Validates that the parser's categorical classification threshold (50 unique values)
 * and overall parsing behave correctly with large datasets.
 */

import { describe, it, expect } from 'vitest';
import { detectColumns, parseText } from '../parser';
import type { DataRow } from '../types';
import { generateStressData } from './helpers/stressDataGenerator';

// ============================================================================
// Helper: build DataRow[] with a string column of N unique values
// ============================================================================

function buildDataWithUniqueStrings(
  rowCount: number,
  uniqueCount: number,
  colName: string = 'Factor'
): DataRow[] {
  const levels = Array.from(
    { length: uniqueCount },
    (_, i) => `Level_${String(i + 1).padStart(4, '0')}`
  );
  return Array.from({ length: rowCount }, (_, i) => ({
    [colName]: levels[i % uniqueCount],
    Value: 100 + (i % 10) * 0.5,
  }));
}

// ============================================================================
// detectColumns / analyzeColumn classification thresholds
// ============================================================================

describe('Parser categorical threshold boundary', () => {
  it('column with exactly 50 unique values -> categorical', () => {
    const data = buildDataWithUniqueStrings(500, 50, 'Product');
    const result = detectColumns(data);

    const productAnalysis = result.columnAnalysis.find(c => c.name === 'Product');
    expect(productAnalysis).toBeDefined();
    expect(productAnalysis!.type).toBe('categorical');
    expect(productAnalysis!.uniqueCount).toBe(50);
  });

  it('column with 51 unique values -> text', () => {
    const data = buildDataWithUniqueStrings(510, 51, 'Product');
    const result = detectColumns(data);

    const productAnalysis = result.columnAnalysis.find(c => c.name === 'Product');
    expect(productAnalysis).toBeDefined();
    expect(productAnalysis!.type).toBe('text');
    expect(productAnalysis!.uniqueCount).toBe(51);
  });

  it('column with 200 unique product names -> text', () => {
    const data = buildDataWithUniqueStrings(2000, 200, 'Product');
    const result = detectColumns(data);

    const productAnalysis = result.columnAnalysis.find(c => c.name === 'Product');
    expect(productAnalysis).toBeDefined();
    expect(productAnalysis!.type).toBe('text');
    // Should NOT be suggested as a factor
    expect(result.factors).not.toContain('Product');
  });

  it('column with 1000 unique supplier IDs -> text (graceful, no crash)', () => {
    const data = buildDataWithUniqueStrings(5000, 1000, 'Supplier');
    const result = detectColumns(data);

    const supplierAnalysis = result.columnAnalysis.find(c => c.name === 'Supplier');
    expect(supplierAnalysis).toBeDefined();
    expect(supplierAnalysis!.type).toBe('text');
    expect(supplierAnalysis!.uniqueCount).toBe(1000);
    expect(result.factors).not.toContain('Supplier');
  });

  it(
    '10K rows, 20 columns mixed numeric/string -> correct classification for all',
    { timeout: 30_000 },
    () => {
      // Build a 10K-row dataset with:
      // - 10 numeric columns (Value_01..Value_10)
      // - 5 categorical columns (3 unique values each)
      // - 3 text columns (100 unique values each)
      // - 2 more categorical at boundary (50 unique values each)
      const rows: DataRow[] = [];
      for (let i = 0; i < 10000; i++) {
        const row: DataRow = {};

        // 10 numeric columns
        for (let n = 1; n <= 10; n++) {
          row[`Value_${String(n).padStart(2, '0')}`] = 100 + i * 0.01 + n;
        }

        // 5 categorical columns (3 unique each)
        for (let c = 1; c <= 5; c++) {
          row[`Cat_${c}`] = `Cat${c}_Level${(i % 3) + 1}`;
        }

        // 3 text columns (100 unique each)
        for (let t = 1; t <= 3; t++) {
          row[`Text_${t}`] = `Text${t}_ID_${String(i % 100).padStart(4, '0')}`;
        }

        // 2 boundary categorical (50 unique each)
        for (let b = 1; b <= 2; b++) {
          row[`Boundary_${b}`] = `B${b}_Level_${String(i % 50).padStart(3, '0')}`;
        }

        rows.push(row);
      }

      const result = detectColumns(rows);

      // Verify all 20 columns are analyzed
      expect(result.columnAnalysis).toHaveLength(20);

      // Check numeric columns
      const numericCols = result.columnAnalysis.filter(c => c.type === 'numeric');
      expect(numericCols).toHaveLength(10);

      // Check small categorical columns
      const catCols = result.columnAnalysis.filter(
        c => c.type === 'categorical' && c.name.startsWith('Cat_')
      );
      expect(catCols).toHaveLength(5);
      catCols.forEach(c => expect(c.uniqueCount).toBe(3));

      // Check text columns (100 unique > 50 threshold)
      const textCols = result.columnAnalysis.filter(
        c => c.type === 'text' && c.name.startsWith('Text_')
      );
      expect(textCols).toHaveLength(3);

      // Check boundary columns (50 unique = exactly at threshold)
      const boundaryCols = result.columnAnalysis.filter(c => c.name.startsWith('Boundary_'));
      expect(boundaryCols).toHaveLength(2);
      boundaryCols.forEach(c => {
        expect(c.type).toBe('categorical');
        expect(c.uniqueCount).toBe(50);
      });
    }
  );

  it('edge: 50 unique strings where 1 appears once and rest appear many times -> still categorical', () => {
    // The threshold is based on count of unique values, not distribution
    const data: DataRow[] = [];

    // 49 levels each appearing 200 times
    for (let level = 0; level < 49; level++) {
      for (let j = 0; j < 200; j++) {
        data.push({
          Category: `Frequent_${String(level + 1).padStart(2, '0')}`,
          Value: 100 + level * 0.5 + j * 0.01,
        });
      }
    }

    // 1 level appearing only once
    data.push({
      Category: 'Rare_Level',
      Value: 150,
    });

    const result = detectColumns(data);
    const categoryAnalysis = result.columnAnalysis.find(c => c.name === 'Category');

    expect(categoryAnalysis).toBeDefined();
    expect(categoryAnalysis!.uniqueCount).toBe(50);
    expect(categoryAnalysis!.type).toBe('categorical');
  });
});

// ============================================================================
// parseText at scale
// ============================================================================

describe('parseText at scale', () => {
  it('parses 5K-row tab-separated string', { timeout: 30_000 }, async () => {
    // Generate a tab-separated string with 5K rows and 5 columns
    const header = 'ID\tWeight\tShift\tMachine\tOperator';
    const lines = [header];

    for (let i = 0; i < 5000; i++) {
      const shift = ['Day', 'Night', 'Swing'][i % 3];
      const machine = `M${(i % 10) + 1}`;
      const operator = `Op${(i % 5) + 1}`;
      const weight = (100 + (i % 100) * 0.1).toFixed(2);
      lines.push(`${i + 1}\t${weight}\t${shift}\t${machine}\t${operator}`);
    }

    const text = lines.join('\n');
    const rows = await parseText(text);

    expect(rows).toHaveLength(5000);
    // Verify types
    expect(typeof rows[0].ID).toBe('number');
    expect(typeof rows[0].Weight).toBe('number');
    expect(typeof rows[0].Shift).toBe('string');
    expect(typeof rows[0].Machine).toBe('string');

    // Verify first and last row values
    expect(rows[0].ID).toBe(1);
    expect(rows[4999].ID).toBe(5000);
  });

  it('parses 5K rows and detectColumns classifies correctly', { timeout: 30_000 }, async () => {
    const header = 'Measurement\tShift\tMachine\tBatchID';
    const lines = [header];

    for (let i = 0; i < 5000; i++) {
      const shift = ['Day', 'Night'][i % 2];
      const machine = `Machine_${(i % 8) + 1}`;
      const batchId = `BATCH_${String(i).padStart(5, '0')}`;
      const measurement = (50 + Math.sin(i) * 5).toFixed(3);
      lines.push(`${measurement}\t${shift}\t${machine}\t${batchId}`);
    }

    const text = lines.join('\n');
    const rows = await parseText(text);

    expect(rows).toHaveLength(5000);

    const detected = detectColumns(rows);

    // Measurement should be numeric and detected as outcome
    expect(detected.outcome).toBe('Measurement');

    // Shift (2 unique) and Machine (8 unique) should be categorical factors
    const shiftAnalysis = detected.columnAnalysis.find(c => c.name === 'Shift');
    expect(shiftAnalysis!.type).toBe('categorical');

    const machineAnalysis = detected.columnAnalysis.find(c => c.name === 'Machine');
    expect(machineAnalysis!.type).toBe('categorical');

    // BatchID has 5000 unique values -> text
    const batchAnalysis = detected.columnAnalysis.find(c => c.name === 'BatchID');
    expect(batchAnalysis!.type).toBe('text');
    expect(batchAnalysis!.uniqueCount).toBe(5000);
  });
});
