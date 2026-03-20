/**
 * Yamazumi data aggregation — compute stacked bar data from raw rows
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type {
  YamazumiColumnMapping,
  YamazumiBarData,
  YamazumiSegment,
  YamazumiSummary,
  ActivityType,
} from './types';
import { ACTIVITY_TYPE_ORDER } from './types';
import { classifyActivityType } from './classify';

/**
 * Compute Yamazumi bar data from raw data rows.
 *
 * Groups rows by stepColumn, then within each step sums cycleTimeColumn
 * by classified activityType. Handles both activity-level and step-level
 * row granularity.
 *
 * @param data - Array of data rows
 * @param mapping - Column role assignments
 * @returns Array of YamazumiBarData (one per step), ordered by first appearance
 */
export function computeYamazumiData(
  data: DataRow[],
  mapping: YamazumiColumnMapping
): YamazumiBarData[] {
  if (data.length === 0) return [];

  const { stepColumn, activityTypeColumn, cycleTimeColumn, waitTimeColumn } = mapping;

  // Group by step, preserving insertion order
  const stepMap = new Map<string, Map<ActivityType, { totalTime: number; count: number }>>();

  for (const row of data) {
    const step = String(row[stepColumn] ?? '');
    if (!step) continue;

    const rawType = String(row[activityTypeColumn] ?? '');
    const time = toNumericValue(row[cycleTimeColumn]);
    if (time === undefined || time < 0) continue;

    const activityType = classifyActivityType(rawType);

    if (!stepMap.has(step)) {
      stepMap.set(step, new Map());
    }
    const typeMap = stepMap.get(step)!;

    const existing = typeMap.get(activityType) ?? { totalTime: 0, count: 0 };
    existing.totalTime += time;
    existing.count += 1;
    typeMap.set(activityType, existing);
  }

  // Add wait time from separate column if present
  if (waitTimeColumn) {
    const waitByStep = new Map<string, { totalTime: number; count: number }>();
    for (const row of data) {
      const step = String(row[stepColumn] ?? '');
      if (!step) continue;
      const waitTime = toNumericValue(row[waitTimeColumn]);
      if (waitTime === undefined || waitTime <= 0) continue;

      const existing = waitByStep.get(step) ?? { totalTime: 0, count: 0 };
      existing.totalTime += waitTime;
      existing.count += 1;
      waitByStep.set(step, existing);
    }

    for (const [step, waitData] of waitByStep) {
      if (!stepMap.has(step)) {
        stepMap.set(step, new Map());
      }
      const typeMap = stepMap.get(step)!;
      const existing = typeMap.get('wait') ?? { totalTime: 0, count: 0 };
      existing.totalTime += waitData.totalTime;
      existing.count += waitData.count;
      typeMap.set('wait', existing);
    }
  }

  // Convert to YamazumiBarData[]
  const bars: YamazumiBarData[] = [];

  for (const [stepKey, typeMap] of stepMap) {
    const totalTime = Array.from(typeMap.values()).reduce((sum, v) => sum + v.totalTime, 0);

    const segments: YamazumiSegment[] = ACTIVITY_TYPE_ORDER.filter(at => typeMap.has(at)).map(
      at => {
        const { totalTime: segTime, count } = typeMap.get(at)!;
        return {
          activityType: at,
          totalTime: segTime,
          percentage: totalTime > 0 ? segTime / totalTime : 0,
          count,
        };
      }
    );

    bars.push({ key: stepKey, segments, totalTime });
  }

  return bars;
}

/**
 * Compute summary statistics from Yamazumi bar data.
 *
 * @param bars - Yamazumi bar data
 * @param taktTime - Optional reference takt time
 * @returns YamazumiSummary with VA ratio, process efficiency, etc.
 */
export function computeYamazumiSummary(
  bars: YamazumiBarData[],
  taktTime?: number
): YamazumiSummary {
  let vaTime = 0;
  let nvaTime = 0;
  let wasteTime = 0;
  let waitTime = 0;

  for (const bar of bars) {
    for (const seg of bar.segments) {
      switch (seg.activityType) {
        case 'va':
          vaTime += seg.totalTime;
          break;
        case 'nva-required':
          nvaTime += seg.totalTime;
          break;
        case 'waste':
          wasteTime += seg.totalTime;
          break;
        case 'wait':
          waitTime += seg.totalTime;
          break;
      }
    }
  }

  const totalLeadTime = vaTime + nvaTime + wasteTime + waitTime;
  const vaRatio = totalLeadTime > 0 ? vaTime / totalLeadTime : 0;
  const vaPlusNva = vaTime + nvaTime;
  const processEfficiency = vaPlusNva > 0 ? vaTime / vaPlusNva : 0;

  const stepsOverTakt: string[] = [];
  if (taktTime !== undefined && taktTime > 0) {
    for (const bar of bars) {
      if (bar.totalTime > taktTime) {
        stepsOverTakt.push(bar.key);
      }
    }
  }

  return {
    totalLeadTime,
    vaTime,
    nvaTime,
    wasteTime,
    waitTime,
    vaRatio,
    processEfficiency,
    taktTime,
    stepsOverTakt,
  };
}
