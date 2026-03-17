/**
 * Excel file parsing — uses ExcelJS
 */

import ExcelJS from 'exceljs';
import type { DataRow, DataCellValue } from '../types';

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

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  // Get headers from first row
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? `Column${colNumber}`);
  });

  // Convert rows to objects
  const rows: DataRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    const rowData: DataRow = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        // Handle ExcelJS cell value types
        const cellValue = cell.value;
        if (cellValue === null || cellValue === undefined) {
          rowData[header] = null;
        } else if (typeof cellValue === 'object' && 'result' in cellValue) {
          // Formula cell - use the computed result
          rowData[header] = cellValue.result as DataCellValue;
        } else if (typeof cellValue === 'object' && 'richText' in cellValue) {
          // Rich text - concatenate text parts
          rowData[header] = (cellValue.richText as Array<{ text: string }>)
            .map(rt => rt.text)
            .join('');
        } else if (cellValue instanceof Date) {
          rowData[header] = cellValue.toISOString();
        } else {
          rowData[header] = cellValue as DataCellValue;
        }
      }
    });
    // Only add non-empty rows
    if (Object.keys(rowData).length > 0) {
      rows.push(rowData);
    }
  });

  return rows;
}
