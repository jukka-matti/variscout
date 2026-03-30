import { describe, it, expect } from 'vitest';
import { stackColumns, previewStack } from '../parser/stack';
import type { DataRow } from '../types';

describe('stackColumns', () => {
  const wideData: DataRow[] = [
    { Year: 1995, Month: 'Jan', Germany: 21376, Sweden: 19925, France: 6793 },
    { Year: 1995, Month: 'Feb', Germany: 26720, Sweden: 19178, France: 8848 },
  ];

  it('should stack selected columns into label + measure', () => {
    const result = stackColumns(wideData, {
      columnsToStack: ['Germany', 'Sweden', 'France'],
      measureName: 'Arrivals',
      labelName: 'Country',
    });

    expect(result.rowCount).toBe(6); // 2 rows × 3 columns
    expect(result.columns).toEqual(['Year', 'Month', 'Country', 'Arrivals']);
    expect(result.keptColumns).toEqual(['Year', 'Month']);
    expect(result.labelValues).toEqual(['Germany', 'Sweden', 'France']);

    // Check first row
    expect(result.data[0]).toEqual({
      Year: 1995,
      Month: 'Jan',
      Country: 'Germany',
      Arrivals: 21376,
    });

    // Check last row
    expect(result.data[5]).toEqual({
      Year: 1995,
      Month: 'Feb',
      Country: 'France',
      Arrivals: 8848,
    });
  });

  it('should preserve row order (all stacked columns for row 1, then row 2)', () => {
    const result = stackColumns(wideData, {
      columnsToStack: ['Germany', 'Sweden'],
      measureName: 'Arrivals',
      labelName: 'Country',
    });

    expect(result.data[0].Country).toBe('Germany');
    expect(result.data[0].Year).toBe(1995);
    expect(result.data[0].Month).toBe('Jan');

    expect(result.data[1].Country).toBe('Sweden');
    expect(result.data[1].Year).toBe(1995);
    expect(result.data[1].Month).toBe('Jan');

    expect(result.data[2].Country).toBe('Germany');
    expect(result.data[2].Year).toBe(1995);
    expect(result.data[2].Month).toBe('Feb');
  });

  it('should handle null/undefined values in stacked columns', () => {
    const dataWithMissing: DataRow[] = [
      { Year: 2020, CountryA: 100, CountryB: null, CountryC: undefined },
    ];

    const result = stackColumns(dataWithMissing, {
      columnsToStack: ['CountryA', 'CountryB', 'CountryC'],
      measureName: 'Value',
      labelName: 'Source',
    });

    expect(result.rowCount).toBe(3);
    expect(result.data[0].Value).toBe(100);
    expect(result.data[1].Value).toBeNull();
    expect(result.data[2].Value).toBeNull(); // undefined → null
  });

  it('should stack a single column', () => {
    const result = stackColumns(wideData, {
      columnsToStack: ['Germany'],
      measureName: 'Arrivals',
      labelName: 'Country',
    });

    expect(result.rowCount).toBe(2);
    expect(result.data[0]).toEqual({
      Year: 1995,
      Month: 'Jan',
      Sweden: 19925,
      France: 6793,
      Country: 'Germany',
      Arrivals: 21376,
    });
  });

  it('should stack all columns (no kept columns)', () => {
    const simpleData: DataRow[] = [{ A: 1, B: 2 }];
    const result = stackColumns(simpleData, {
      columnsToStack: ['A', 'B'],
      measureName: 'Value',
      labelName: 'Variable',
    });

    expect(result.rowCount).toBe(2);
    expect(result.keptColumns).toEqual([]);
    expect(result.columns).toEqual(['Variable', 'Value']);
    expect(result.data[0]).toEqual({ Variable: 'A', Value: 1 });
    expect(result.data[1]).toEqual({ Variable: 'B', Value: 2 });
  });

  it('should handle empty data', () => {
    const result = stackColumns([], {
      columnsToStack: ['A', 'B'],
      measureName: 'Value',
      labelName: 'Label',
    });

    expect(result.rowCount).toBe(0);
    expect(result.data).toEqual([]);
    expect(result.labelValues).toEqual(['A', 'B']);
  });

  it('should throw for empty columnsToStack', () => {
    expect(() =>
      stackColumns(wideData, {
        columnsToStack: [],
        measureName: 'Value',
        labelName: 'Label',
      })
    ).toThrow('At least one column must be selected');
  });

  it('should throw for empty measure name', () => {
    expect(() =>
      stackColumns(wideData, {
        columnsToStack: ['Germany'],
        measureName: '',
        labelName: 'Country',
      })
    ).toThrow('Measure name is required');
  });

  it('should throw for empty label name', () => {
    expect(() =>
      stackColumns(wideData, {
        columnsToStack: ['Germany'],
        measureName: 'Arrivals',
        labelName: '  ',
      })
    ).toThrow('Label name is required');
  });

  it('should throw when label name conflicts with kept column', () => {
    expect(() =>
      stackColumns(wideData, {
        columnsToStack: ['Germany', 'Sweden'],
        measureName: 'Arrivals',
        labelName: 'Year', // conflicts with kept column
      })
    ).toThrow('Column name conflict: "Year"');
  });

  it('should throw when measure name conflicts with kept column', () => {
    expect(() =>
      stackColumns(wideData, {
        columnsToStack: ['Germany', 'Sweden'],
        measureName: 'Month', // conflicts with kept column
        labelName: 'Country',
      })
    ).toThrow('Column name conflict: "Month"');
  });

  it('should handle large dataset efficiently', () => {
    // 100 rows × 50 columns = 5000 output rows
    const largeCols = Array.from({ length: 50 }, (_, i) => `Col${i}`);
    const largeData: DataRow[] = Array.from({ length: 100 }, (_, r) => {
      const row: DataRow = { ID: r };
      for (const col of largeCols) {
        row[col] = Math.random() * 100;
      }
      return row;
    });

    const start = performance.now();
    const result = stackColumns(largeData, {
      columnsToStack: largeCols,
      measureName: 'Value',
      labelName: 'Variable',
    });
    const elapsed = performance.now() - start;

    expect(result.rowCount).toBe(5000);
    expect(result.keptColumns).toEqual(['ID']);
    expect(elapsed).toBeLessThan(500); // Should be fast
  });
});

describe('previewStack', () => {
  const data: DataRow[] = [
    { Year: 1995, Month: 'Jan', Germany: 21376, Sweden: 19925 },
    { Year: 1995, Month: 'Feb', Germany: 26720, Sweden: 19178 },
  ];

  it('should compute preview metadata without stacking', () => {
    const preview = previewStack(data, {
      columnsToStack: ['Germany', 'Sweden'],
      measureName: 'Arrivals',
      labelName: 'Country',
    });

    expect(preview.outputRowCount).toBe(4); // 2 × 2
    expect(preview.outputColumnCount).toBe(4); // Year, Month + Country + Arrivals
    expect(preview.keptColumns).toEqual(['Year', 'Month']);
  });

  it('should handle empty data', () => {
    const preview = previewStack([], {
      columnsToStack: ['A', 'B'],
      measureName: 'Value',
      labelName: 'Label',
    });

    expect(preview.outputRowCount).toBe(0);
    expect(preview.outputColumnCount).toBe(2);
    expect(preview.keptColumns).toEqual([]);
  });
});
