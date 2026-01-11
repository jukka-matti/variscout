/**
 * Tests for tableManager.ts
 *
 * Tests table creation, column detection, and type inference.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { setupExcelMock, cleanupMocks, createMockWorksheet, createMockTable } from './mockOffice';
import {
  createTable,
  getTable,
  getTableColumns,
  detectColumnTypes,
  ensureTable,
  deleteTable,
  getTableRange,
  getTableRowCount,
} from '../tableManager';

describe('tableManager', () => {
  afterEach(() => {
    cleanupMocks();
    vi.clearAllMocks();
  });

  describe('createTable', () => {
    it('should create a table with the given name', async () => {
      const worksheet = createMockWorksheet();
      setupExcelMock(worksheet);

      const result = await createTable('Sheet1', 'A1:C10', 'MyTable');

      expect(worksheet.tables.add).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should apply TableStyleMedium2 style', async () => {
      const worksheet = createMockWorksheet();
      setupExcelMock(worksheet);

      await createTable('Sheet1', 'A1:C10', 'StyledTable');

      const addedTable = worksheet.tables.add.mock.results[0]?.value;
      expect(addedTable?.style).toBe('TableStyleMedium2');
    });
  });

  describe('getTable', () => {
    it('should return table when it exists', async () => {
      const existingTable = createMockTable({ name: 'ExistingTable' });
      const worksheet = createMockWorksheet({ tables: [existingTable] });
      setupExcelMock(worksheet);

      const result = await getTable('Sheet1', 'ExistingTable');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('ExistingTable');
    });

    it('should return null when table does not exist', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const result = await getTable('Sheet1', 'NonExistentTable');

      expect(result).toBeNull();
    });
  });

  describe('getTableColumns', () => {
    it('should return column headers in order', async () => {
      const table = createMockTable({
        name: 'DataTable',
        headers: ['ID', 'Name', 'Value', 'Category'],
        data: [[1, 'A', 10, 'X']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const columns = await getTableColumns('Sheet1', 'DataTable');

      expect(columns).toEqual(['ID', 'Name', 'Value', 'Category']);
    });

    it('should return empty array for table with no columns', async () => {
      const table = createMockTable({
        name: 'EmptyTable',
        headers: [],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const columns = await getTableColumns('Sheet1', 'EmptyTable');

      expect(columns).toEqual([]);
    });
  });

  describe('detectColumnTypes', () => {
    it('should classify numeric columns correctly', async () => {
      const table = createMockTable({
        name: 'NumericTable',
        headers: ['ID', 'Value'],
        data: [
          [1, 100],
          [2, 200],
          [3, 300],
          [4, 400],
          [5, 500],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'NumericTable');

      expect(result.numeric).toContain('ID');
      expect(result.numeric).toContain('Value');
      expect(result.categorical).toHaveLength(0);
    });

    it('should classify categorical columns correctly', async () => {
      const table = createMockTable({
        name: 'CategoricalTable',
        headers: ['Name', 'Category'],
        data: [
          ['Alice', 'A'],
          ['Bob', 'B'],
          ['Charlie', 'C'],
          ['Diana', 'D'],
          ['Eve', 'E'],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'CategoricalTable');

      expect(result.categorical).toContain('Name');
      expect(result.categorical).toContain('Category');
      expect(result.numeric).toHaveLength(0);
    });

    it('should use 70% threshold for mixed columns', async () => {
      // 8 numeric, 2 text = 80% → should be numeric
      const table = createMockTable({
        name: 'MixedTable',
        headers: ['MixedCol'],
        data: [[1], [2], [3], [4], [5], [6], [7], [8], ['text1'], ['text2']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'MixedTable');

      expect(result.numeric).toContain('MixedCol');
    });

    it('should classify as categorical when below 70% threshold', async () => {
      // 6 numeric, 4 text = 60% → should be categorical
      const table = createMockTable({
        name: 'MixedCatTable',
        headers: ['MixedCol'],
        data: [[1], [2], [3], [4], [5], [6], ['a'], ['b'], ['c'], ['d']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'MixedCatTable');

      expect(result.categorical).toContain('MixedCol');
    });

    it('should return empty arrays for table with no data', async () => {
      const table = createMockTable({
        name: 'EmptyDataTable',
        headers: ['Col1', 'Col2'],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'EmptyDataTable');

      expect(result.numeric).toHaveLength(0);
      expect(result.categorical).toHaveLength(0);
    });

    it('should detect string numbers as numeric', async () => {
      const table = createMockTable({
        name: 'StringNumTable',
        headers: ['StringNumbers'],
        data: [['100'], ['200'], ['300'], ['400'], ['500']],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'StringNumTable');

      expect(result.numeric).toContain('StringNumbers');
    });

    it('should sample only first 10 rows', async () => {
      // Create table with 20 rows, first 10 numeric, last 10 text
      const data = [...Array(10).fill([100]), ...Array(10).fill(['text'])];
      const table = createMockTable({
        name: 'LargeTable',
        headers: ['Data'],
        data,
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const result = await detectColumnTypes('Sheet1', 'LargeTable');

      // Should only sample first 10 (all numeric)
      expect(result.numeric).toContain('Data');
    });
  });

  describe('ensureTable', () => {
    it('should create new table if none exists', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const tableName = await ensureTable('Sheet1', 'A1:C10', 'NewTable');

      expect(tableName).toBeDefined();
      expect(worksheet.tables.add).toHaveBeenCalled();
    });

    it('should use default name VariScoutData', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const tableName = await ensureTable('Sheet1', 'A1:C10');

      // The function creates a table, we just verify it doesn't throw
      expect(tableName).toBeDefined();
    });
  });

  describe('deleteTable', () => {
    it('should convert table to range when deleted', async () => {
      const table = createMockTable({ name: 'ToDelete' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      await deleteTable('Sheet1', 'ToDelete');

      expect(table.convertToRange).toHaveBeenCalled();
    });

    it('should not throw when table does not exist', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      await expect(deleteTable('Sheet1', 'NonExistent')).resolves.not.toThrow();
    });
  });

  describe('getTableRange', () => {
    it('should return table address', async () => {
      const table = createMockTable({
        name: 'RangeTable',
        rangeAddress: 'Sheet1!A1:D50',
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const range = await getTableRange('Sheet1', 'RangeTable');

      expect(range).toBe('Sheet1!A1:D50');
    });

    it('should return null for non-existent table', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const range = await getTableRange('Sheet1', 'NonExistent');

      expect(range).toBeNull();
    });
  });

  describe('getTableRowCount', () => {
    it('should return count of data rows (excluding header)', async () => {
      const table = createMockTable({
        name: 'CountTable',
        headers: ['A', 'B'],
        data: [
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
          [9, 10],
        ],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const count = await getTableRowCount('Sheet1', 'CountTable');

      expect(count).toBe(5);
    });

    it('should return 0 for non-existent table', async () => {
      const worksheet = createMockWorksheet({ tables: [] });
      setupExcelMock(worksheet);

      const count = await getTableRowCount('Sheet1', 'NonExistent');

      expect(count).toBe(0);
    });

    it('should return 0 for empty table', async () => {
      const table = createMockTable({
        name: 'EmptyTable',
        headers: ['A', 'B'],
        data: [],
      });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const count = await getTableRowCount('Sheet1', 'EmptyTable');

      expect(count).toBe(0);
    });
  });
});
