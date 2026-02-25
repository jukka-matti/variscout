import { describe, it, expect } from 'vitest';
import { parseText } from '../parser';

// ===========================================================================
// parseText — CSV/TSV string parsing (same PapaParse config as parseCSV)
//
// Note: parseCSV(file: File) is a thin adapter that passes a File to PapaParse.
// PapaParse requires FileReaderSync for File objects, which is not available in
// Node test environments. Since both parseCSV and parseText use identical
// PapaParse options (header, dynamicTyping, skipEmptyLines), we test the
// parsing logic through parseText with equivalent CSV content.
// ===========================================================================

describe('parseText — CSV content parsing', () => {
  it('should parse standard CSV content', async () => {
    const text = 'Weight,Shift,Operator\n12.1,Day,Alice\n11.8,Night,Bob';
    const rows = await parseText(text);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Weight: 12.1, Shift: 'Day', Operator: 'Alice' });
    expect(rows[1]).toEqual({ Weight: 11.8, Shift: 'Night', Operator: 'Bob' });
  });

  it('should parse Excel-exported CSV with quoted fields and commas in values', async () => {
    const content = [
      '"Name","City","Score"',
      '"Smith, John","New York",95',
      '"Doe, Jane","San Francisco, CA",88',
      '"O\'Brien, Pat","Chicago",72',
    ].join('\n');
    const rows = await parseText(content);

    expect(rows).toHaveLength(3);
    expect(rows[0].Name).toBe('Smith, John');
    expect(rows[0].City).toBe('New York');
    expect(rows[0].Score).toBe(95);
    expect(rows[1].City).toBe('San Francisco, CA');
  });

  it('should handle UTF-8 BOM prefix', async () => {
    const bom = '\uFEFF';
    const content = bom + 'Value,Category\n10,A\n20,B';
    const rows = await parseText(content);

    expect(rows).toHaveLength(2);
    // PapaParse strips the BOM — the first column name should be clean
    const firstCol = Object.keys(rows[0])[0];
    expect(firstCol).toBe('Value');
    expect(rows[0].Value).toBe(10);
  });

  it('should handle unmatched quotes gracefully', async () => {
    // PapaParse is lenient with unmatched quotes — data is still parsed
    const content = 'Name,Value\n"Alice,10\nBob,20';
    const rows = await parseText(content);

    // PapaParse will produce rows even with malformed quoting
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle inconsistent column counts (ragged rows)', async () => {
    const content = 'A,B,C\n1,2,3\n4,5\n6,7,8';
    const rows = await parseText(content);

    expect(rows.length).toBeGreaterThanOrEqual(2);
    // First row is clean
    expect(rows[0]).toEqual({ A: 1, B: 2, C: 3 });
    // Short row has missing field
    expect(rows[1].A).toBe(4);
    expect(rows[1].B).toBe(5);
  });

  it('should reject empty string', async () => {
    await expect(parseText('')).rejects.toThrow('No data to parse');
  });

  it('should reject whitespace-only string', async () => {
    await expect(parseText('   \n\t  \n  ')).rejects.toThrow('No data to parse');
  });

  it('should reject header-only content (no data rows)', async () => {
    await expect(parseText('Weight,Shift,Operator')).rejects.toThrow('No data rows found');
  });

  it('should handle large content (1000+ rows)', async () => {
    const header = 'Index,Value,Category';
    const dataRows = Array.from(
      { length: 1500 },
      (_, i) => `${i},${(100 + i * 0.1).toFixed(1)},${i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'}`
    );
    const content = [header, ...dataRows].join('\n');
    const rows = await parseText(content);

    expect(rows).toHaveLength(1500);
    expect(rows[0].Index).toBe(0);
    expect(rows[0].Category).toBe('A');
    expect(rows[1499].Index).toBe(1499);
  });

  it('should auto-detect semicolon delimiter (European locale)', async () => {
    const content = 'Weight;Shift;Operator\n12.1;Day;Alice\n11.8;Night;Bob';
    const rows = await parseText(content);

    // PapaParse auto-detects semicolons as delimiters
    expect(rows).toHaveLength(2);
    expect(rows[0].Shift).toBe('Day');
    expect(rows[0].Operator).toBe('Alice');
  });
});

describe('parseText — tab-separated and special cases', () => {
  it('should parse tab-separated data', async () => {
    const text = 'Diameter\tMachine\tBatch\n25.4\tM1\tA\n25.6\tM2\tB\n25.1\tM1\tA';
    const rows = await parseText(text);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ Diameter: 25.4, Machine: 'M1', Batch: 'A' });
    expect(rows[2].Machine).toBe('M1');
  });

  it('should parse comma-separated data with negative numbers', async () => {
    const text = 'Measurement,Offset\n-3.14,0.5\n2.71,-1.2\n0,-0.001';
    const rows = await parseText(text);

    expect(rows).toHaveLength(3);
    expect(rows[0].Measurement).toBeCloseTo(-3.14);
    expect(rows[0].Offset).toBeCloseTo(0.5);
    expect(rows[1].Offset).toBeCloseTo(-1.2);
    expect(rows[2].Measurement).toBe(0);
    expect(rows[2].Offset).toBeCloseTo(-0.001);
  });

  it('should parse single-column data', async () => {
    const text = 'Temperature\n98.6\n99.1\n97.8\n100.2';
    const rows = await parseText(text);

    expect(rows).toHaveLength(4);
    expect(Object.keys(rows[0])).toEqual(['Temperature']);
    expect(rows[0].Temperature).toBeCloseTo(98.6);
    expect(rows[3].Temperature).toBeCloseTo(100.2);
  });

  it('should handle mixed types via dynamicTyping', async () => {
    // When a column has both numbers and strings, PapaParse types each cell individually
    const text = 'ID,Value\n1,100\n2,N/A\n3,200';
    const rows = await parseText(text);

    expect(rows).toHaveLength(3);
    // Numeric cells become numbers
    expect(typeof rows[0].Value).toBe('number');
    expect(rows[0].Value).toBe(100);
    // Non-numeric cells remain strings
    expect(typeof rows[1].Value).toBe('string');
    expect(rows[1].Value).toBe('N/A');
    // Back to number
    expect(typeof rows[2].Value).toBe('number');
    expect(rows[2].Value).toBe(200);
  });

  it('should reject content with no column separator', async () => {
    // Single unseparated string per line — PapaParse sees a single column with empty name
    await expect(parseText('justtext')).rejects.toThrow();
  });
});
