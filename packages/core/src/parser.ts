import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data),
      error: err => reject(err),
    });
  });
}

export async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      resolve(json);
    };
    reader.onerror = err => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function detectColumns(data: any[]) {
  if (data.length === 0) return { outcome: null, factors: [], timeColumn: null };
  const keys = Object.keys(data[0]);

  const numericCols = keys.filter(k => typeof data[0][k] === 'number');
  const catCols = keys.filter(
    k => typeof data[0][k] === 'string' || typeof data[0][k] === 'boolean'
  );

  // Heuristic: First numeric col is outcome, first 3 strings are factors
  return {
    outcome: numericCols[0] || null,
    factors: catCols.slice(0, 3),
    timeColumn:
      keys.find(k => k.toLowerCase().includes('time') || k.toLowerCase().includes('date')) || null,
  };
}
