import { describe, it, expect, vi } from 'vitest';
import Papa from 'papaparse';

/**
 * PapaParse cannot read File objects in the Node test environment (no FileReader).
 * Mock parseCSV to read the File's text content and parse it with PapaParse's string mode,
 * so the real column detection and sorting logic in parseParetoFile is exercised.
 */
vi.mock('../parser/csv', () => ({
  parseCSV: async (file: File): Promise<Record<string, unknown>[]> => {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => resolve(results.data as Record<string, unknown>[]),
        error: (err: Error) => reject(err),
      });
    });
  },
}));

import { parseParetoFile } from '../parser';

function csvFile(content: string, name = 'defects.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('parseParetoFile', () => {
  it('parses standard defect count CSV sorted descending by count', async () => {
    const csv = `Defect,Count
Scratch,15
Dent,8
Crack,22
Stain,5`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result).toEqual([
      { category: 'Crack', count: 22 },
      { category: 'Scratch', count: 15 },
      { category: 'Dent', count: 8 },
      { category: 'Stain', count: 5 },
    ]);
  });

  it('populates value field from third numeric column', async () => {
    const csv = `Defect,Count,Cost
Scratch,15,300
Dent,8,640
Crack,22,1100`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ category: 'Crack', count: 22, value: 1100 });
    expect(result[1]).toEqual({ category: 'Scratch', count: 15, value: 300 });
    expect(result[2]).toEqual({ category: 'Dent', count: 8, value: 640 });
  });

  it('sorts already-sorted input by count descending', async () => {
    const csv = `Type,Frequency
Alpha,50
Beta,30
Gamma,10`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result[0].count).toBe(50);
    expect(result[1].count).toBe(30);
    expect(result[2].count).toBe(10);
  });

  it('sorts unsorted input by count descending', async () => {
    const csv = `Issue,Occurrences
Minor,3
Critical,25
Major,12
Trivial,1`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result.map(r => r.count)).toEqual([25, 12, 3, 1]);
    expect(result.map(r => r.category)).toEqual(['Critical', 'Major', 'Minor', 'Trivial']);
  });

  it('filters out rows with zero count', async () => {
    const csv = `Defect,Count
Scratch,15
None,0
Dent,8
Clean,0`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result).toHaveLength(2);
    expect(result.every(r => r.count > 0)).toBe(true);
    expect(result.map(r => r.category)).toEqual(['Scratch', 'Dent']);
  });

  it('returns single ParetoRow for single category', async () => {
    const csv = `Category,Count
Defect_A,42`;

    const result = await parseParetoFile(csvFile(csv));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ category: 'Defect_A', count: 42 });
  });

  it('throws for empty file', async () => {
    const csv = `Category,Count`;

    await expect(parseParetoFile(csvFile(csv))).rejects.toThrow('Pareto file is empty');
  });

  it('throws when no category column is found', async () => {
    const csv = `Value1,Value2
10,20
30,40
50,60`;

    await expect(parseParetoFile(csvFile(csv))).rejects.toThrow(
      'No category column found in Pareto file'
    );
  });
});
