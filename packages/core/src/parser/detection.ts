/**
 * Column analysis and detection — smart column mapping and wide format detection
 */

import * as d3 from 'd3';
import type { DataRow, DataCellValue, ChannelInfo, WideFormatDetection } from '../types';
import { toNumericValue } from '../types';
import type {
  ColumnAnalysis,
  DetectedColumns,
  DetectChannelsOptions,
  DetectWideFormatOptions,
} from './types';
import {
  OUTCOME_KEYWORDS,
  FACTOR_KEYWORDS,
  TIME_KEYWORDS,
  matchesChannelPattern,
  matchesMetadataPattern,
} from './keywords';

export type { ColumnAnalysis, DetectedColumns, DetectChannelsOptions, DetectWideFormatOptions };

/**
 * Analyze a single column to determine its type and characteristics.
 * Samples multiple rows (not just the first) for better accuracy.
 *
 * @param data - Array of data rows
 * @param colName - Name of the column to analyze
 * @returns ColumnAnalysis with type, uniqueness, and sample values
 */
export function analyzeColumn(data: DataRow[], colName: string): ColumnAnalysis {
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

/**
 * Detect channel columns from wide format data
 *
 * Identifies columns that appear to be measurement channels (parallel outputs)
 * based on naming patterns and data characteristics.
 *
 * @param data - Array of data rows
 * @param options - Detection options
 * @returns Array of ChannelInfo for detected channels
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
