/**
 * Subgroup Capability Analysis — Cp/Cpk per subgroup
 *
 * Calculates short-term capability indices for rational subgroups,
 * enabling I-Chart and Boxplot views of capability stability.
 */

import * as d3 from 'd3-array';
import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { calculateMovingRangeSigma } from './basic';
import { parseTimeValue } from '../time';

// ============================================================================
// Types
// ============================================================================

/** How subgroups are formed from raw data */
export type SubgroupMethod = 'column' | 'fixed-size' | 'time-interval';

/** Time interval granularity for time-based subgrouping */
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week';

/** Configuration for subgroup formation */
export interface SubgroupConfig {
  /** Grouping method */
  method: SubgroupMethod;
  /** Column name when method = 'column' */
  column?: string;
  /** Subgroup size when method = 'fixed-size' (default 5, min 2) */
  size?: number;
  /** Time column name when method = 'time-interval' */
  timeColumn?: string;
  /** Time granularity when method = 'time-interval' */
  granularity?: TimeGranularity;
  /** Minute interval when granularity = 'minute' (e.g., 5, 15, 30) */
  minuteInterval?: number;
}

/** A single subgroup's capability result */
export interface SubgroupCapabilityResult {
  /** Subgroup label (column value or "Subgroup 1", etc.) */
  label: string;
  /** Subgroup index (0-based) */
  index: number;
  /** Number of measurements in subgroup */
  n: number;
  /** Subgroup mean */
  mean: number;
  /** Within-subgroup sigma (MR-based) */
  sigmaWithin: number;
  /** Process capability (requires both USL and LSL) */
  cp?: number;
  /** Process capability index (requires at least one spec) */
  cpk?: number;
}

/** Raw subgroup before capability calculation */
export interface SubgroupData {
  /** Numeric measurement values */
  values: number[];
  /** Subgroup label */
  label: string;
  /** Original data rows (for factor lookup in boxplot) */
  rows: DataRow[];
}

/** Control limits for a capability metric series */
export interface CapabilitySeriesLimits {
  /** Mean of the metric values */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Upper Control Limit (mean + 3σ) */
  ucl: number;
  /** Lower Control Limit (max(0, mean - 3σ)) */
  lcl: number;
  /** Number of values used */
  n: number;
}

/** I-Chart metric mode for standard analysis */
export type StandardIChartMetric = 'measurement' | 'capability';

// ============================================================================
// Grouping
// ============================================================================

/**
 * Group raw data into subgroups for capability analysis.
 *
 * Column-based: groups by unique values in config.column, preserving appearance order.
 * Fixed-size: chunks consecutive rows into groups of config.size. Trailing partial group is dropped.
 *
 * @param rows - Raw data rows
 * @param outcome - Outcome column name
 * @param config - Subgroup configuration
 * @returns Array of subgroup data with values, labels, and original rows
 */
export function groupDataIntoSubgroups(
  rows: DataRow[],
  outcome: string,
  config: SubgroupConfig
): SubgroupData[] {
  if (config.method === 'column' && config.column) {
    return groupByColumn(rows, outcome, config.column);
  }
  if (config.method === 'time-interval' && config.timeColumn && config.granularity) {
    return groupByTimeInterval(
      rows,
      outcome,
      config.timeColumn,
      config.granularity,
      config.minuteInterval
    );
  }
  return groupByFixedSize(rows, outcome, config.size ?? 5);
}

function groupByColumn(rows: DataRow[], outcome: string, column: string): SubgroupData[] {
  // Preserve appearance order using Map
  const groups = new Map<string, { values: number[]; rows: DataRow[] }>();

  for (const row of rows) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const key = String(row[column] ?? '');
    if (!key) continue;

    let group = groups.get(key);
    if (!group) {
      group = { values: [], rows: [] };
      groups.set(key, group);
    }
    group.values.push(val);
    group.rows.push(row);
  }

  const result: SubgroupData[] = [];
  for (const [label, group] of groups) {
    result.push({ values: group.values, label, rows: group.rows });
  }
  return result;
}

function groupByFixedSize(rows: DataRow[], outcome: string, size: number): SubgroupData[] {
  const effectiveSize = Math.max(2, size);

  // First, extract valid numeric rows
  const validRows: { value: number; row: DataRow }[] = [];
  for (const row of rows) {
    const val = toNumericValue(row[outcome]);
    if (val !== undefined) {
      validRows.push({ value: val, row });
    }
  }

  // Chunk into fixed-size groups, dropping remainder
  const fullGroupCount = Math.floor(validRows.length / effectiveSize);
  const result: SubgroupData[] = [];

  for (let i = 0; i < fullGroupCount; i++) {
    const start = i * effectiveSize;
    const chunk = validRows.slice(start, start + effectiveSize);
    result.push({
      values: chunk.map(r => r.value),
      label: `Subgroup ${i + 1}`,
      rows: chunk.map(r => r.row),
    });
  }

  return result;
}

function groupByTimeInterval(
  rows: DataRow[],
  outcome: string,
  timeColumn: string,
  granularity: TimeGranularity,
  minuteInterval: number = 15
): SubgroupData[] {
  const groups = new Map<string, { values: number[]; rows: DataRow[] }>();

  for (const row of rows) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const date = parseTimeValue(row[timeColumn]);
    if (!date) continue;

    const key = formatTimeBucket(date, granularity, minuteInterval);
    let group = groups.get(key);
    if (!group) {
      group = { values: [], rows: [] };
      groups.set(key, group);
    }
    group.values.push(val);
    group.rows.push(row);
  }

  const result: SubgroupData[] = [];
  for (const [label, group] of groups) {
    result.push({ values: group.values, label, rows: group.rows });
  }
  return result;
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format a date into a bucket label for the given granularity.
 *
 * @param date - Date to format
 * @param granularity - Time granularity
 * @param minuteInterval - Minute interval (only used when granularity = 'minute')
 * @returns Formatted bucket label
 */
export function formatTimeBucket(
  date: Date,
  granularity: TimeGranularity,
  minuteInterval: number = 15
): string {
  const month = MONTH_ABBR[date.getMonth()];
  const day = date.getDate();

  switch (granularity) {
    case 'minute': {
      const effectiveInterval = Math.max(1, minuteInterval);
      const floored = Math.floor(date.getMinutes() / effectiveInterval) * effectiveInterval;
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(floored).padStart(2, '0');
      return `${month} ${day} ${hh}:${mm}`;
    }
    case 'hour': {
      const hh = String(date.getHours()).padStart(2, '0');
      return `${month} ${day} ${hh}:00`;
    }
    case 'day':
      return `${month} ${day}`;
    case 'week': {
      // ISO week number
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `W${String(weekNum).padStart(2, '0')} ${d.getUTCFullYear()}`;
    }
  }
}

// ============================================================================
// Capability Calculation
// ============================================================================

/**
 * Calculate Cp and Cpk for each subgroup.
 *
 * @param subgroups - Array of subgroup data from groupDataIntoSubgroups
 * @param specs - Specification limits
 * @returns Array of capability results per subgroup
 */
export function calculateSubgroupCapability(
  subgroups: SubgroupData[],
  specs: { usl?: number; lsl?: number }
): SubgroupCapabilityResult[] {
  return subgroups.map((sg, index) => {
    const n = sg.values.length;
    const mean = d3.mean(sg.values) || 0;

    // Need at least 2 values for sigma calculation
    if (n < 2) {
      return {
        label: sg.label,
        index,
        n,
        mean,
        sigmaWithin: 0,
        cp: undefined,
        cpk: undefined,
      };
    }

    const { sigmaWithin } = calculateMovingRangeSigma(sg.values);

    // Guard: zero sigma means all values identical — capability undefined
    if (sigmaWithin === 0) {
      return {
        label: sg.label,
        index,
        n,
        mean,
        sigmaWithin: 0,
        cp: undefined,
        cpk: undefined,
      };
    }

    let cp: number | undefined;
    let cpk: number | undefined;

    const hasUSL = specs.usl !== undefined;
    const hasLSL = specs.lsl !== undefined;

    if (hasUSL && hasLSL) {
      // Both specs: calculate both Cp and Cpk
      cp = (specs.usl! - specs.lsl!) / (6 * sigmaWithin);
      const cpu = (specs.usl! - mean) / (3 * sigmaWithin);
      const cpl = (mean - specs.lsl!) / (3 * sigmaWithin);
      cpk = Math.min(cpu, cpl);
    } else if (hasUSL) {
      // USL only: Cpk only
      cpk = (specs.usl! - mean) / (3 * sigmaWithin);
    } else if (hasLSL) {
      // LSL only: Cpk only
      cpk = (mean - specs.lsl!) / (3 * sigmaWithin);
    }

    return { label: sg.label, index, n, mean, sigmaWithin, cp, cpk };
  });
}

// ============================================================================
// Control Limits (generic — works with any numeric array)
// ============================================================================

/**
 * Calculate control limits for a series of capability values.
 *
 * Generic version that accepts any number array (Cp values, Cpk values, etc.).
 * UCL = mean + 3σ, LCL = max(0, mean - 3σ).
 *
 * @param values - Array of numeric capability values
 * @returns Control limits, or null if fewer than 2 values
 */
export function calculateSeriesControlLimits(values: number[]): CapabilitySeriesLimits | null {
  // Filter out non-finite values
  const valid = values.filter(v => isFinite(v) && !isNaN(v));

  if (valid.length < 2) return null;

  const mean = d3.mean(valid) || 0;
  const stdDev = d3.deviation(valid) || 0;
  const ucl = mean + 3 * stdDev;
  const lcl = Math.max(0, mean - 3 * stdDev);

  return { mean, stdDev, ucl, lcl, n: valid.length };
}
