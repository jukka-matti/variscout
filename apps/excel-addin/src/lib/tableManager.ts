/**
 * Table Manager for Excel Add-in
 *
 * Creates and manages Excel Tables from data ranges.
 * Tables are required for Slicer functionality.
 */

/**
 * Create an Excel Table from a data range
 *
 * @param sheetName - Name of the worksheet containing the data
 * @param rangeAddress - Address of the range (e.g., "A1:D100")
 * @param tableName - Name for the table (must be unique in workbook)
 * @returns The created table name
 */
export async function createTable(
  sheetName: string,
  rangeAddress: string,
  tableName: string
): Promise<string> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const range = sheet.getRange(rangeAddress);

    // Create table with headers in first row
    const table = sheet.tables.add(range, true);
    table.name = tableName;

    // Style the table
    table.style = 'TableStyleMedium2';

    await context.sync();

    return table.name;
  });
}

/**
 * Get table by name (or null if not found)
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table
 */
export async function getTable(sheetName: string, tableName: string): Promise<Excel.Table | null> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);

    await context.sync();

    if (table.isNullObject) {
      return null;
    }

    return table;
  });
}

/**
 * Get all column names from a table
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table
 */
export async function getTableColumns(sheetName: string, tableName: string): Promise<string[]> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItem(tableName);

    const headerRange = table.getHeaderRowRange();
    headerRange.load('values');
    await context.sync();

    return headerRange.values[0] as string[];
  });
}

/**
 * Detect column types from table data
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table
 * @returns Object with arrays of numeric and categorical column names
 */
export async function detectColumnTypes(
  sheetName: string,
  tableName: string
): Promise<{ numeric: string[]; categorical: string[] }> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItem(tableName);

    const headerRange = table.getHeaderRowRange();
    const bodyRange = table.getDataBodyRange();

    headerRange.load('values');
    bodyRange.load('values, rowCount');
    await context.sync();

    const headers = headerRange.values[0] as string[];
    const rows = bodyRange.values;

    const numeric: string[] = [];
    const categorical: string[] = [];

    // Sample first 10 rows to detect types
    const sampleSize = Math.min(10, rows.length);

    // Guard against empty data - return empty arrays
    if (sampleSize === 0) {
      return { numeric: [], categorical: [] };
    }

    headers.forEach((header, colIndex) => {
      let numericCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        const value = rows[i][colIndex];
        if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
          numericCount++;
        }
      }

      // If >70% of sampled values are numeric, consider column numeric
      if (numericCount / sampleSize > 0.7) {
        numeric.push(header);
      } else {
        categorical.push(header);
      }
    });

    return { numeric, categorical };
  });
}

/**
 * Convert a range to a table if not already a table
 *
 * Checks if the range is already part of a table;
 * if so, returns that table's name.
 *
 * @param sheetName - Name of the worksheet containing the range
 * @param rangeAddress - Address of the range (e.g., "A1:D100")
 * @param preferredName - Preferred name for the table (must be unique in workbook)
 */
export async function ensureTable(
  sheetName: string,
  rangeAddress: string,
  preferredName: string = 'VariScoutData'
): Promise<string> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);

    // Check if range intersects with any existing table
    const tables = sheet.tables;
    tables.load('items');
    await context.sync();

    // For each table, check if it contains our range
    for (const table of tables.items) {
      const tableRange = table.getRange();
      tableRange.load('address');
      await context.sync();

      // Simple check - if range is subset of table range, use that table
      // (More sophisticated intersection check could be added)
      const tableAddress = tableRange.address;
      // Safely extract range part without sheet name
      const parts = rangeAddress.split('!');
      const rangeWithoutSheet = parts.length > 1 ? parts[1] : parts[0];
      if (tableAddress.includes(rangeWithoutSheet)) {
        table.load('name');
        await context.sync();
        return table.name;
      }
    }

    // No existing table, create new one
    // Generate unique name if preferred name exists
    let uniqueName = preferredName;
    let counter = 1;

    while (true) {
      const existingTable = sheet.tables.getItemOrNullObject(uniqueName);
      await context.sync();

      if (existingTable.isNullObject) {
        break;
      }
      uniqueName = `${preferredName}${counter}`;
      counter++;
    }

    return createTable(sheetName, rangeAddress, uniqueName);
  });
}

/**
 * Delete a table (converts back to range)
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table to delete
 */
export async function deleteTable(sheetName: string, tableName: string): Promise<void> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);

    await context.sync();

    if (!table.isNullObject) {
      // Convert to range first (preserves data)
      table.convertToRange();
      await context.sync();
    }
  });
}

/**
 * Get the data range address of a table
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table
 */
export async function getTableRange(sheetName: string, tableName: string): Promise<string | null> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);

    await context.sync();

    if (table.isNullObject) {
      return null;
    }

    const range = table.getRange();
    range.load('address');
    await context.sync();

    return range.address;
  });
}

/**
 * Get the row count of a table (excluding header)
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the table
 */
export async function getTableRowCount(sheetName: string, tableName: string): Promise<number> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItemOrNullObject(tableName);

    await context.sync();

    if (table.isNullObject) {
      return 0;
    }

    const bodyRange = table.getDataBodyRange();
    bodyRange.load('rowCount');
    await context.sync();

    return bodyRange.rowCount;
  });
}
