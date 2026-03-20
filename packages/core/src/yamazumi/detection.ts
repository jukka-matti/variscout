/**
 * Yamazumi format auto-detection — infer column roles from data
 */

import type { DataRow } from '../types';
import type { ColumnAnalysis } from '../parser/types';
import type { YamazumiDetection } from './types';
import { isActivityTypeValue } from './classify';

/** Keywords that suggest a column contains time/duration values */
const TIME_COLUMN_KEYWORDS = [
  'time',
  'duration',
  'cycle',
  'lead',
  'ct',
  'seconds',
  'minutes',
  'takt',
  'elapsed',
];

/** Keywords that suggest a column contains process step names */
const STEP_COLUMN_KEYWORDS = [
  'step',
  'process',
  'station',
  'operation',
  'stage',
  'task',
  'phase',
  'work',
];

/** Keywords that suggest a column contains activity type values */
const ACTIVITY_TYPE_COLUMN_KEYWORDS = ['activity', 'type', 'classification', 'category', 'class'];

/** Keywords that suggest a column contains waste reasons */
const REASON_COLUMN_KEYWORDS = ['reason', 'comment', 'cause', 'note', 'why', 'description'];

/** Keywords that suggest a column contains product types */
const PRODUCT_COLUMN_KEYWORDS = ['product', 'part', 'model', 'sku', 'item', 'variant'];

/** Keywords that suggest a column contains wait time */
const WAIT_TIME_KEYWORDS = ['wait', 'queue', 'idle', 'delay'];

/**
 * Detect if data is in Yamazumi format by analyzing column values and names.
 *
 * Detection strategy:
 * 1. Find a categorical column whose values match activity type keywords (>=60% match)
 * 2. Find a numeric column matching time keywords
 * 3. Find a categorical column matching step keywords
 *
 * @param data - Array of data rows
 * @param columnAnalysis - Pre-computed column analysis from detectColumns()
 * @returns YamazumiDetection with confidence and suggested mapping
 */
export function detectYamazumiFormat(
  data: DataRow[],
  columnAnalysis: ColumnAnalysis[]
): YamazumiDetection {
  if (data.length === 0 || columnAnalysis.length === 0) {
    return {
      isYamazumiFormat: false,
      confidence: 'low',
      suggestedMapping: {},
      reason: 'No data or columns to analyze',
    };
  }

  // Step 1: Find activity type column — categorical with >=60% activity type values
  let activityTypeColumn: string | undefined;
  let activityMatchRate = 0;

  for (const col of columnAnalysis) {
    if (col.type !== 'categorical') continue;

    // Check unique values against activity type classification
    const uniqueValues = col.sampleValues;
    if (uniqueValues.length === 0) continue;

    // Sample full data for this column to get all unique values
    const allValues = new Set<string>();
    for (const row of data) {
      const val = row[col.name];
      if (val !== null && val !== undefined && val !== '') {
        allValues.add(String(val));
      }
    }

    const matchCount = Array.from(allValues).filter(v => isActivityTypeValue(v)).length;
    const rate = allValues.size > 0 ? matchCount / allValues.size : 0;

    if (rate >= 0.6 && rate > activityMatchRate) {
      activityTypeColumn = col.name;
      activityMatchRate = rate;
    }
  }

  if (!activityTypeColumn) {
    return {
      isYamazumiFormat: false,
      confidence: 'low',
      suggestedMapping: {},
      reason: 'No column with activity type values (VA/NVA/Waste/Wait) found',
    };
  }

  // Step 2: Find cycle time column — numeric with time keywords
  let cycleTimeColumn: string | undefined;
  for (const col of columnAnalysis) {
    if (col.type !== 'numeric') continue;
    const lower = col.name.toLowerCase();
    if (TIME_COLUMN_KEYWORDS.some(kw => lower.includes(kw))) {
      cycleTimeColumn = col.name;
      break;
    }
  }
  // Fallback: first numeric column with variation
  if (!cycleTimeColumn) {
    const numericCol = columnAnalysis.find(
      c => c.type === 'numeric' && c.hasVariation && c.name !== activityTypeColumn
    );
    cycleTimeColumn = numericCol?.name;
  }

  // Step 3: Find step column — categorical with step keywords
  let stepColumn: string | undefined;
  for (const col of columnAnalysis) {
    if (col.type !== 'categorical' || col.name === activityTypeColumn) continue;
    const lower = col.name.toLowerCase();
    if (STEP_COLUMN_KEYWORDS.some(kw => lower.includes(kw))) {
      stepColumn = col.name;
      break;
    }
  }
  // Fallback: first categorical column that's not the activity type
  if (!stepColumn) {
    const catCol = columnAnalysis.find(
      c => c.type === 'categorical' && c.name !== activityTypeColumn && c.hasVariation
    );
    stepColumn = catCol?.name;
  }

  // Step 4: Find optional columns
  let activityColumn: string | undefined;
  let reasonColumn: string | undefined;
  let productColumn: string | undefined;
  let waitTimeColumn: string | undefined;

  for (const col of columnAnalysis) {
    if (
      col.name === activityTypeColumn ||
      col.name === cycleTimeColumn ||
      col.name === stepColumn
    ) {
      continue;
    }

    const lower = col.name.toLowerCase();

    if (
      !activityColumn &&
      col.type === 'categorical' &&
      ACTIVITY_TYPE_COLUMN_KEYWORDS.some(kw => lower.includes(kw)) &&
      lower !== activityTypeColumn?.toLowerCase()
    ) {
      // "Activity" column (individual activity names, not type)
      if (lower.includes('activity') && !lower.includes('type')) {
        activityColumn = col.name;
        continue;
      }
    }

    if (!reasonColumn && (col.type === 'categorical' || col.type === 'text')) {
      if (REASON_COLUMN_KEYWORDS.some(kw => lower.includes(kw))) {
        reasonColumn = col.name;
        continue;
      }
    }

    if (!productColumn && col.type === 'categorical') {
      if (PRODUCT_COLUMN_KEYWORDS.some(kw => lower.includes(kw))) {
        productColumn = col.name;
        continue;
      }
    }

    if (!waitTimeColumn && col.type === 'numeric') {
      if (WAIT_TIME_KEYWORDS.some(kw => lower.includes(kw))) {
        waitTimeColumn = col.name;
        continue;
      }
    }
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low';
  if (activityTypeColumn && cycleTimeColumn && stepColumn && activityMatchRate >= 0.8) {
    confidence = 'high';
  } else if (activityTypeColumn && cycleTimeColumn && stepColumn) {
    confidence = 'medium';
  } else if (activityTypeColumn) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const isYamazumiFormat = !!activityTypeColumn && (!!cycleTimeColumn || !!stepColumn);

  return {
    isYamazumiFormat,
    confidence,
    suggestedMapping: {
      activityTypeColumn,
      cycleTimeColumn,
      stepColumn,
      activityColumn,
      reasonColumn,
      productColumn,
      waitTimeColumn,
    },
    reason: isYamazumiFormat
      ? `Detected activity type column "${activityTypeColumn}" with ${Math.round(activityMatchRate * 100)}% match rate`
      : 'Insufficient column matches for Yamazumi format',
  };
}
