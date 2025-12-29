/**
 * Table Manager for Excel Add-in
 *
 * Creates and manages Excel Tables from data ranges.
 * Tables are required for Slicer functionality.
 */

/**
 * Create an Excel Table from a data range
 *
 * @param rangeAddress - Address of the range (e.g., "Sheet1!A1:D100")
 * @param tableName - Name for the table (must be unique in workbook)
 * @returns The created table name
 */
export async function createTable(rangeAddress: string, tableName: string): Promise<string> {
  return Excel.run(async context => {
    const range = context.workbook.worksheets.getActiveWorksheet().getRange(rangeAddress);

    // Create table with headers in first row
    const table = context.workbook.worksheets.getActiveWorksheet().tables.add(range, true);
    table.name = tableName;

    // Style the table
    table.style = 'TableStyleMedium2';

    await context.sync();

    return table.name;
  });
}

/**
 * Get table by name (or null if not found)
 */
export async function getTable(tableName: string): Promise<Excel.Table | null> {
  return Excel.run(async context => {
    const table = context.workbook.worksheets
      .getActiveWorksheet()
      .tables.getItemOrNullObject(tableName);

    await context.sync();

    if (table.isNullObject) {
      return null;
    }

    return table;
  });
}

/**
 * Get all column names from a table
 */
export async function getTableColumns(tableName: string): Promise<string[]> {
  return Excel.run(async context => {
    const table = context.workbook.worksheets.getActiveWorksheet().tables.getItem(tableName);

    const headerRange = table.getHeaderRowRange();
    headerRange.load('values');
    await context.sync();

    return headerRange.values[0] as string[];
  });
}

/**
 * Detect column types from table data
 *
 * @returns Object with arrays of numeric and categorical column names
 */
export async function detectColumnTypes(
  tableName: string
): Promise<{ numeric: string[]; categorical: string[] }> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
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
 */
export async function ensureTable(
  rangeAddress: string,
  preferredName: string = 'VariScoutData'
): Promise<string> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();

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
      if (tableAddress.includes(rangeAddress.split('!')[1])) {
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

    return createTable(rangeAddress, uniqueName);
  });
}

/**
 * Delete a table (converts back to range)
 */
export async function deleteTable(tableName: string): Promise<void> {
  return Excel.run(async context => {
    const table = context.workbook.worksheets
      .getActiveWorksheet()
      .tables.getItemOrNullObject(tableName);

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
 */
export async function getTableRange(tableName: string): Promise<string | null> {
  return Excel.run(async context => {
    const table = context.workbook.worksheets
      .getActiveWorksheet()
      .tables.getItemOrNullObject(tableName);

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
 */
export async function getTableRowCount(tableName: string): Promise<number> {
  return Excel.run(async context => {
    const table = context.workbook.worksheets
      .getActiveWorksheet()
      .tables.getItemOrNullObject(tableName);

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
