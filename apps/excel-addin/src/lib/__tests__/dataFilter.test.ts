/**
 * Tests for dataFilter.ts
 *
 * Tests filtered data extraction and unique value retrieval.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { setupExcelMock, cleanupMocks, createMockWorksheet, createMockTable } from './mockOffice';
import { getFilteredTableData, getColumnUniqueValues, getFilteredRowCount } from '../dataFilter';

describe('dataFilter', () => {
  afterEach(() => {
    cleanupMocks();
    vi.clearAllMocks();
  });

  describe('getFilteredTableData', () => {
    it('should return all columns (outcome + factors) in row objects', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['ID', 'Outcome', 'Factor1', 'Factor2'],
        data: [
          [1, 10.5, 'A', 'X'],
          [2, 11.2, 'B', 'Y'],
          [3, 9.8, 'A', 'Z'],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const rows = await getFilteredTableData('Sheet1', 'DataTable', 'Outcome', [
        'Factor1',
        'Factor2',
      ]);

      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveProperty('Outcome', 10.5);
      expect(rows[0]).toHaveProperty('Factor1', 'A');
      expect(rows[0]).toHaveProperty('Factor2', 'X');
    });

    it('should extract outcome column correctly', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Value', 'Category'],
        data: [
          [100, 'A'],
          [200, 'B'],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const rows = await getFilteredTableData('Sheet1', 'DataTable', 'Value', []);

      expect(rows[0].Value).toBe(100);
      expect(rows[1].Value).toBe(200);
    });

    it('should skip missing factor columns gracefully', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Outcome', 'ExistingFactor'],
        data: [[10, 'A']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const rows = await getFilteredTableData('Sheet1', 'DataTable', 'Outcome', [
        'ExistingFactor',
        'NonExistentFactor',
      ]);

      expect(rows[0]).toHaveProperty('ExistingFactor', 'A');
      expect(rows[0]).not.toHaveProperty('NonExistentFactor');
    });

    it('should return empty array when outcome column missing', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Col1', 'Col2'],
        data: [[1, 2]],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rows = await getFilteredTableData('Sheet1', 'DataTable', 'NonExistentOutcome', []);

      expect(rows).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should return empty array when table not found', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rows = await getFilteredTableData('Sheet1', 'NonExistentTable', 'Outcome', []);

      expect(rows).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should handle empty table (no data rows)', async () => {
      const table = createMockTable({
        name: 'EmptyTable',
        headers: ['Outcome', 'Factor'],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const rows = await getFilteredTableData('Sheet1', 'EmptyTable', 'Outcome', ['Factor']);

      expect(rows).toHaveLength(0);
    });

    it('should handle numeric and string outcomes', async () => {
      const table = createMockTable({
        name: 'MixedTable',
        headers: ['NumOutcome', 'StrOutcome'],
        data: [
          [42, 'text'],
          [3.14, 'more text'],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const numRows = await getFilteredTableData('Sheet1', 'MixedTable', 'NumOutcome', []);
      expect(numRows[0].NumOutcome).toBe(42);
      expect(numRows[1].NumOutcome).toBe(3.14);

      const strRows = await getFilteredTableData('Sheet1', 'MixedTable', 'StrOutcome', []);
      expect(strRows[0].StrOutcome).toBe('text');
    });
  });

  describe('getColumnUniqueValues', () => {
    it('should return unique values only', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Category'],
        data: [['A'], ['B'], ['A'], ['C'], ['B'], ['A']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'DataTable', 'Category');

      expect(values).toHaveLength(3);
      expect(values).toContain('A');
      expect(values).toContain('B');
      expect(values).toContain('C');
    });

    it('should return sorted values', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Letters'],
        data: [['Z'], ['A'], ['M'], ['B']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'DataTable', 'Letters');

      expect(values).toEqual(['A', 'B', 'M', 'Z']);
    });

    it('should ignore null, undefined, and empty string values', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Values'],
        data: [['Valid'], [null], ['Also Valid'], [undefined], [''], ['Third']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'DataTable', 'Values');

      expect(values).not.toContain('');
      expect(values).not.toContain(null);
      expect(values).toContain('Valid');
      expect(values).toContain('Also Valid');
      expect(values).toContain('Third');
    });

    it('should convert numeric values to strings', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['Numbers'],
        data: [[1], [2], [3], [1]],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'DataTable', 'Numbers');

      expect(values).toContain('1');
      expect(values).toContain('2');
      expect(values).toContain('3');
      expect(values).toHaveLength(3);
    });

    it('should return empty array for missing column', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['ExistingCol'],
        data: [['A']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'DataTable', 'NonExistentCol');

      expect(values).toEqual([]);
    });

    it('should return empty array for empty table', async () => {
      const table = createMockTable({
        name: 'EmptyTable',
        headers: ['Col'],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const values = await getColumnUniqueValues('Sheet1', 'EmptyTable', 'Col');

      expect(values).toEqual([]);
    });
  });

  describe('getFilteredRowCount', () => {
    it('should return count of visible rows', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['A', 'B'],
        data: [
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const count = await getFilteredRowCount('Sheet1', 'DataTable');

      expect(count).toBe(4);
    });

    it('should return 0 for non-existent table', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const count = await getFilteredRowCount('Sheet1', 'NonExistent');

      expect(count).toBe(0);
    });

    it('should return 0 for empty table', async () => {
      const table = createMockTable({
        name: 'EmptyTable',
        headers: ['Col'],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const count = await getFilteredRowCount('Sheet1', 'EmptyTable');

      expect(count).toBe(0);
    });
  });
});
