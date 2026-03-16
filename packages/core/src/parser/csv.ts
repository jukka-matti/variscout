/**
 * CSV and text parsing — uses PapaParse for delimiter detection
 */

import Papa from 'papaparse';
import type { DataRow } from '../types';

/**
 * Parse a CSV file into an array of data rows
 *
 * @param file - The CSV file to parse
 * @returns Promise resolving to array of DataRow objects
 */
export async function parseCSV(file: File): Promise<DataRow[]> {
  const MAX_CSV_BYTES = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_CSV_BYTES) {
    throw new Error(
      `File too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum file size is 50 MB.`
    );
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data as DataRow[]),
      error: err => reject(err),
    });
  });
}

/**
 * Parse text (pasted from Excel, CSV, or tab-separated) into an array of data rows
 *
 * @param text - The text to parse (tab-separated, comma-separated, or quoted values)
 * @returns Promise resolving to array of DataRow objects
 * @throws Error if text is empty, has no rows, or fails to parse
 */
export async function parseText(text: string): Promise<DataRow[]> {
  const MAX_TEXT_LENGTH = 50 * 1024 * 1024; // 50 MB
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error('Pasted data is too large. Maximum is 50 MB.');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No data to parse. Paste rows from Excel or a CSV file.');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(trimmed, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: results => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`Could not parse data: ${results.errors[0].message}`));
          return;
        }
        const rows = results.data as DataRow[];
        if (rows.length === 0) {
          reject(new Error('No data rows found. Make sure your data includes a header row.'));
          return;
        }
        // Check that we got meaningful columns (not a single empty-string key)
        const columns = Object.keys(rows[0]);
        if (columns.length === 0 || (columns.length === 1 && columns[0] === '')) {
          reject(new Error('No columns detected. Make sure your data is tab or comma separated.'));
          return;
        }
        resolve(rows);
      },
      error: (err: Error) => reject(new Error(`Parse error: ${err.message}`)),
    });
  });
}
