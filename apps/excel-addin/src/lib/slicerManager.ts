/**
 * Slicer Manager for Excel Add-in
 *
 * Creates and manages Excel Slicers for filtering data.
 * Requires ExcelApi 1.10 (Excel 2021, Microsoft 365).
 *
 * Note: There are no native slicer selection events in Office.js,
 * so polling is required to detect changes.
 */

/**
 * Check if Slicers are supported in the current Excel version
 */
export function isSlicerSupported(): boolean {
  return Office.context.requirements.isSetSupported('ExcelApi', '1.10');
}

/**
 * Create a slicer for a table column
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the Excel Table
 * @param columnName - Column to create slicer for
 * @param options - Optional slicer configuration
 * @returns The created slicer name
 */
export async function createSlicer(
  sheetName: string,
  tableName: string,
  columnName: string,
  options?: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }
): Promise<string> {
  if (!isSlicerSupported()) {
    throw new Error('Slicers require Excel 2021 or Microsoft 365');
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.getItem(tableName);

    // Create slicer for the column
    const slicer = sheet.slicers.add(table, columnName, columnName);

    // Apply optional positioning
    if (options?.top !== undefined) slicer.top = options.top;
    if (options?.left !== undefined) slicer.left = options.left;
    if (options?.width !== undefined) slicer.width = options.width;
    if (options?.height !== undefined) slicer.height = options.height;

    // Set slicer style
    slicer.style = 'SlicerStyleLight1';

    slicer.load('name');
    await context.sync();

    return slicer.name;
  });
}

/**
 * Create multiple slicers arranged horizontally
 *
 * @param sheetName - Name of the worksheet containing the table
 * @param tableName - Name of the Excel Table
 * @param columnNames - Columns to create slicers for
 * @param startTop - Starting top position
 * @param startLeft - Starting left position
 * @returns Array of created slicer names
 */
export async function createSlicerRow(
  sheetName: string,
  tableName: string,
  columnNames: string[],
  startTop: number = 10,
  startLeft: number = 10
): Promise<string[]> {
  if (!isSlicerSupported()) {
    throw new Error('Slicers require Excel 2021 or Microsoft 365');
  }

  const slicerWidth = 150;
  const slicerHeight = 200;
  const gap = 10;

  const slicerNames: string[] = [];

  for (let i = 0; i < columnNames.length; i++) {
    const name = await createSlicer(sheetName, tableName, columnNames[i], {
      top: startTop,
      left: startLeft + i * (slicerWidth + gap),
      width: slicerWidth,
      height: slicerHeight,
    });
    slicerNames.push(name);
  }

  return slicerNames;
}

/**
 * Get the current selected items in a slicer
 *
 * @param sheetName - Name of the worksheet containing the slicer
 * @param slicerName - Name of the slicer
 * @returns Array of selected item values (or null if "Select All")
 */
export async function getSlicerSelectedItems(
  sheetName: string,
  slicerName: string
): Promise<string[] | null> {
  if (!isSlicerSupported()) {
    return null;
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicer = sheet.slicers.getItemOrNullObject(slicerName);

    await context.sync();

    if (slicer.isNullObject) {
      return null;
    }

    const slicerItems = slicer.slicerItems;
    slicerItems.load('items');
    await context.sync();

    const selectedItems: string[] = [];

    for (const item of slicerItems.items) {
      item.load(['name', 'isSelected']);
    }
    await context.sync();

    let allSelected = true;
    for (const item of slicerItems.items) {
      if (item.isSelected) {
        selectedItems.push(item.name);
      } else {
        allSelected = false;
      }
    }

    // If all items selected, return null (no filter applied)
    if (allSelected) {
      return null;
    }

    return selectedItems;
  });
}

/**
 * Get selections from all slicers
 *
 * @param sheetName - Name of the worksheet containing the slicers
 * @param slicerNames - Names of slicers to check
 * @returns Map of slicer name to selected items (null if all selected)
 */
export async function getAllSlicerSelections(
  sheetName: string,
  slicerNames: string[]
): Promise<Map<string, string[] | null>> {
  const selections = new Map<string, string[] | null>();

  for (const name of slicerNames) {
    const selected = await getSlicerSelectedItems(sheetName, name);
    selections.set(name, selected);
  }

  return selections;
}

/**
 * Clear slicer selection (select all items)
 *
 * @param sheetName - Name of the worksheet containing the slicer
 * @param slicerName - Name of the slicer
 */
export async function clearSlicerSelection(sheetName: string, slicerName: string): Promise<void> {
  if (!isSlicerSupported()) {
    return;
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicer = sheet.slicers.getItemOrNullObject(slicerName);

    await context.sync();

    if (!slicer.isNullObject) {
      slicer.clearFilters();
      await context.sync();
    }
  });
}

/**
 * Clear all slicer selections
 *
 * @param sheetName - Name of the worksheet containing the slicers
 * @param slicerNames - Names of slicers to clear
 */
export async function clearAllSlicerSelections(
  sheetName: string,
  slicerNames: string[]
): Promise<void> {
  for (const name of slicerNames) {
    await clearSlicerSelection(sheetName, name);
  }
}

/**
 * Delete a slicer
 *
 * @param sheetName - Name of the worksheet containing the slicer
 * @param slicerName - Name of the slicer to delete
 */
export async function deleteSlicer(sheetName: string, slicerName: string): Promise<void> {
  if (!isSlicerSupported()) {
    return;
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicer = sheet.slicers.getItemOrNullObject(slicerName);

    await context.sync();

    if (!slicer.isNullObject) {
      slicer.delete();
      await context.sync();
    }
  });
}

/**
 * Delete multiple slicers
 *
 * @param sheetName - Name of the worksheet containing the slicers
 * @param slicerNames - Names of slicers to delete
 */
export async function deleteSlicers(sheetName: string, slicerNames: string[]): Promise<void> {
  for (const name of slicerNames) {
    await deleteSlicer(sheetName, name);
  }
}

/**
 * Get all slicers on a sheet
 *
 * @param sheetName - Name of the worksheet to get slicers from
 */
export async function getAllSlicers(sheetName: string): Promise<string[]> {
  if (!isSlicerSupported()) {
    return [];
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicers = sheet.slicers;
    slicers.load('items');
    await context.sync();

    const names: string[] = [];
    for (const slicer of slicers.items) {
      slicer.load('name');
    }
    await context.sync();

    for (const slicer of slicers.items) {
      names.push(slicer.name);
    }

    return names;
  });
}

/**
 * Position a slicer
 *
 * @param sheetName - Name of the worksheet containing the slicer
 * @param slicerName - Name of the slicer to position
 * @param top - Top position in pixels
 * @param left - Left position in pixels
 */
export async function positionSlicer(
  sheetName: string,
  slicerName: string,
  top: number,
  left: number
): Promise<void> {
  if (!isSlicerSupported()) {
    return;
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicer = sheet.slicers.getItemOrNullObject(slicerName);

    await context.sync();

    if (!slicer.isNullObject) {
      slicer.top = top;
      slicer.left = left;
      await context.sync();
    }
  });
}

/**
 * Resize a slicer
 *
 * @param sheetName - Name of the worksheet containing the slicer
 * @param slicerName - Name of the slicer to resize
 * @param width - New width in pixels
 * @param height - New height in pixels
 */
export async function resizeSlicer(
  sheetName: string,
  slicerName: string,
  width: number,
  height: number
): Promise<void> {
  if (!isSlicerSupported()) {
    return;
  }

  return Excel.run(async context => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    const slicer = sheet.slicers.getItemOrNullObject(slicerName);

    await context.sync();

    if (!slicer.isNullObject) {
      slicer.width = width;
      slicer.height = height;
      await context.sync();
    }
  });
}
