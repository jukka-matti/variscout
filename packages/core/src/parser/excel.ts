/**
 * Excel file parsing — uses read-excel-file (39 KB vs 948 KB ExcelJS)
 * Dynamic import keeps it out of the main chunk entirely.
 */

import type { DataRow } from '../types';

/**
 * Parse an Excel file into an array of data rows
 *
 * @param file - The Excel file to parse
 * @returns Promise resolving to array of DataRow objects
 */
export async function parseExcel(file: File): Promise<DataRow[]> {
  const MAX_EXCEL_BYTES = 25 * 1024 * 1024; // 25 MB
  if (file.size > MAX_EXCEL_BYTES) {
    throw new Error(
      `File too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum file size is 25 MB.`
    );
  }

  const { default: readXlsxFile } = await import('read-excel-file');
  const rawRows = await readXlsxFile(file);
  if (rawRows.length === 0) return [];

  const headers = rawRows[0].map((h, i) => String(h ?? `Column${i + 1}`));
  const rows: DataRow[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const rowData: DataRow = {};
    for (let c = 0; c < headers.length; c++) {
      const val = rawRows[r][c];
      if (val === null || val === undefined) {
        rowData[headers[c]] = null;
      } else if (val instanceof Date) {
        rowData[headers[c]] = val.toISOString();
      } else {
        rowData[headers[c]] = val as string | number | boolean;
      }
    }
    if (Object.keys(rowData).length > 0) {
      rows.push(rowData);
    }
  }
  return rows;
}
