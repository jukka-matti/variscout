/**
 * Excel data extraction utilities using Office.js API
 */

export interface SelectedData {
  /** The raw numeric values from the selected range */
  values: number[];
  /** The address of the selected range (e.g., "A1:A50") */
  address: string;
  /** Column header if available */
  header?: string;
  /** Factor data if a second column was selected */
  factors?: { column: string; values: string[] };
}

/**
 * Get the currently selected range data from Excel
 */
export async function getSelectedRangeData(): Promise<SelectedData | null> {
  return Excel.run(async context => {
    const range = context.workbook.getSelectedRange();
    range.load(['values', 'address', 'columnCount', 'rowCount']);

    await context.sync();

    if (range.rowCount === 0 || range.columnCount === 0) {
      return null;
    }

    const rawValues = range.values as (string | number | boolean)[][];
    const address = range.address;

    // Extract numeric values from the first column
    const numericValues: number[] = [];
    let header: string | undefined;

    // Check if first row might be a header
    const firstValue = rawValues[0]?.[0];
    const isFirstRowHeader = typeof firstValue === 'string' && isNaN(Number(firstValue));

    const startRow = isFirstRowHeader ? 1 : 0;
    if (isFirstRowHeader && typeof firstValue === 'string') {
      header = firstValue;
    }

    for (let i = startRow; i < rawValues.length; i++) {
      const val = rawValues[i][0];
      const num = typeof val === 'number' ? val : Number(val);
      if (!isNaN(num)) {
        numericValues.push(num);
      }
    }

    // If there's a second column, treat it as factors
    let factors: SelectedData['factors'];
    if (range.columnCount >= 2) {
      const factorValues: string[] = [];
      const factorHeader = isFirstRowHeader ? String(rawValues[0][1]) : undefined;

      for (let i = startRow; i < rawValues.length; i++) {
        factorValues.push(String(rawValues[i][1] ?? ''));
      }

      factors = {
        column: factorHeader || 'Factor',
        values: factorValues,
      };
    }

    return {
      values: numericValues,
      address,
      header,
      factors,
    };
  });
}

/**
 * Bind to a range so we can track changes
 */
export async function bindToRange(address: string): Promise<string> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const range = sheet.getRange(address);
    const binding = context.workbook.bindings.add(range, Excel.BindingType.range, 'dataBinding');
    binding.load('id');

    await context.sync();

    return binding.id;
  });
}

/**
 * Get data from a specific range address
 */
export async function getDataFromRange(address: string): Promise<SelectedData | null> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const range = sheet.getRange(address);
    range.load(['values', 'address', 'columnCount', 'rowCount']);

    await context.sync();

    if (range.rowCount === 0 || range.columnCount === 0) {
      return null;
    }

    const rawValues = range.values as (string | number | boolean)[][];

    // Extract numeric values
    const numericValues: number[] = [];
    let header: string | undefined;

    const firstValue = rawValues[0]?.[0];
    const isFirstRowHeader = typeof firstValue === 'string' && isNaN(Number(firstValue));

    const startRow = isFirstRowHeader ? 1 : 0;
    if (isFirstRowHeader && typeof firstValue === 'string') {
      header = firstValue;
    }

    for (let i = startRow; i < rawValues.length; i++) {
      const val = rawValues[i][0];
      const num = typeof val === 'number' ? val : Number(val);
      if (!isNaN(num)) {
        numericValues.push(num);
      }
    }

    // Factor column
    let factors: SelectedData['factors'];
    if (range.columnCount >= 2) {
      const factorValues: string[] = [];
      const factorHeader = isFirstRowHeader ? String(rawValues[0][1]) : undefined;

      for (let i = startRow; i < rawValues.length; i++) {
        factorValues.push(String(rawValues[i][1] ?? ''));
      }

      factors = {
        column: factorHeader || 'Factor',
        values: factorValues,
      };
    }

    return {
      values: numericValues,
      address,
      header,
      factors,
    };
  });
}

/**
 * Highlight cells that are out of spec
 */
export async function highlightOutOfSpec(
  address: string,
  usl?: number,
  lsl?: number
): Promise<void> {
  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const range = sheet.getRange(address);
    range.load(['values', 'rowCount']);

    await context.sync();

    const values = range.values as (string | number | boolean)[][];

    // Determine if first row is header
    const firstValue = values[0]?.[0];
    const isFirstRowHeader = typeof firstValue === 'string' && isNaN(Number(firstValue));
    const startRow = isFirstRowHeader ? 1 : 0;

    // Clear existing formatting
    range.format.fill.clear();

    // Apply conditional formatting
    for (let i = startRow; i < values.length; i++) {
      const val = Number(values[i][0]);
      if (isNaN(val)) continue;

      const cellAddress = `${address.split(':')[0].replace(/\d+/, '')}${i + 1}`;
      const cell = sheet.getRange(cellAddress);

      if (usl !== undefined && val > usl) {
        cell.format.fill.color = '#FEE2E2'; // Red for over USL
      } else if (lsl !== undefined && val < lsl) {
        cell.format.fill.color = '#FEF3C7'; // Yellow for under LSL
      } else if (usl !== undefined || lsl !== undefined) {
        cell.format.fill.color = '#D1FAE5'; // Green for in spec
      }
    }

    await context.sync();
  });
}
