import { describe, it, expect } from 'vitest';
import { classifyFactorType, classifyAllFactors } from '../factorTypeDetection';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// classifyFactorType — direct heuristic tests
// ---------------------------------------------------------------------------

describe('classifyFactorType', () => {
  describe('Rule 1 — non-numeric values → categorical (high)', () => {
    it('classifies string-only column as categorical', () => {
      const data: DataRow[] = [
        { Machine: 'Machine A' },
        { Machine: 'Machine B' },
        { Machine: 'Machine C' },
      ];
      const result = classifyFactorType(data, 'Machine', 3, false);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });

    it('classifies zip-code-like strings as categorical', () => {
      const data: DataRow[] = [
        { Zip: '90210' },
        { Zip: '10001' },
        { Zip: '94103' },
        { Zip: '60601' },
        { Zip: '33101' },
        { Zip: '02101' },
        { Zip: '77001' },
        { Zip: '19101' },
        { Zip: '85001' },
        { Zip: '98101' },
        { Zip: '30301' },
      ];
      // isNumeric = false because zip codes as strings (leading zeros etc.)
      const result = classifyFactorType(data, 'Zip', 11, false);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Rule 2 — ≤ 6 unique values → categorical (high)', () => {
    it('classifies Machine 1–4 as categorical', () => {
      const data: DataRow[] = [{ Machine: 1 }, { Machine: 2 }, { Machine: 3 }, { Machine: 4 }];
      const result = classifyFactorType(data, 'Machine', 4, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });

    it('classifies Year 2020–2022 (3 unique) as categorical', () => {
      const data: DataRow[] = [{ Year: 2020 }, { Year: 2021 }, { Year: 2022 }, { Year: 2020 }];
      const result = classifyFactorType(data, 'Year', 3, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });

    it('classifies a column with exactly 6 unique values as categorical (boundary)', () => {
      const data: DataRow[] = [
        { Level: 1 },
        { Level: 2 },
        { Level: 3 },
        { Level: 4 },
        { Level: 5 },
        { Level: 6 },
      ];
      const result = classifyFactorType(data, 'Level', 6, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });

    it('classifies Pressure values [1.0, 2.0, 3.0] as categorical — only 3 uniques', () => {
      const data: DataRow[] = [{ Pressure: 1.0 }, { Pressure: 2.0 }, { Pressure: 3.0 }];
      const result = classifyFactorType(data, 'Pressure', 3, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Rule 3 — ≤ 20 unique + all integers → categorical (medium)', () => {
    it('classifies Batch 1–15 (integer, 15 unique) as categorical', () => {
      const data: DataRow[] = Array.from({ length: 15 }, (_, i) => ({
        Batch: i + 1,
      }));
      const result = classifyFactorType(data, 'Batch', 15, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('medium');
    });

    it('classifies Batch 1–20 (boundary, all integers) as categorical', () => {
      const data: DataRow[] = Array.from({ length: 20 }, (_, i) => ({
        Batch: i + 1,
      }));
      const result = classifyFactorType(data, 'Batch', 20, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('medium');
    });

    it('classifies integer column with 7–20 unique values as categorical (medium)', () => {
      const data: DataRow[] = Array.from({ length: 10 }, (_, i) => ({
        Station: i + 1,
      }));
      const result = classifyFactorType(data, 'Station', 10, true);
      expect(result.type).toBe('categorical');
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Rule 4 — > 20 unique values → continuous (high)', () => {
    it('classifies Temperature with 25+ unique decimal values as continuous', () => {
      const temps = [
        72.1, 73.5, 68.3, 71.9, 74.2, 69.8, 70.5, 72.8, 73.1, 68.9, 71.4, 70.1, 72.3, 69.5, 74.8,
        70.9, 71.2, 73.6, 68.7, 72.6, 70.3, 71.7, 69.1, 73.9, 68.5,
      ];
      const data: DataRow[] = temps.map(t => ({ Temperature: t }));
      const result = classifyFactorType(data, 'Temperature', 25, true);
      expect(result.type).toBe('continuous');
      expect(result.confidence).toBe('high');
    });

    it('classifies column with 21 unique values as continuous (boundary)', () => {
      const data: DataRow[] = Array.from({ length: 21 }, (_, i) => ({
        Value: i + 1,
      }));
      const result = classifyFactorType(data, 'Value', 21, true);
      expect(result.type).toBe('continuous');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Rule 5 — moderate cardinality (7–20) + decimals → continuous (medium)', () => {
    it('classifies flow rate with 10 unique decimal values as continuous', () => {
      const data: DataRow[] = [
        { Flow: 1.1 },
        { Flow: 1.5 },
        { Flow: 2.3 },
        { Flow: 2.7 },
        { Flow: 3.1 },
        { Flow: 3.8 },
        { Flow: 4.2 },
        { Flow: 4.9 },
        { Flow: 5.5 },
        { Flow: 6.1 },
      ];
      const result = classifyFactorType(data, 'Flow', 10, true);
      expect(result.type).toBe('continuous');
      expect(result.confidence).toBe('medium');
    });
  });

  describe('result shape', () => {
    it('always returns type, confidence, and reason string', () => {
      const data: DataRow[] = [{ X: 1 }, { X: 2 }];
      const result = classifyFactorType(data, 'X', 2, true);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reason');
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// classifyAllFactors — integration tests using real data inference
// ---------------------------------------------------------------------------

describe('classifyAllFactors', () => {
  it('classifies Machine 1–4 column as categorical from raw data', () => {
    const data: DataRow[] = [
      { Machine: 1, Temperature: 72.1 },
      { Machine: 2, Temperature: 73.5 },
      { Machine: 3, Temperature: 68.3 },
      { Machine: 4, Temperature: 71.9 },
      { Machine: 1, Temperature: 74.2 },
      { Machine: 2, Temperature: 69.8 },
    ];
    const result = classifyAllFactors(data, ['Machine']);
    expect(result.get('Machine')?.type).toBe('categorical');
    expect(result.get('Machine')?.confidence).toBe('high');
  });

  it('classifies Temperature decimals column as continuous from raw data', () => {
    const temps = [
      72.1, 73.5, 68.3, 71.9, 74.2, 69.8, 70.5, 72.8, 73.1, 68.9, 71.4, 70.1, 72.3, 69.5, 74.8,
      70.9, 71.2, 73.6, 68.7, 72.6, 70.3, 71.7, 69.1, 73.9, 68.5,
    ];
    const data: DataRow[] = temps.map(t => ({ Temperature: t }));
    const result = classifyAllFactors(data, ['Temperature']);
    expect(result.get('Temperature')?.type).toBe('continuous');
    expect(result.get('Temperature')?.confidence).toBe('high');
  });

  it('classifies Year 2020–2022 column as categorical from raw data', () => {
    const data: DataRow[] = [
      { Year: 2020 },
      { Year: 2021 },
      { Year: 2022 },
      { Year: 2020 },
      { Year: 2021 },
      { Year: 2022 },
    ];
    const result = classifyAllFactors(data, ['Year']);
    expect(result.get('Year')?.type).toBe('categorical');
    expect(result.get('Year')?.confidence).toBe('high');
  });

  it('classifies Batch 1–50 with all rows present as categorical (integer, many unique but ≤20 from dedupe)', () => {
    // Batch IDs 1–15 → 15 unique values, all integers → categorical (medium)
    const data: DataRow[] = Array.from({ length: 30 }, (_, i) => ({
      Batch: (i % 15) + 1,
    }));
    const result = classifyAllFactors(data, ['Batch']);
    expect(result.get('Batch')?.type).toBe('categorical');
    // 15 unique integer values → medium confidence
    expect(result.get('Batch')?.confidence).toBe('medium');
  });

  it('classifies Batch 1–50 with 50 distinct values as continuous (>20 unique)', () => {
    const data: DataRow[] = Array.from({ length: 50 }, (_, i) => ({
      Batch: i + 1,
    }));
    const result = classifyAllFactors(data, ['Batch']);
    // 50 unique integer values → Rule 4: >20 → continuous
    expect(result.get('Batch')?.type).toBe('continuous');
    expect(result.get('Batch')?.confidence).toBe('high');
  });

  it('classifies string zip-code column with alpha chars as categorical (non-numeric, high confidence)', () => {
    // Zip codes with letters (e.g. Canadian postal codes) are non-numeric → Rule 1
    const zips = [
      'K1A 0A9',
      'M5H 2N2',
      'V6B 4N7',
      'T2P 5H1',
      'H3B 4W5',
      'R3C 4T3',
      'S4P 3Y2',
      'E1C 4X9',
      'A1C 5P6',
      'B3J 1S9',
      'G1K 7P4',
    ];
    const data: DataRow[] = zips.map(z => ({ Zip: z }));
    const result = classifyAllFactors(data, ['Zip']);
    expect(result.get('Zip')?.type).toBe('categorical');
    expect(result.get('Zip')?.confidence).toBe('high');
  });

  it('classifies purely numeric zip-code-like strings as categorical (≤20 unique integers)', () => {
    // Numeric strings parse as numbers; 11 unique values ≤ 20, all integers → categorical medium
    const zips = [
      '90210',
      '10001',
      '94103',
      '60601',
      '33101',
      '02101',
      '77001',
      '19101',
      '85001',
      '98101',
      '30301',
    ];
    const data: DataRow[] = zips.map(z => ({ Zip: z }));
    const result = classifyAllFactors(data, ['Zip']);
    expect(result.get('Zip')?.type).toBe('categorical');
    // Medium because they parse as numeric integers (Rule 3)
    expect(result.get('Zip')?.confidence).toBe('medium');
  });

  it('classifies Pressure [1.0, 2.0, 3.0] as categorical (3 unique)', () => {
    const data: DataRow[] = [
      { Pressure: 1.0 },
      { Pressure: 2.0 },
      { Pressure: 3.0 },
      { Pressure: 1.0 },
      { Pressure: 2.0 },
    ];
    const result = classifyAllFactors(data, ['Pressure']);
    expect(result.get('Pressure')?.type).toBe('categorical');
    expect(result.get('Pressure')?.confidence).toBe('high');
  });

  it('handles multiple columns simultaneously', () => {
    const data: DataRow[] = [
      { Machine: 1, Temperature: 72.1, Year: 2020 },
      { Machine: 2, Temperature: 73.5, Year: 2021 },
      { Machine: 3, Temperature: 68.3, Year: 2022 },
      { Machine: 4, Temperature: 71.9, Year: 2020 },
    ];
    // Add more temps to push unique count above 6
    const extended: DataRow[] = [...data];
    for (let i = 0; i < 25; i++) {
      extended.push({ Machine: (i % 4) + 1, Temperature: 60 + i * 0.7, Year: 2020 });
    }
    const result = classifyAllFactors(extended, ['Machine', 'Temperature', 'Year']);
    expect(result.get('Machine')?.type).toBe('categorical');
    expect(result.get('Temperature')?.type).toBe('continuous');
    expect(result.get('Year')?.type).toBe('categorical');
    expect(result.size).toBe(3);
  });

  it('returns empty map for empty factors list', () => {
    const data: DataRow[] = [{ X: 1 }, { X: 2 }];
    const result = classifyAllFactors(data, []);
    expect(result.size).toBe(0);
  });

  it('handles rows with null/undefined values gracefully', () => {
    const data: DataRow[] = [
      { Machine: 1 },
      { Machine: null },
      { Machine: undefined },
      { Machine: 2 },
      { Machine: 3 },
    ];
    const result = classifyAllFactors(data, ['Machine']);
    // Only 3 non-null unique values → categorical (high)
    expect(result.get('Machine')?.type).toBe('categorical');
  });

  it('handles empty dataset without throwing', () => {
    const result = classifyAllFactors([], ['Machine']);
    // 0 unique values → ≤6 → categorical
    expect(result.get('Machine')?.type).toBe('categorical');
    expect(result.get('Machine')?.confidence).toBe('high');
  });

  it('handles column with single unique value', () => {
    const data: DataRow[] = [{ Shift: 1 }, { Shift: 1 }, { Shift: 1 }];
    const result = classifyAllFactors(data, ['Shift']);
    expect(result.get('Shift')?.type).toBe('categorical');
    expect(result.get('Shift')?.confidence).toBe('high');
  });
});
