import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import * as d3 from 'd3';
import type { DataRow, DataCellValue, ChannelInfo, WideFormatDetection } from './types';
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

// ============================================================================
// Wide Format / Channel Detection
// ============================================================================

/**
 * Patterns that indicate a column is a channel/measurement point
 * Matches: V1, V2, Valve_1, Channel_1, Head1, Nozzle_01, etc.
 */
const CHANNEL_PATTERNS = [
  /^v\d+$/i, // V1, V2, V140
  /^valve[_\s-]?\d+$/i, // Valve_1, Valve-1, Valve 1
  /^channel[_\s-]?\d+$/i, // Channel_1, Channel-1
  /^head[_\s-]?\d+$/i, // Head_1, Head1
  /^nozzle[_\s-]?\d+$/i, // Nozzle_1
  /^station[_\s-]?\d+$/i, // Station_1
  /^pos(ition)?[_\s-]?\d+$/i, // Pos1, Position_1
  /^port[_\s-]?\d+$/i, // Port_1
  /^lane[_\s-]?\d+$/i, // Lane_1
  /^cavity[_\s-]?\d+$/i, // Cavity_1 (injection molding)
  /^die[_\s-]?\d+$/i, // Die_1
  /^spindle[_\s-]?\d+$/i, // Spindle_1
  /^cell[_\s-]?\d+$/i, // Cell_1
  /^unit[_\s-]?\d+$/i, // Unit_1
  /^sensor[_\s-]?\d+$/i, // Sensor_1
  /^ch\d+$/i, // CH1, CH2
  /^\d+$/, // Just numbers: 1, 2, 3...
];

/**
 * Patterns for metadata columns (non-channel columns)
 */
const METADATA_PATTERNS = [
  /^(date|time|timestamp|datetime)$/i,
  /^(batch|lot|run|sample)([_\s-]?(id|num(ber)?|no))?$/i,
  /^(operator|tech(nician)?|inspector)$/i,
  /^(shift|line|machine)$/i,
  /^(product|part|sku|item)([_\s-]?(id|num(ber)?|no|name))?$/i,
  /^(id|row|index|record)$/i,
  /^(comment|note|remark)s?$/i,
];

/**
 * Check if a column name matches channel patterns
 */
function matchesChannelPattern(colName: string): boolean {
  return CHANNEL_PATTERNS.some(pattern => pattern.test(colName.trim()));
}

/**
 * Check if a column name matches metadata patterns
 */
function matchesMetadataPattern(colName: string): boolean {
  return METADATA_PATTERNS.some(pattern => pattern.test(colName.trim()));
}

/**
 * Options for channel detection
 */
export interface DetectChannelsOptions {
  /** Minimum percentage of numeric values to consider a column as numeric (default: 0.9) */
  numericThreshold?: number;
  /** Minimum number of valid values required (default: 2) */
  minValidValues?: number;
}

/**
 * Detect channel columns from wide format data
 *
 * Identifies columns that appear to be measurement channels (parallel outputs)
 * based on naming patterns and data characteristics.
 *
 * @param data - Array of data rows
 * @param options - Detection options
 * @returns Array of ChannelInfo for detected channels
 *
 * @example
 * // Data with columns: Date, Batch, V1, V2, V3, V4
 * const channels = detectChannelColumns(data);
 * // Returns: [{ id: 'V1', ... }, { id: 'V2', ... }, ...]
 */
export function detectChannelColumns(
  data: DataRow[],
  options: DetectChannelsOptions = {}
): ChannelInfo[] {
  const { numericThreshold = 0.9, minValidValues = 2 } = options;

  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const channels: ChannelInfo[] = [];

  for (const colName of columns) {
    // Skip known metadata columns
    if (matchesMetadataPattern(colName)) continue;

    // Extract values and check if numeric
    const values = data.map(row => row[colName]);
    const numericValues: number[] = [];

    for (const val of values) {
      const num = toNumericValue(val);
      if (num !== undefined) {
        numericValues.push(num);
      }
    }

    // Check if column is sufficiently numeric
    const numericRatio = numericValues.length / values.length;
    if (numericRatio < numericThreshold || numericValues.length < minValidValues) {
      continue;
    }

    // This is a numeric column - check if it matches channel pattern
    const matchedPattern = matchesChannelPattern(colName);

    // Calculate preview stats
    const mean = d3.mean(numericValues) || 0;
    const min = d3.min(numericValues) || 0;
    const max = d3.max(numericValues) || 0;

    channels.push({
      id: colName,
      label: colName,
      n: numericValues.length,
      preview: { min, max, mean },
      matchedPattern,
    });
  }

  return channels;
}

/**
 * Options for wide format detection
 */
export interface DetectWideFormatOptions extends DetectChannelsOptions {
  /** Minimum number of similar numeric columns to consider wide format (default: 3) */
  minChannels?: number;
  /** Minimum percentage of channels with matching pattern for high confidence (default: 0.5) */
  patternMatchThreshold?: number;
}

/**
 * Auto-detect if data is in wide format (multiple channels)
 *
 * Wide format detection looks for:
 * 1. Multiple numeric columns with similar characteristics
 * 2. Column names that follow channel naming patterns
 * 3. Consistent data ranges across potential channels
 *
 * @param data - Array of data rows
 * @param options - Detection options
 * @returns WideFormatDetection with detection result and confidence
 *
 * @example
 * const detection = detectWideFormat(data);
 * if (detection.isWideFormat && detection.confidence === 'high') {
 *   // Automatically switch to performance mode
 *   setPerformanceMode(true);
 *   setChannelColumns(detection.channels.map(c => c.id));
 * }
 */
export function detectWideFormat(
  data: DataRow[],
  options: DetectWideFormatOptions = {}
): WideFormatDetection {
  const { minChannels = 3, patternMatchThreshold = 0.5 } = options;

  if (data.length === 0) {
    return {
      isWideFormat: false,
      channels: [],
      metadataColumns: [],
      confidence: 'low',
      reason: 'No data provided',
    };
  }

  // Detect potential channel columns
  const potentialChannels = detectChannelColumns(data, options);

  // Get all columns
  const allColumns = Object.keys(data[0]);

  // Identify metadata columns (non-channel)
  const channelIds = new Set(potentialChannels.map(c => c.id));
  const metadataColumns = allColumns.filter(col => !channelIds.has(col));

  // Check if we have enough potential channels
  if (potentialChannels.length < minChannels) {
    return {
      isWideFormat: false,
      channels: potentialChannels,
      metadataColumns,
      confidence: 'low',
      reason: `Only ${potentialChannels.length} numeric columns found (need at least ${minChannels})`,
    };
  }

  // Count how many channels match naming patterns
  const patternMatchCount = potentialChannels.filter(c => c.matchedPattern).length;
  const patternMatchRatio = patternMatchCount / potentialChannels.length;

  // Check for similar data ranges across channels (indicates same measurement type)
  const ranges = potentialChannels.map(c => c.preview.max - c.preview.min);
  const meanRange = d3.mean(ranges) || 0;
  const rangeStdDev = d3.deviation(ranges) || 0;
  const rangeCV = meanRange > 0 ? rangeStdDev / meanRange : Infinity;
  const hasConsistentRanges = rangeCV < 1.0; // Coefficient of variation < 100%

  // Determine confidence and result
  let isWideFormat = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (patternMatchRatio >= patternMatchThreshold) {
    // High confidence: most columns match channel patterns
    isWideFormat = true;
    confidence = 'high';
    reason = `${patternMatchCount}/${potentialChannels.length} columns match channel naming patterns`;
  } else if (hasConsistentRanges && potentialChannels.length >= 5) {
    // Medium confidence: consistent data ranges across many numeric columns
    isWideFormat = true;
    confidence = 'medium';
    reason = `${potentialChannels.length} numeric columns with consistent data ranges`;
  } else if (potentialChannels.length >= minChannels) {
    // Low confidence: meets minimum but no strong pattern
    isWideFormat = false;
    confidence = 'low';
    reason = `${potentialChannels.length} numeric columns found but no clear channel pattern`;
  }

  return {
    isWideFormat,
    channels: potentialChannels,
    metadataColumns,
    confidence,
    reason,
  };
}
