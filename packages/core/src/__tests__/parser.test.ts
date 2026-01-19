import { describe, it, expect } from 'vitest';
import { detectColumns, validateData } from '../parser';
import type { DataRow } from '../types';

describe('parser module', () => {
  describe('detectColumns', () => {
    it('should return empty result for empty data', () => {
      const result = detectColumns([]);
      expect(result.outcome).toBeNull();
      expect(result.factors).toEqual([]);
      expect(result.timeColumn).toBeNull();
      expect(result.confidence).toBe('low');
      expect(result.columnAnalysis).toEqual([]);
    });

    it('should detect numeric outcome column', () => {
      const data: DataRow[] = [
        { weight: 10, supplier: 'A' },
        { weight: 12, supplier: 'B' },
        { weight: 11, supplier: 'A' },
      ];
      const result = detectColumns(data);
      expect(result.outcome).toBe('weight');
    });

    it('should detect outcome by keyword (time)', () => {
      const data: DataRow[] = [
        { cycle_time: 10, value: 100, machine: 'M1' },
        { cycle_time: 12, value: 110, machine: 'M2' },
      ];
      const result = detectColumns(data);
      expect(result.outcome).toBe('cycle_time');
    });

    it('should detect outcome by keyword (measurement)', () => {
      const data: DataRow[] = [
        { measurement: 10.5, id: 1 },
        { measurement: 11.2, id: 2 },
      ];
      const result = detectColumns(data);
      expect(result.outcome).toBe('measurement');
    });

    it('should detect categorical factors', () => {
      const data: DataRow[] = [
        { value: 10, shift: 'Day', machine: 'A' },
        { value: 12, shift: 'Night', machine: 'B' },
        { value: 11, shift: 'Day', machine: 'A' },
      ];
      const result = detectColumns(data);
      expect(result.factors).toContain('shift');
      expect(result.factors).toContain('machine');
    });

    it('should prioritize factor keywords', () => {
      const data: DataRow[] = [
        { value: 10, operator: 'John', name: 'Test1' },
        { value: 12, operator: 'Jane', name: 'Test2' },
        { value: 11, operator: 'John', name: 'Test3' },
      ];
      const result = detectColumns(data);
      // operator should be prioritized over name
      expect(result.factors[0]).toBe('operator');
    });

    it('should detect date column', () => {
      const data: DataRow[] = [
        { value: 10, date: '2024-01-15' },
        { value: 12, date: '2024-01-16' },
      ];
      const result = detectColumns(data);
      expect(result.timeColumn).toBe('date');
    });

    it('should detect time column by keyword', () => {
      const data: DataRow[] = [
        { value: 10, timestamp: '2024-01-15T10:00:00' },
        { value: 12, timestamp: '2024-01-15T11:00:00' },
      ];
      const result = detectColumns(data);
      expect(result.timeColumn).toBe('timestamp');
    });

    it('should set high confidence when keywords match', () => {
      const data: DataRow[] = [
        { cycle_time: 10, operator: 'John' },
        { cycle_time: 12, operator: 'Jane' },
      ];
      const result = detectColumns(data);
      expect(result.confidence).toBe('high');
    });

    it('should set medium confidence when only outcome found', () => {
      const data: DataRow[] = [
        { value: 10, id: 1 },
        { value: 12, id: 2 },
        { value: 11, id: 3 },
      ];
      const result = detectColumns(data);
      expect(result.confidence).toBe('medium');
    });

    it('should not detect outcome if no numeric columns with variation', () => {
      const data: DataRow[] = [
        { constant: 10, text: 'A' },
        { constant: 10, text: 'B' },
      ];
      const result = detectColumns(data);
      expect(result.outcome).toBeNull();
    });

    it('should limit factors to 3', () => {
      const data: DataRow[] = [
        { value: 10, a: '1', b: '2', c: '3', d: '4', e: '5' },
        { value: 12, a: '2', b: '1', c: '2', d: '3', e: '4' },
      ];
      const result = detectColumns(data);
      expect(result.factors.length).toBeLessThanOrEqual(3);
    });

    it('should handle mixed type columns', () => {
      const data: DataRow[] = [
        { value: 10, mixed: '5' },
        { value: 12, mixed: 7 },
        { value: 11, mixed: '8.5' },
      ];
      const result = detectColumns(data);
      // mixed should be detected as numeric (90% threshold)
      expect(result.columnAnalysis.find(c => c.name === 'mixed')?.type).toBe('numeric');
    });

    it('should classify high cardinality text as text type', () => {
      const data: DataRow[] = [];
      for (let i = 0; i < 100; i++) {
        // Use text that won't be parsed as dates
        data.push({ value: i, comments: `CXYZ-${i.toString().padStart(5, '0')}-ABC` });
      }
      const result = detectColumns(data);
      const commentsCol = result.columnAnalysis.find(c => c.name === 'comments');
      expect(commentsCol?.type).toBe('text');
    });

    it('should provide column analysis with sample values', () => {
      const data: DataRow[] = [
        { value: 10, category: 'A' },
        { value: 12, category: 'B' },
        { value: 11, category: 'C' },
      ];
      const result = detectColumns(data);
      const catCol = result.columnAnalysis.find(c => c.name === 'category');
      expect(catCol?.sampleValues).toContain('A');
      expect(catCol?.sampleValues).toContain('B');
    });
  });

  describe('validateData', () => {
    it('should return empty report for null outcome column', () => {
      const data: DataRow[] = [{ value: 10 }, { value: 12 }];
      const result = validateData(data, null);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.excludedRows).toEqual([]);
      expect(result.columnIssues).toEqual([]);
    });

    it('should return empty report for empty data', () => {
      const result = validateData([], 'value');
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toBe(0);
      expect(result.excludedRows).toEqual([]);
    });

    it('should detect missing values in outcome column', () => {
      const data: DataRow[] = [
        { value: 10 },
        { value: null },
        { value: undefined },
        { value: '' },
        { value: 15 },
      ];
      const result = validateData(data, 'value');
      expect(result.excludedRows.length).toBe(3);
      expect(result.validRows).toBe(2);
      expect(result.columnIssues).toContainEqual({
        column: 'value',
        type: 'missing',
        count: 3,
        severity: 'warning',
      });
    });

    it('should detect non-numeric values in outcome column', () => {
      const data: DataRow[] = [
        { value: 10 },
        { value: 'not a number' },
        { value: 'NaN' },
        { value: 15 },
      ];
      const result = validateData(data, 'value');
      expect(result.excludedRows.length).toBe(2);
      expect(result.columnIssues).toContainEqual({
        column: 'value',
        type: 'non_numeric',
        count: 2,
        severity: 'warning',
      });
    });

    it('should accept numeric strings as valid', () => {
      const data: DataRow[] = [{ value: '10.5' }, { value: '12' }, { value: '-5.5' }];
      const result = validateData(data, 'value');
      expect(result.validRows).toBe(3);
      expect(result.excludedRows.length).toBe(0);
    });

    it('should detect no variation in outcome column', () => {
      const data: DataRow[] = [{ value: 10 }, { value: 10 }, { value: 10 }];
      const result = validateData(data, 'value');
      expect(result.columnIssues).toContainEqual({
        column: 'value',
        type: 'no_variation',
        count: 3,
        severity: 'info',
      });
    });

    it('should track row indices in excluded rows', () => {
      const data: DataRow[] = [
        { value: 10 },
        { value: null },
        { value: 12 },
        { value: 'bad' },
        { value: 15 },
      ];
      const result = validateData(data, 'value');
      expect(result.excludedRows.map(r => r.index)).toContain(1);
      expect(result.excludedRows.map(r => r.index)).toContain(3);
    });

    it('should include exclusion reasons', () => {
      const data: DataRow[] = [{ value: null }, { value: 'not_numeric' }];
      const result = validateData(data, 'value');

      const missingRow = result.excludedRows.find(r => r.index === 0);
      expect(missingRow?.reasons[0].type).toBe('missing');

      const nonNumericRow = result.excludedRows.find(r => r.index === 1);
      expect(nonNumericRow?.reasons[0].type).toBe('non_numeric');
      expect(nonNumericRow?.reasons[0].value).toBe('not_numeric');
    });

    it('should truncate long non-numeric values in reasons', () => {
      const longValue = 'a'.repeat(100);
      const data: DataRow[] = [{ value: longValue }];
      const result = validateData(data, 'value');
      expect(result.excludedRows[0].reasons[0].value?.length).toBeLessThanOrEqual(50);
    });

    it('should handle Infinity as non-numeric', () => {
      const data: DataRow[] = [{ value: Infinity }, { value: -Infinity }, { value: 10 }];
      const result = validateData(data, 'value');
      // Infinity should be excluded (it's not a finite number)
      // Note: The current implementation treats Infinity as number type,
      // but toNumericValue returns undefined for Infinity
      expect(result.validRows).toBe(1);
    });

    it('should handle NaN as non-numeric', () => {
      const data: DataRow[] = [{ value: NaN }, { value: 10 }];
      const result = validateData(data, 'value');
      // NaN should be excluded
      expect(result.validRows).toBe(1);
    });
  });
});
