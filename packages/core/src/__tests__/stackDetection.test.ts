import { describe, it, expect } from 'vitest';
import { detectColumns } from '../parser';
import type { DataRow } from '../types';

describe('detectColumns stack suggestion', () => {
  it('should suggest stacking for Finland-style tourism data (83 country columns)', () => {
    // Simulate: Year, Month (text), Total, + 10 country columns
    const countries = [
      'Germany',
      'Sweden',
      'France',
      'United Kingdom',
      'Russia',
      'Japan',
      'China',
      'Netherlands',
      'Estonia',
      'Norway',
    ];
    const data: DataRow[] = Array.from({ length: 12 }, (_, i) => {
      const row: DataRow = {
        Year: 2020,
        Month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          i
        ],
        Total: 300000 + i * 10000,
      };
      for (const c of countries) {
        row[c] = Math.floor(5000 + Math.random() * 50000);
      }
      return row;
    });

    const result = detectColumns(data);

    expect(result.suggestedStack).toBeDefined();
    expect(result.suggestedStack!.confidence).toBe('high'); // 10 columns
    expect(result.suggestedStack!.columnsToStack).toHaveLength(10);
    // Year should be excluded (year-like values)
    expect(result.suggestedStack!.columnsToStack).not.toContain('Year');
    // Total should be excluded (aggregation keyword)
    expect(result.suggestedStack!.columnsToStack).not.toContain('Total');
    // Month (text) should be in keepColumns
    expect(result.suggestedStack!.keepColumns).toContain('Month');
    // All countries should be in the stack
    for (const c of countries) {
      expect(result.suggestedStack!.columnsToStack).toContain(c);
    }
  });

  it('should not suggest stacking for standard long-form data', () => {
    const data: DataRow[] = [
      { Weight: 12.1, Shift: 'Day', Operator: 'Alice' },
      { Weight: 11.8, Shift: 'Night', Operator: 'Bob' },
      { Weight: 12.5, Shift: 'Day', Operator: 'Alice' },
    ];

    const result = detectColumns(data);
    expect(result.suggestedStack).toBeUndefined();
  });

  it('should not suggest stacking when fewer than 5 numeric columns', () => {
    const data: DataRow[] = Array.from({ length: 10 }, () => ({
      A: Math.random() * 100,
      B: Math.random() * 100,
      C: Math.random() * 100,
      D: Math.random() * 100,
      Label: 'X',
    }));

    const result = detectColumns(data);
    // Only 4 numeric columns, below threshold
    expect(result.suggestedStack).toBeUndefined();
  });

  it('should assign medium confidence for 5-9 columns', () => {
    const data: DataRow[] = Array.from({ length: 10 }, () => {
      const row: DataRow = { ID: 'X' };
      for (let i = 0; i < 7; i++) {
        row[`Sensor${i}`] = Math.random() * 100;
      }
      return row;
    });

    const result = detectColumns(data);
    expect(result.suggestedStack).toBeDefined();
    expect(result.suggestedStack!.confidence).toBe('medium');
    expect(result.suggestedStack!.columnsToStack).toHaveLength(7);
  });

  it('should exclude year-like numeric columns from stack', () => {
    const data: DataRow[] = Array.from({ length: 10 }, (_, i) => {
      const row: DataRow = { Year: 2015 + i };
      for (let j = 0; j < 6; j++) {
        row[`Country${j}`] = Math.floor(Math.random() * 10000);
      }
      return row;
    });

    const result = detectColumns(data);
    expect(result.suggestedStack).toBeDefined();
    expect(result.suggestedStack!.columnsToStack).not.toContain('Year');
    expect(result.suggestedStack!.keepColumns).toContain('Year');
  });

  it('should separate columns with very different magnitudes into clusters', () => {
    // Mix: 5 columns with values ~100 and 5 columns with values ~1,000,000
    const data: DataRow[] = Array.from({ length: 20 }, () => {
      const row: DataRow = { ID: 'X' };
      for (let i = 0; i < 5; i++) {
        row[`Small${i}`] = Math.random() * 100;
      }
      for (let i = 0; i < 5; i++) {
        row[`Large${i}`] = Math.random() * 1000000;
      }
      return row;
    });

    const result = detectColumns(data);
    expect(result.suggestedStack).toBeDefined();
    // Should pick the largest cluster (both are 5, either could be picked)
    expect(result.suggestedStack!.columnsToStack).toHaveLength(5);
  });

  it('should exclude columns matching strong outcome keywords', () => {
    const data: DataRow[] = Array.from({ length: 10 }, () => {
      const row: DataRow = {
        temperature: Math.random() * 100,
        pressure: Math.random() * 10,
      };
      for (let i = 0; i < 6; i++) {
        row[`Zone${i}`] = Math.random() * 100;
      }
      return row;
    });

    const result = detectColumns(data);
    expect(result.suggestedStack).toBeDefined();
    // "temperature" and "pressure" are exact outcome keyword matches → excluded
    expect(result.suggestedStack!.columnsToStack).not.toContain('temperature');
    expect(result.suggestedStack!.columnsToStack).not.toContain('pressure');
  });
});
