/**
 * Test fixture loader — reads a CSV file from disk and parses it into DataRow[]
 * using PapaParse (same parser as the production parseCSV).
 *
 * This runs in the Vitest Node environment, so `fs` is available.
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import type { DataRow } from '../../types';

/** Repository root (five directories up from this file) */
const REPO_ROOT = path.resolve(__dirname, '../../../../..');

/**
 * Load a CSV file from docs/04-cases/ and parse it into DataRow[].
 *
 * @param relativePath - Path relative to the repo root, e.g. 'docs/04-cases/coffee/washing-station.csv'
 * @returns Parsed DataRow array with dynamic typing (numbers become numbers)
 */
export function loadCsv(relativePath: string): DataRow[] {
  const absolutePath = path.resolve(REPO_ROOT, relativePath);
  const csv = fs.readFileSync(absolutePath, 'utf-8');

  const result = Papa.parse(csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return result.data as DataRow[];
}
