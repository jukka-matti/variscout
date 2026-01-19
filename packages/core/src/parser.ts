import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DataRow, DataCellValue } from './types';
import { toNumericValue } from './types';

// ============================================================================
// Keyword lists for smart column detection
// ============================================================================

const OUTCOME_KEYWORDS = [
  'time',
  'duration',
  'cycle',
  'lead',
  'ct',
  'weight',
  'length',
  'width',
  'height',
  'thickness',
  'temperature',
  'temp',
  'pressure',
  'value',
  'measurement',
  'result',
  'y',
  'response',
  'yield',
  'output',
  'reading',
  'score',
  'rate',
  'speed',
  'velocity',
  'flow',
  'volume',
  'density',
  'concentration',
];

const FACTOR_KEYWORDS = [
  'shift',
  'operator',
  'machine',
  'line',
  'cell',
  'product',
  'batch',
  'supplier',
  'day',
  'week',
  'station',
  'tool',
  'lot',
  'group',
  'team',
  'department',
  'plant',
  'site',
  'vendor',
  'type',
  'category',
  'model',
  'version',
];

const TIME_KEYWORDS = ['date', 'time', 'timestamp', 'datetime', 'created', 'recorded', 'when'];

// ============================================================================
// Types
// ============================================================================

export interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  uniqueCount: number;
  hasVariation: boolean;
  missingCount: number;
  sampleValues: string[];
}

export interface DetectedColumns {
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  confidence: 'high' | 'medium' | 'low';
  columnAnalysis: ColumnAnalysis[];
}

export interface ExclusionReason {
  type: 'missing' | 'non_numeric' | 'empty';
  column: string;
  value?: string;
}

export interface ExcludedRow {
  index: number;
  reasons: ExclusionReason[];
}

export interface ColumnIssue {
  column: string;
  type: 'missing' | 'non_numeric' | 'no_variation' | 'all_empty';
  count: number;
  severity: 'warning' | 'info';
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
}

export interface ParetoRow {
  category: string;
  count: number;
  value?: number;
}

// ============================================================================
// Parsing functions
// ============================================================================

/**
 * Parse a CSV file into an array of data rows
 *
 * @param file - The CSV file to parse
 * @returns Promise resolving to array of DataRow objects
 */
export async function parseCSV(file: File): Promise<DataRow[]> {
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
 * Parse an Excel file into an array of data rows
 *
 * @param file - The Excel file to parse
 * @returns Promise resolving to array of DataRow objects
 */
export async function parseExcel(file: File): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as DataRow[];
      resolve(json);
    };
    reader.onerror = err => reject(err);
    reader.readAsBinaryString(file);
  });
}

// ============================================================================
// Column analysis
// ============================================================================

/**
 * Analyze a single column to determine its type and characteristics.
 * Samples multiple rows (not just the first) for better accuracy.
 *
 * @param data - Array of data rows
 * @param colName - Name of the column to analyze
 * @returns ColumnAnalysis with type, uniqueness, and sample values
 */
function analyzeColumn(data: DataRow[], colName: string): ColumnAnalysis {
  const values: DataCellValue[] = data.map(row => row[colName]);
  const nonNullValues = values.filter(
    (v): v is NonNullable<DataCellValue> => v !== null && v !== undefined && v !== ''
  );

  // Count missing values
  const missingCount = values.length - nonNullValues.length;

  // Get unique values
  const uniqueValues = new Set(nonNullValues.map(v => String(v)));
  const uniqueCount = uniqueValues.size;
  const hasVariation = uniqueCount > 1;

  // Sample values for preview
  const sampleValues = Array.from(uniqueValues).slice(0, 5);

  // Determine type by checking all non-null values
  const numericCount = nonNullValues.filter(v => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      return !isNaN(parsed) && isFinite(parsed);
    }
    return false;
  }).length;

  const isNumeric = nonNullValues.length > 0 && numericCount >= nonNullValues.length * 0.9;

  // Check for date patterns (simple heuristic)
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US/EU date
    /^\d{1,2}-\d{1,2}-\d{2,4}/, // Dash date
  ];
  const isDate =
    !isNumeric &&
    nonNullValues.length > 0 &&
    nonNullValues.slice(0, 10).some(v => {
      const str = String(v);
      return datePatterns.some(p => p.test(str)) || !isNaN(Date.parse(str));
    });

  // Determine type
  let type: 'numeric' | 'categorical' | 'date' | 'text';
  if (isNumeric) {
    type = 'numeric';
  } else if (isDate) {
    type = 'date';
  } else if (uniqueCount <= 50) {
    // Reasonable number of unique values for categorical
    type = 'categorical';
  } else {
    type = 'text'; // High cardinality text field
  }

  return {
    name: colName,
    type,
    uniqueCount,
    hasVariation,
    missingCount,
    sampleValues,
  };
}

/**
 * Detect column mappings with smart keyword matching.
 *
 * @param data - Array of data rows to analyze
 * @returns DetectedColumns with suggested outcome, factors, and time column
 */
export function detectColumns(data: DataRow[]): DetectedColumns {
  if (data.length === 0) {
    return {
      outcome: null,
      factors: [],
      timeColumn: null,
      confidence: 'low',
      columnAnalysis: [],
    };
  }

  const columns = Object.keys(data[0]);
  const columnAnalysis = columns.map(col => analyzeColumn(data, col));

  // Find outcome: numeric column with keyword match, or first numeric with variation
  const numericCols = columnAnalysis.filter(c => c.type === 'numeric');

  let outcome = numericCols.find(
    c => c.hasVariation && OUTCOME_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw))
  );
  if (!outcome) {
    outcome = numericCols.find(c => c.hasVariation);
  }

  // Find factors: categorical columns, prioritize keyword matches
  const categoricalCols = columnAnalysis
    .filter(c => c.type === 'categorical' && c.name !== outcome?.name)
    .sort((a, b) => {
      const aMatch = FACTOR_KEYWORDS.some(kw => a.name.toLowerCase().includes(kw));
      const bMatch = FACTOR_KEYWORDS.some(kw => b.name.toLowerCase().includes(kw));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      // Secondary sort: prefer columns with reasonable unique counts (2-20)
      const aGoodCount = a.uniqueCount >= 2 && a.uniqueCount <= 20;
      const bGoodCount = b.uniqueCount >= 2 && b.uniqueCount <= 20;
      if (aGoodCount && !bGoodCount) return -1;
      if (!aGoodCount && bGoodCount) return 1;
      return 0;
    });

  const factors = categoricalCols.slice(0, 3).map(c => c.name);

  // Find time column: date type or keyword match
  let timeCandidate = columnAnalysis.find(c => c.type === 'date');
  if (!timeCandidate) {
    timeCandidate = columnAnalysis.find(c =>
      TIME_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw))
    );
  }
  const timeColumn = timeCandidate?.name || null;

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (outcome && factors.length > 0) {
    const outcomeKeywordMatch = OUTCOME_KEYWORDS.some(kw =>
      outcome!.name.toLowerCase().includes(kw)
    );
    const factorKeywordMatch = factors.some(f =>
      FACTOR_KEYWORDS.some(kw => f.toLowerCase().includes(kw))
    );
    if (outcomeKeywordMatch || factorKeywordMatch) {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }
  } else if (outcome) {
    confidence = 'medium';
  }

  return {
    outcome: outcome?.name || null,
    factors,
    timeColumn,
    confidence,
    columnAnalysis,
  };
}

// ============================================================================
// Data validation
// ============================================================================

/**
 * Validate data and identify rows that will be excluded from analysis.
 *
 * @param data - Array of data rows to validate
 * @param outcomeColumn - Column to validate for numeric values
 * @returns DataQualityReport with excluded rows and column issues
 */
export function validateData(data: DataRow[], outcomeColumn: string | null): DataQualityReport {
  const excludedRows: ExcludedRow[] = [];
  const columnIssues: ColumnIssue[] = [];

  if (!outcomeColumn || data.length === 0) {
    return {
      totalRows: data.length,
      validRows: data.length,
      excludedRows: [],
      columnIssues: [],
    };
  }

  // Check each row for issues in the outcome column
  data.forEach((row, index) => {
    const value = row[outcomeColumn];
    const reasons: ExclusionReason[] = [];

    // Check missing
    if (value === null || value === undefined || value === '') {
      reasons.push({ type: 'missing', column: outcomeColumn });
    }
    // Check non-numeric (only if not missing)
    else {
      const numericValue = toNumericValue(value);
      if (numericValue === undefined) {
        reasons.push({
          type: 'non_numeric',
          column: outcomeColumn,
          value: String(value).slice(0, 50),
        });
      }
    }

    if (reasons.length > 0) {
      excludedRows.push({ index, reasons });
    }
  });

  // Summarize issues by type
  const missingCount = excludedRows.filter(r => r.reasons.some(re => re.type === 'missing')).length;
  const nonNumericCount = excludedRows.filter(r =>
    r.reasons.some(re => re.type === 'non_numeric')
  ).length;

  if (missingCount > 0) {
    columnIssues.push({
      column: outcomeColumn,
      type: 'missing',
      count: missingCount,
      severity: 'warning',
    });
  }

  if (nonNumericCount > 0) {
    columnIssues.push({
      column: outcomeColumn,
      type: 'non_numeric',
      count: nonNumericCount,
      severity: 'warning',
    });
  }

  // Check for no variation in valid values
  const validValues = data
    .filter((_, i) => !excludedRows.some(e => e.index === i))
    .map(row => toNumericValue(row[outcomeColumn]))
    .filter((v): v is number => v !== undefined);

  if (validValues.length > 0) {
    const uniqueValid = new Set(validValues);
    if (uniqueValid.size === 1) {
      columnIssues.push({
        column: outcomeColumn,
        type: 'no_variation',
        count: validValues.length,
        severity: 'info',
      });
    }
  }

  return {
    totalRows: data.length,
    validRows: data.length - excludedRows.length,
    excludedRows,
    columnIssues,
  };
}

// ============================================================================
// Pareto file parsing
// ============================================================================

/**
 * Parse and validate separate Pareto file (pre-aggregated counts).
 * Returns array of { category, count, value? } sorted by count descending.
 */
export async function parseParetoFile(file: File): Promise<ParetoRow[]> {
  // Parse file
  let data: any[];
  if (file.name.endsWith('.csv')) {
    data = await parseCSV(file);
  } else {
    data = await parseExcel(file);
  }

  if (data.length === 0) {
    throw new Error('Pareto file is empty');
  }

  const columns = Object.keys(data[0]);

  // Auto-detect category and count columns
  const columnAnalysis = columns.map(col => analyzeColumn(data, col));

  const categoryCol = columnAnalysis.find(c => c.type === 'categorical' || c.type === 'text');
  const numericCols = columnAnalysis.filter(c => c.type === 'numeric');

  if (!categoryCol) {
    throw new Error('No category column found in Pareto file');
  }
  if (numericCols.length === 0) {
    throw new Error('No numeric (count) column found in Pareto file');
  }

  // First numeric column is count, second (if exists) is value
  const countCol = numericCols[0];
  const valueCol = numericCols.length > 1 ? numericCols[1] : null;

  // Transform to ParetoRow array
  const paretoData: ParetoRow[] = data
    .map(row => {
      const category = String(row[categoryCol.name] ?? 'Unknown');
      const count = Number(row[countCol.name]) || 0;
      const value = valueCol ? Number(row[valueCol.name]) || undefined : undefined;
      return { category, count, value };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return paretoData;
}
