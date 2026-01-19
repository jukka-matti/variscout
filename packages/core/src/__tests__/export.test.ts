import { describe, it, expect } from 'vitest';
import { getSpecStatus, generateCSV } from '../export';

describe('export module', () => {
  describe('getSpecStatus', () => {
    it('should return N/A when no specs defined', () => {
      expect(getSpecStatus(10, {})).toBe('N/A');
    });

    it('should return PASS when value within both limits', () => {
      expect(getSpecStatus(10, { usl: 15, lsl: 5 })).toBe('PASS');
    });

    it('should return PASS when value equals USL', () => {
      expect(getSpecStatus(15, { usl: 15, lsl: 5 })).toBe('PASS');
    });

    it('should return PASS when value equals LSL', () => {
      expect(getSpecStatus(5, { usl: 15, lsl: 5 })).toBe('PASS');
    });

    it('should return FAIL_USL when value exceeds USL', () => {
      expect(getSpecStatus(16, { usl: 15, lsl: 5 })).toBe('FAIL_USL');
    });

    it('should return FAIL_LSL when value below LSL', () => {
      expect(getSpecStatus(4, { usl: 15, lsl: 5 })).toBe('FAIL_LSL');
    });

    it('should return PASS with only USL defined (value under)', () => {
      expect(getSpecStatus(10, { usl: 15 })).toBe('PASS');
    });

    it('should return FAIL_USL with only USL defined (value over)', () => {
      expect(getSpecStatus(16, { usl: 15 })).toBe('FAIL_USL');
    });

    it('should return PASS with only LSL defined (value over)', () => {
      expect(getSpecStatus(10, { lsl: 5 })).toBe('PASS');
    });

    it('should return FAIL_LSL with only LSL defined (value under)', () => {
      expect(getSpecStatus(4, { lsl: 5 })).toBe('FAIL_LSL');
    });

    it('should handle negative values', () => {
      expect(getSpecStatus(-5, { usl: 0, lsl: -10 })).toBe('PASS');
      expect(getSpecStatus(-11, { usl: 0, lsl: -10 })).toBe('FAIL_LSL');
      expect(getSpecStatus(1, { usl: 0, lsl: -10 })).toBe('FAIL_USL');
    });

    it('should handle zero value', () => {
      expect(getSpecStatus(0, { usl: 10, lsl: -10 })).toBe('PASS');
    });

    it('should handle decimal values', () => {
      expect(getSpecStatus(10.5, { usl: 10.4, lsl: 5 })).toBe('FAIL_USL');
      expect(getSpecStatus(4.9, { usl: 15, lsl: 5 })).toBe('FAIL_LSL');
    });
  });

  describe('generateCSV', () => {
    it('should return empty string for empty data', () => {
      expect(generateCSV([], 'value', {})).toBe('');
    });

    it('should generate CSV with headers', () => {
      const data = [{ name: 'Test', value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      const lines = csv.split('\n');
      expect(lines[0]).toBe('name,value');
    });

    it('should include row numbers by default', () => {
      const data = [{ value: 10 }, { value: 20 }];
      const csv = generateCSV(data, 'value', {});
      const lines = csv.split('\n');
      expect(lines[0].startsWith('row_number')).toBe(true);
      expect(lines[1].startsWith('1,')).toBe(true);
      expect(lines[2].startsWith('2,')).toBe(true);
    });

    it('should include spec status when outcome specified', () => {
      const data = [{ value: 10 }, { value: 16 }, { value: 4 }];
      const csv = generateCSV(data, 'value', { usl: 15, lsl: 5 });
      const lines = csv.split('\n');
      expect(lines[0].endsWith('spec_status')).toBe(true);
      expect(lines[1]).toContain('PASS');
      expect(lines[2]).toContain('FAIL_USL');
      expect(lines[3]).toContain('FAIL_LSL');
    });

    it('should exclude spec status when option disabled', () => {
      const data = [{ value: 10 }];
      const csv = generateCSV(data, 'value', { usl: 15 }, { includeSpecStatus: false });
      expect(csv).not.toContain('spec_status');
    });

    it('should exclude row numbers when option disabled', () => {
      const data = [{ value: 10 }];
      const csv = generateCSV(data, 'value', {}, { includeRowNumbers: false });
      expect(csv).not.toContain('row_number');
    });

    it('should escape values with commas', () => {
      const data = [{ name: 'Test, with comma', value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      expect(csv).toContain('"Test, with comma"');
    });

    it('should escape values with quotes', () => {
      const data = [{ name: 'Test "quoted"', value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      expect(csv).toContain('"Test ""quoted"""');
    });

    it('should escape values with newlines', () => {
      const data = [{ name: 'Test\nwith\nnewline', value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      expect(csv).toContain('"Test\nwith\nnewline"');
    });

    it('should handle null values', () => {
      const data = [{ name: null, value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      const lines = csv.split('\n');
      expect(lines[1]).toBe(',10');
    });

    it('should handle undefined values', () => {
      const data = [{ name: undefined, value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      const lines = csv.split('\n');
      expect(lines[1]).toBe(',10');
    });

    it('should handle non-numeric outcome values for spec status', () => {
      const data = [{ value: 'not a number' }];
      const csv = generateCSV(data, 'value', { usl: 15 });
      expect(csv).toContain('N/A');
    });

    it('should handle no outcome column for spec status', () => {
      const data = [{ value: 10 }];
      const csv = generateCSV(data, null, { usl: 15 });
      expect(csv).not.toContain('spec_status');
    });

    it('should preserve column order from data', () => {
      const data = [{ z: 1, a: 2, m: 3 }];
      const csv = generateCSV(
        data,
        null,
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toEqual(['z', 'a', 'm']);
    });

    it('should handle boolean values', () => {
      const data = [{ flag: true, value: 10 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      expect(csv).toContain('true');
    });

    it('should handle numeric values correctly', () => {
      const data = [{ value: 0 }, { value: -5.5 }, { value: 1000000 }];
      const csv = generateCSV(
        data,
        'value',
        {},
        { includeRowNumbers: false, includeSpecStatus: false }
      );
      const lines = csv.split('\n');
      expect(lines[1]).toBe('0');
      expect(lines[2]).toBe('-5.5');
      expect(lines[3]).toBe('1000000');
    });

    it('should handle large datasets', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ value: i, name: `Row ${i}` }));
      const csv = generateCSV(data, 'value', {});
      const lines = csv.split('\n');
      expect(lines.length).toBe(1001); // 1 header + 1000 data rows
    });
  });
});
