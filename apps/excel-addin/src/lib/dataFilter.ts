/**
 * Data Filter Utilities
 *
 * Reads filtered data from Excel Tables.
 * When slicers filter the table, getVisibleView() returns only visible rows.
 */

/**
 * Get filtered data from an Excel Table
 *
 * Uses getVisibleView() to respect slicer/AutoFilter selections.
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the Excel Table
 * @param outcomeColumn - Column name for outcome variable
 * @param factorColumns - Column names for factor variables
 * @returns Array of row objects with specified columns
 */
export async function getFilteredTableData(
  sheetName: string,
  tableName: string,
  outcomeColumn: string,
  factorColumns: string[]
): Promise<Record<string, any>[]> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);
    await context.sync();

    if (table.isNullObject) {
      console.warn(`Table "${tableName}" not found`);
      return [];
    }

    // Get header row to find column indices
    const headerRange = table.getHeaderRowRange();
    headerRange.load('values');
    await context.sync();

    const headers = headerRange.values[0] as string[];
    const outcomeIndex = headers.indexOf(outcomeColumn);

    if (outcomeIndex === -1) {
      console.warn(`Outcome column "${outcomeColumn}" not found in table`);
      return [];
    }

    const factorIndices = factorColumns.map(col => ({
      name: col,
      index: headers.indexOf(col),
    }));

    // Get visible rows (respects slicer/filter selections)
    const bodyRange = table.getDataBodyRange();
    const visibleRange = bodyRange.getVisibleView();
    visibleRange.load('values');
    await context.sync();

    // Transform to row objects
    const rows: Record<string, any>[] = [];

    for (const row of visibleRange.values) {
      const obj: Record<string, any> = {};

      // Add outcome value
      obj[outcomeColumn] = row[outcomeIndex];

      // Add factor values
      for (const { name, index } of factorIndices) {
        if (index !== -1) {
          obj[name] = row[index];
        }
      }

      rows.push(obj);
    }

    return rows;
  });
}

/**
 * Get all unique values for a column (for filter UI)
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the Excel Table
 * @param columnName - Column name to get unique values from
 * @returns Array of unique values
 */
export async function getColumnUniqueValues(
  sheetName: string,
  tableName: string,
  columnName: string
): Promise<string[]> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItem(tableName);

    // Get header to find column index
    const headerRange = table.getHeaderRowRange();
    headerRange.load('values');
    await context.sync();

    const headers = headerRange.values[0] as string[];
    const columnIndex = headers.indexOf(columnName);

    if (columnIndex === -1) {
      return [];
    }

    // Get all data (not just visible)
    const bodyRange = table.getDataBodyRange();
    bodyRange.load('values');
    await context.sync();

    // Extract unique values
    const uniqueValues = new Set<string>();
    for (const row of bodyRange.values) {
      const value = row[columnIndex];
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(String(value));
      }
    }

    return Array.from(uniqueValues).sort();
  });
}

/**
 * Get row count for filtered data
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the Excel Table
 * @returns Number of visible rows
 */
export async function getFilteredRowCount(sheetName: string, tableName: string): Promise<number> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);
    await context.sync();

    if (table.isNullObject) {
      return 0;
    }

    const bodyRange = table.getDataBodyRange();
    const visibleRange = bodyRange.getVisibleView();
    visibleRange.load('rowCount');
    await context.sync();

    return visibleRange.rowCount;
  });
}
