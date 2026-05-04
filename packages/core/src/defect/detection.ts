/**
 * Defect data format auto-detection — infer defect data shape from columns and values
 */

import type { DataRow } from '../types';
import type { ColumnAnalysis } from '../parser/types';
import type { DefectDetection } from './types';
import {
  DEFECT_TYPE_KEYWORDS,
  DEFECT_COUNT_KEYWORDS,
  PASS_FAIL_VALUES,
  PASS_FAIL_COLUMN_KEYWORDS,
  STEP_REJECTED_AT_KEYWORDS,
} from '../parser/defectKeywords';
import { TIME_KEYWORDS } from '../parser/keywords';

/**
 * Normalize a column name for keyword matching: lowercase, trimmed,
 * spaces/hyphens converted to underscores.
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

/**
 * Check if a normalized column name matches any keyword in the list.
 * Uses substring matching (keyword appears anywhere in the name).
 */
function matchesKeyword(normalizedName: string, keywords: string[]): boolean {
  return keywords.some(kw => normalizedName.includes(kw));
}

/**
 * Find the first column whose name matches any of the given keywords.
 */
function findColumnByKeywords(
  columns: ColumnAnalysis[],
  keywords: string[],
  typeFilter?: ColumnAnalysis['type']
): ColumnAnalysis | undefined {
  return columns.find(col => {
    if (typeFilter && col.type !== typeFilter) return false;
    return matchesKeyword(normalizeColumnName(col.name), keywords);
  });
}

/**
 * Check if a categorical column has exactly 2 unique values that match
 * a known pass/fail pattern (case-insensitive).
 */
function matchesPassFailValues(data: DataRow[], columnName: string): boolean {
  const uniqueValues = new Set<string>();
  for (const row of data) {
    const val = row[columnName];
    if (val !== null && val !== undefined && val !== '') {
      uniqueValues.add(String(val).trim());
    }
  }

  if (uniqueValues.size !== 2) return false;

  const vals = Array.from(uniqueValues).map(v => v.toLowerCase());
  const sorted = vals.sort();

  return PASS_FAIL_VALUES.some(([a, b]) => {
    const pair = [a.toLowerCase(), b.toLowerCase()].sort();
    return sorted[0] === pair[0] && sorted[1] === pair[1];
  });
}

/**
 * Suggest the column most likely to identify which step caught each defect.
 *
 * Strategy:
 * 1. Filter to categorical columns with reasonable cardinality (≥ 2 levels, ≤ 50).
 *    A column with just 1 unique value carries no information; > 50 levels is
 *    almost certainly a join key, not a step identifier.
 * 2. Score each candidate by matching its normalized name against
 *    STEP_REJECTED_AT_KEYWORDS in order — first match wins. Earlier (more
 *    specific) keywords beat later (more generic) ones.
 * 3. Return the highest-scoring column's name, or undefined if none match.
 *
 * @returns Column name of the best candidate, or undefined when no name matches.
 */
export function suggestStepRejectedAtColumn(columns: ColumnAnalysis[]): string | undefined {
  // Iterate keywords in priority order; for each keyword, find any column
  // whose normalized name contains it. Return the first found.
  for (const keyword of STEP_REJECTED_AT_KEYWORDS) {
    const match = columns.find(col => {
      if (col.type !== 'categorical') return false;
      if (col.uniqueCount < 2 || col.uniqueCount > 50) return false;
      return normalizeColumnName(col.name).includes(keyword);
    });
    if (match) return match.name;
  }
  return undefined;
}

/**
 * Check if a column looks like a time/batch grouping column.
 */
function isGroupingColumn(col: ColumnAnalysis): boolean {
  if (col.type === 'date') return true;
  const normalized = normalizeColumnName(col.name);
  return (
    matchesKeyword(normalized, TIME_KEYWORDS) ||
    matchesKeyword(normalized, ['batch', 'lot', 'period', 'sample', 'group', 'shift', 'run'])
  );
}

/**
 * Detect if data is in a defect-analysis format by analyzing column names,
 * types, and values.
 *
 * Detection strategy (checked in order):
 * 1. **Pre-aggregated** (high): count keyword column + defect type column + grouping column
 * 2. **Event log** (high): defect type column + no continuous numeric outcome
 * 3. **Pass/fail** (medium): 2-value categorical column with pass/fail name + matching values
 * 4. **Low confidence**: count keyword column exists but no defect type column
 *
 * @param data - Array of data rows
 * @param columnAnalysis - Pre-computed column analysis from detectColumns()
 * @returns DefectDetection with confidence and suggested mapping
 */
export function detectDefectFormat(
  data: DataRow[],
  columnAnalysis: ColumnAnalysis[]
): DefectDetection {
  const noDetection: DefectDetection = {
    isDefectFormat: false,
    confidence: 'low',
    dataShape: 'event-log',
    suggestedMapping: {},
  };

  if (data.length === 0 || columnAnalysis.length === 0) {
    return noDetection;
  }

  // Find candidate columns
  const defectTypeCol = findColumnByKeywords(columnAnalysis, DEFECT_TYPE_KEYWORDS, 'categorical');
  const countCol = findColumnByKeywords(columnAnalysis, DEFECT_COUNT_KEYWORDS, 'numeric');
  const groupingCol = columnAnalysis.find(
    col => col.name !== defectTypeCol?.name && col.name !== countCol?.name && isGroupingColumn(col)
  );

  // Check for a continuous numeric outcome (non-count) — its presence suggests
  // standard variation analysis, not defect analysis
  const hasContinuousOutcome = columnAnalysis.some(col => {
    if (col.type !== 'numeric') return false;
    if (col.name === countCol?.name) return false;
    const normalized = normalizeColumnName(col.name);
    // Skip columns that look like counts or units produced
    if (matchesKeyword(normalized, DEFECT_COUNT_KEYWORDS)) return false;
    if (matchesKeyword(normalized, ['units', 'produced', 'inspected', 'total', 'sample_size'])) {
      return false;
    }
    // A column with high variation and many unique values suggests continuous measurement
    return col.hasVariation && col.uniqueCount > 10;
  });

  // Find optional columns
  const unitsProducedCol = columnAnalysis.find(col => {
    if (col.type !== 'numeric') return false;
    if (col.name === countCol?.name) return false;
    const normalized = normalizeColumnName(col.name);
    return matchesKeyword(normalized, [
      'units',
      'produced',
      'inspected',
      'total',
      'sample_size',
      'qty',
    ]);
  });

  // --- Detection 1: Pre-aggregated ---
  if (countCol && defectTypeCol && groupingCol) {
    return {
      isDefectFormat: true,
      confidence: 'high',
      dataShape: 'pre-aggregated',
      suggestedMapping: {
        dataShape: 'pre-aggregated',
        defectTypeColumn: defectTypeCol.name,
        countColumn: countCol.name,
        aggregationUnit: groupingCol.name,
        unitsProducedColumn: unitsProducedCol?.name,
        stepRejectedAtColumn: suggestStepRejectedAtColumn(columnAnalysis),
      },
    };
  }

  // --- Detection 2: Event log ---
  if (defectTypeCol && !hasContinuousOutcome) {
    return {
      isDefectFormat: true,
      confidence: 'high',
      dataShape: 'event-log',
      suggestedMapping: {
        dataShape: 'event-log',
        defectTypeColumn: defectTypeCol.name,
        aggregationUnit: groupingCol?.name ?? '',
        stepRejectedAtColumn: suggestStepRejectedAtColumn(columnAnalysis),
      },
    };
  }

  // --- Detection 3: Pass/fail ---
  const passFail = columnAnalysis.find(col => {
    if (col.type !== 'categorical') return false;
    if (col.uniqueCount !== 2) return false;
    const normalized = normalizeColumnName(col.name);
    if (!matchesKeyword(normalized, PASS_FAIL_COLUMN_KEYWORDS)) return false;
    return matchesPassFailValues(data, col.name);
  });

  if (passFail) {
    return {
      isDefectFormat: true,
      confidence: 'medium',
      dataShape: 'pass-fail',
      suggestedMapping: {
        dataShape: 'pass-fail',
        resultColumn: passFail.name,
        aggregationUnit: groupingCol?.name ?? '',
        stepRejectedAtColumn: suggestStepRejectedAtColumn(columnAnalysis),
      },
    };
  }

  // --- Detection 4: Low confidence — count column but no type column ---
  if (countCol && !defectTypeCol) {
    return {
      isDefectFormat: false,
      confidence: 'low',
      dataShape: 'pre-aggregated',
      suggestedMapping: {
        dataShape: 'pre-aggregated',
        countColumn: countCol.name,
        aggregationUnit: groupingCol?.name ?? '',
      },
    };
  }

  return noDetection;
}
