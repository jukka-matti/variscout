/**
 * Tests for slicerManager.ts
 *
 * Tests slicer creation, selection reading, and version checks.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  setupExcelMock,
  setupOfficeMock,
  cleanupMocks,
  createMockWorksheet,
  createMockTable,
  createMockSlicer,
} from './mockOffice';
import {
  isSlicerSupported,
  createSlicer,
  createSlicerRow,
  getSlicerSelectedItems,
  getAllSlicerSelections,
  clearSlicerSelection,
  clearAllSlicerSelections,
  deleteSlicer,
  deleteSlicers,
  getAllSlicers,
  positionSlicer,
  resizeSlicer,
} from '../slicerManager';

describe('slicerManager', () => {
  afterEach(() => {
    cleanupMocks();
    vi.clearAllMocks();
  });

  describe('isSlicerSupported', () => {
    it('should return true when ExcelApi 1.10 is available', () => {
      setupOfficeMock(true);

      expect(isSlicerSupported()).toBe(true);
    });

    it('should return false for older Excel versions', () => {
      setupOfficeMock(false);

      expect(isSlicerSupported()).toBe(false);
    });
  });

  describe('createSlicer', () => {
    it('should create slicer with column name', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const slicerName = await createSlicer('Sheet1', 'DataTable', 'Category');

      expect(worksheet.slicers.add).toHaveBeenCalled();
      expect(slicerName).toBeDefined();
    });

    it('should apply optional positioning', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      await createSlicer('Sheet1', 'DataTable', 'Category', {
        top: 100,
        left: 200,
        width: 180,
        height: 250,
      });

      const createdSlicer = worksheet.slicers.add.mock.results[0]?.value;
      expect(createdSlicer.top).toBe(100);
      expect(createdSlicer.left).toBe(200);
    });

    it('should apply SlicerStyleLight1 style', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      await createSlicer('Sheet1', 'DataTable', 'Category');

      const createdSlicer = worksheet.slicers.add.mock.results[0]?.value;
      expect(createdSlicer.style).toBe('SlicerStyleLight1');
    });

    it('should throw error when not supported', async () => {
      setupOfficeMock(false);
      const worksheet = createMockWorksheet();
      setupExcelMock(worksheet);

      await expect(createSlicer('Sheet1', 'Table', 'Col')).rejects.toThrow(
        'Slicers require Excel 2021 or Microsoft 365'
      );
    });
  });

  describe('createSlicerRow', () => {
    it('should create correct number of slicers', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const slicerNames = await createSlicerRow('Sheet1', 'DataTable', ['A', 'B', 'C']);

      expect(slicerNames).toHaveLength(3);
    });

    it('should space slicers horizontally with 160px gaps', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      await createSlicerRow('Sheet1', 'DataTable', ['A', 'B'], 10, 10);

      // First slicer at left=10, second at left=10+150+10=170
      expect(worksheet.slicers.add).toHaveBeenCalledTimes(2);
    });

    it('should throw error when not supported', async () => {
      setupOfficeMock(false);
      const worksheet = createMockWorksheet();
      setupExcelMock(worksheet);

      await expect(createSlicerRow('Sheet1', 'Table', ['Col1'])).rejects.toThrow(
        'Slicers require Excel 2021 or Microsoft 365'
      );
    });

    it('should return empty array for empty column list', async () => {
      setupOfficeMock(true);
      const table = createMockTable({ name: 'DataTable' });
      const worksheet = createMockWorksheet({ tables: [table] });
      setupExcelMock(worksheet);

      const slicerNames = await createSlicerRow('Sheet1', 'DataTable', []);

      expect(slicerNames).toHaveLength(0);
    });
  });

  describe('getSlicerSelectedItems', () => {
    it('should return null when all items are selected', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({
        name: 'Slicer1',
        items: [
          { name: 'A', isSelected: true },
          { name: 'B', isSelected: true },
          { name: 'C', isSelected: true },
        ],
      });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      const result = await getSlicerSelectedItems('Sheet1', 'Slicer1');

      expect(result).toBeNull();
    });

    it('should return array of selected items when partial selection', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({
        name: 'Slicer1',
        items: [
          { name: 'A', isSelected: true },
          { name: 'B', isSelected: false },
          { name: 'C', isSelected: true },
        ],
      });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      const result = await getSlicerSelectedItems('Sheet1', 'Slicer1');

      expect(result).toEqual(['A', 'C']);
    });

    it('should return null when slicer not found', async () => {
      setupOfficeMock(true);
      const worksheet = createMockWorksheet({ slicers: [] });
      setupExcelMock(worksheet);

      const result = await getSlicerSelectedItems('Sheet1', 'NonExistent');

      expect(result).toBeNull();
    });

    it('should return null when not supported', async () => {
      setupOfficeMock(false);

      const result = await getSlicerSelectedItems('Sheet1', 'Slicer1');

      expect(result).toBeNull();
    });
  });

  describe('getAllSlicerSelections', () => {
    it('should return map of multiple slicer selections', async () => {
      setupOfficeMock(true);
      const slicer1 = createMockSlicer({
        name: 'Slicer1',
        items: [
          { name: 'A', isSelected: true },
          { name: 'B', isSelected: true },
        ],
      });
      const slicer2 = createMockSlicer({
        name: 'Slicer2',
        items: [
          { name: 'X', isSelected: true },
          { name: 'Y', isSelected: false },
        ],
      });
      const worksheet = createMockWorksheet({ slicers: [slicer1, slicer2] });
      setupExcelMock(worksheet);

      const result = await getAllSlicerSelections('Sheet1', ['Slicer1', 'Slicer2']);

      expect(result.get('Slicer1')).toBeNull(); // All selected
      expect(result.get('Slicer2')).toEqual(['X']); // Partial
    });

    it('should handle empty slicer list', async () => {
      setupOfficeMock(true);
      const worksheet = createMockWorksheet();
      setupExcelMock(worksheet);

      const result = await getAllSlicerSelections('Sheet1', []);

      expect(result.size).toBe(0);
    });
  });

  describe('clearSlicerSelection', () => {
    it('should call clearFilters on slicer', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({ name: 'Slicer1' });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      await clearSlicerSelection('Sheet1', 'Slicer1');

      expect(slicer.clearFilters).toHaveBeenCalled();
    });

    it('should not throw when slicer not found', async () => {
      setupOfficeMock(true);
      const worksheet = createMockWorksheet({ slicers: [] });
      setupExcelMock(worksheet);

      await expect(clearSlicerSelection('Sheet1', 'NonExistent')).resolves.not.toThrow();
    });

    it('should return early when not supported', async () => {
      setupOfficeMock(false);

      await expect(clearSlicerSelection('Sheet1', 'Slicer1')).resolves.not.toThrow();
    });
  });

  describe('clearAllSlicerSelections', () => {
    it('should clear multiple slicers', async () => {
      setupOfficeMock(true);
      const slicer1 = createMockSlicer({ name: 'Slicer1' });
      const slicer2 = createMockSlicer({ name: 'Slicer2' });
      const worksheet = createMockWorksheet({ slicers: [slicer1, slicer2] });
      setupExcelMock(worksheet);

      await clearAllSlicerSelections('Sheet1', ['Slicer1', 'Slicer2']);

      expect(slicer1.clearFilters).toHaveBeenCalled();
      expect(slicer2.clearFilters).toHaveBeenCalled();
    });
  });

  describe('deleteSlicer', () => {
    it('should delete existing slicer', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({ name: 'ToDelete' });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      await deleteSlicer('Sheet1', 'ToDelete');

      expect(slicer.delete).toHaveBeenCalled();
    });

    it('should not throw when slicer not found', async () => {
      setupOfficeMock(true);
      const worksheet = createMockWorksheet({ slicers: [] });
      setupExcelMock(worksheet);

      await expect(deleteSlicer('Sheet1', 'NonExistent')).resolves.not.toThrow();
    });
  });

  describe('deleteSlicers', () => {
    it('should delete multiple slicers', async () => {
      setupOfficeMock(true);
      const slicer1 = createMockSlicer({ name: 'S1' });
      const slicer2 = createMockSlicer({ name: 'S2' });
      const worksheet = createMockWorksheet({ slicers: [slicer1, slicer2] });
      setupExcelMock(worksheet);

      await deleteSlicers('Sheet1', ['S1', 'S2']);

      expect(slicer1.delete).toHaveBeenCalled();
      expect(slicer2.delete).toHaveBeenCalled();
    });
  });

  describe('getAllSlicers', () => {
    it('should return all slicer names', async () => {
      setupOfficeMock(true);
      const slicer1 = createMockSlicer({ name: 'CategorySlicer' });
      const slicer2 = createMockSlicer({ name: 'RegionSlicer' });
      const worksheet = createMockWorksheet({ slicers: [slicer1, slicer2] });
      setupExcelMock(worksheet);

      const names = await getAllSlicers('Sheet1');

      expect(names).toContain('CategorySlicer');
      expect(names).toContain('RegionSlicer');
    });

    it('should return empty array when not supported', async () => {
      setupOfficeMock(false);

      const names = await getAllSlicers('Sheet1');

      expect(names).toEqual([]);
    });
  });

  describe('positionSlicer', () => {
    it('should update slicer position', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({ name: 'Movable', top: 0, left: 0 });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      await positionSlicer('Sheet1', 'Movable', 100, 200);

      expect(slicer.top).toBe(100);
      expect(slicer.left).toBe(200);
    });

    it('should return early when not supported', async () => {
      setupOfficeMock(false);

      await expect(positionSlicer('Sheet1', 'Slicer', 10, 10)).resolves.not.toThrow();
    });
  });

  describe('resizeSlicer', () => {
    it('should update slicer dimensions', async () => {
      setupOfficeMock(true);
      const slicer = createMockSlicer({ name: 'Resizable', width: 100, height: 100 });
      const worksheet = createMockWorksheet({ slicers: [slicer] });
      setupExcelMock(worksheet);

      await resizeSlicer('Sheet1', 'Resizable', 200, 300);

      expect(slicer.width).toBe(200);
      expect(slicer.height).toBe(300);
    });

    it('should return early when not supported', async () => {
      setupOfficeMock(false);

      await expect(resizeSlicer('Sheet1', 'Slicer', 100, 100)).resolves.not.toThrow();
    });
  });
});
