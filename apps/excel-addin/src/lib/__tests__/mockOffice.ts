/**
 * Shared Office.js Mock Utilities for Excel Add-in Tests
 *
 * Provides mock implementations for Excel.run(), worksheets, tables, slicers, and ranges.
 */

import { vi } from 'vitest';

// Type definitions for our mocks
export interface MockRange {
  values: any[][];
  rowCount: number;
  address: string;
  isNullObject: boolean;
  load: ReturnType<typeof vi.fn>;
  getVisibleView: ReturnType<typeof vi.fn>;
}

export interface MockTable {
  name: string;
  style: string;
  isNullObject: boolean;
  load: ReturnType<typeof vi.fn>;
  getHeaderRowRange: ReturnType<typeof vi.fn>;
  getDataBodyRange: ReturnType<typeof vi.fn>;
  getRange: ReturnType<typeof vi.fn>;
  convertToRange: ReturnType<typeof vi.fn>;
}

export interface MockSlicer {
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
  style: string;
  isNullObject: boolean;
  slicerItems: {
    items: MockSlicerItem[];
    load: ReturnType<typeof vi.fn>;
  };
  load: ReturnType<typeof vi.fn>;
  clearFilters: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export interface MockSlicerItem {
  name: string;
  isSelected: boolean;
  load: ReturnType<typeof vi.fn>;
}

export interface MockWorksheet {
  tables: {
    add: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    getItemOrNullObject: ReturnType<typeof vi.fn>;
    items: MockTable[];
    load: ReturnType<typeof vi.fn>;
  };
  slicers: {
    add: ReturnType<typeof vi.fn>;
    getItemOrNullObject: ReturnType<typeof vi.fn>;
    items: MockSlicer[];
    load: ReturnType<typeof vi.fn>;
  };
  getRange: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock range object
 */
export function createMockRange(options: Partial<MockRange> = {}): MockRange {
  const range: MockRange = {
    values: options.values ?? [[]],
    rowCount: options.rowCount ?? options.values?.length ?? 0,
    address: options.address ?? 'Sheet1!A1:A1',
    isNullObject: options.isNullObject ?? false,
    load: vi.fn().mockReturnThis(),
    getVisibleView: vi.fn(),
  };

  // getVisibleView returns a range with same data (simulates visible view)
  // Use lazy evaluation to avoid infinite recursion
  range.getVisibleView.mockImplementation(() => ({
    values: range.values,
    rowCount: range.rowCount,
    address: range.address,
    isNullObject: false,
    load: vi.fn().mockReturnThis(),
    getVisibleView: vi.fn(),
  }));

  return range;
}

/**
 * Create a mock table object
 */
export function createMockTable(
  options: {
    name?: string;
    headers?: string[];
    data?: any[][];
    isNullObject?: boolean;
    rangeAddress?: string;
  } = {}
): MockTable {
  const headers = options.headers ?? ['Col1', 'Col2'];
  const data = options.data ?? [
    [1, 'A'],
    [2, 'B'],
  ];

  const headerRange = createMockRange({
    values: [headers],
    rowCount: 1,
  });

  const bodyRange = createMockRange({
    values: data,
    rowCount: data.length,
  });

  const fullRange = createMockRange({
    values: [headers, ...data],
    rowCount: data.length + 1,
    address: options.rangeAddress ?? 'Sheet1!A1:B3',
  });

  const table: MockTable = {
    name: options.name ?? 'TestTable',
    style: 'TableStyleMedium2',
    isNullObject: options.isNullObject ?? false,
    load: vi.fn().mockReturnThis(),
    getHeaderRowRange: vi.fn().mockReturnValue(headerRange),
    getDataBodyRange: vi.fn().mockReturnValue(bodyRange),
    getRange: vi.fn().mockReturnValue(fullRange),
    convertToRange: vi.fn(),
  };

  return table;
}

/**
 * Create a mock slicer object
 */
export function createMockSlicer(
  options: {
    name?: string;
    items?: { name: string; isSelected: boolean }[];
    isNullObject?: boolean;
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  } = {}
): MockSlicer {
  const items: MockSlicerItem[] = (
    options.items ?? [
      { name: 'Item1', isSelected: true },
      { name: 'Item2', isSelected: true },
    ]
  ).map(item => ({
    ...item,
    load: vi.fn().mockReturnThis(),
  }));

  const slicer: MockSlicer = {
    name: options.name ?? 'Slicer_Col1',
    top: options.top ?? 10,
    left: options.left ?? 10,
    width: options.width ?? 150,
    height: options.height ?? 200,
    style: 'SlicerStyleLight1',
    isNullObject: options.isNullObject ?? false,
    slicerItems: {
      items,
      load: vi.fn().mockReturnThis(),
    },
    load: vi.fn().mockReturnThis(),
    clearFilters: vi.fn(),
    delete: vi.fn(),
  };

  return slicer;
}

/**
 * Create a mock worksheet object
 */
export function createMockWorksheet(
  options: {
    tables?: MockTable[];
    slicers?: MockSlicer[];
  } = {}
): MockWorksheet {
  const tables = options.tables ?? [];
  const slicers = options.slicers ?? [];

  const worksheet: MockWorksheet = {
    tables: {
      add: vi.fn().mockImplementation((_range, _hasHeaders) => {
        const newTable = createMockTable();
        tables.push(newTable);
        return newTable;
      }),
      getItem: vi.fn().mockImplementation((name: string) => {
        const table = tables.find(t => t.name === name);
        return table ?? createMockTable({ name, isNullObject: true });
      }),
      getItemOrNullObject: vi.fn().mockImplementation((name: string) => {
        const table = tables.find(t => t.name === name);
        return table ?? createMockTable({ name, isNullObject: true });
      }),
      items: tables,
      load: vi.fn().mockReturnThis(),
    },
    slicers: {
      add: vi.fn().mockImplementation((_table, _columnName, slicerName) => {
        const newSlicer = createMockSlicer({ name: slicerName });
        slicers.push(newSlicer);
        return newSlicer;
      }),
      getItemOrNullObject: vi.fn().mockImplementation((name: string) => {
        const slicer = slicers.find(s => s.name === name);
        return slicer ?? createMockSlicer({ name, isNullObject: true });
      }),
      items: slicers,
      load: vi.fn().mockReturnThis(),
    },
    getRange: vi.fn().mockImplementation((address: string) => {
      return createMockRange({ address });
    }),
  };

  return worksheet;
}

/**
 * Set up global Excel mock
 */
export function setupExcelMock(worksheet: MockWorksheet): void {
  const mockContext = {
    workbook: {
      worksheets: {
        getItem: vi.fn().mockReturnValue(worksheet),
      },
    },
    sync: vi.fn().mockResolvedValue(undefined),
  };

  (globalThis as any).Excel = {
    run: vi.fn().mockImplementation(async (callback: (context: any) => Promise<any>) => {
      return callback(mockContext);
    }),
  };
}

/**
 * Set up global Office mock for slicer support checks
 */
export function setupOfficeMock(slicerSupported: boolean = true): void {
  (globalThis as any).Office = {
    context: {
      requirements: {
        isSetSupported: vi.fn().mockImplementation((api: string, version: string) => {
          if (api === 'ExcelApi' && version === '1.10') {
            return slicerSupported;
          }
          return true;
        }),
      },
    },
  };
}

/**
 * Clean up global mocks
 */
export function cleanupMocks(): void {
  delete (globalThis as any).Excel;
  delete (globalThis as any).Office;
}
