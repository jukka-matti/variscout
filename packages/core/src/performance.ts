/**
 * Performance Module - Multi-channel process analysis
 *
 * Calculates Cp/Cpk for each channel in wide-format data and provides
 * health classification and sorting utilities.
 */

import * as d3 from 'd3';
import type {
  DataRow,
  SpecLimits,
  ChannelHealth,
  ChannelResult,
  ChannelPerformanceData,
  PerformanceSummary,
} from './types';
import { toNumericValue } from './types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Cpk thresholds for health classification
 * Based on AIAG/industry standards:
 * - < 1.0: Process is not capable (critical)
 * - 1.0-1.33: Process is barely capable (warning)
 * - 1.33-1.67: Process is capable (capable)
 * - >= 1.67: Process is highly capable (excellent)
 */
export const CPK_THRESHOLDS = {
  critical: 1.0,
  warning: 1.33,
  capable: 1.67,
} as const;

/**
 * Maximum recommended number of channels for performance
 * Warn at 200+, hard limit at 500
 */
export const CHANNEL_LIMITS = {
  warn: 200,
  max: 500,
} as const;

// ============================================================================
// Health Classification
// ============================================================================

/**
 * Classify channel health based on Cpk value
 *
 * @param cpk - Process capability index (may be undefined)
 * @returns Health classification
 *
 * @example
 * getChannelHealth(0.8)   // 'critical'
 * getChannelHealth(1.2)   // 'warning'
 * getChannelHealth(1.5)   // 'capable'
 * getChannelHealth(2.0)   // 'excellent'
 * getChannelHealth(undefined) // 'critical' (no Cpk = assume worst)
 */
export function getChannelHealth(cpk: number | undefined): ChannelHealth {
  if (cpk === undefined || cpk < CPK_THRESHOLDS.critical) {
    return 'critical';
  }
  if (cpk < CPK_THRESHOLDS.warning) {
    return 'warning';
  }
  if (cpk < CPK_THRESHOLDS.capable) {
    return 'capable';
  }
  return 'excellent';
}

// ============================================================================
// Channel Statistics Calculation
// ============================================================================

/**
 * Calculate statistics for a single channel
 *
 * @param data - Array of data rows
 * @param channelId - Column name for the channel
 * @param specs - Specification limits
 * @param label - Optional display label (defaults to channelId)
 * @returns ChannelResult or null if insufficient data
 */
export function calculateChannelStats(
  data: DataRow[],
  channelId: string,
  specs: SpecLimits,
  label?: string
): ChannelResult | null {
  // Extract numeric values for this channel
  const values: number[] = [];

  for (const row of data) {
    const value = toNumericValue(row[channelId]);
    if (value !== undefined) {
      values.push(value);
    }
  }

  // Need at least 2 data points for meaningful statistics
  if (values.length < 2) {
    return null;
  }

  const n = values.length;
  const mean = d3.mean(values) || 0;
  const stdDev = d3.deviation(values) || 0;
  const min = d3.min(values) || 0;
  const max = d3.max(values) || 0;

  // Calculate capability indices
  let cp: number | undefined;
  let cpk: number | undefined;

  if (stdDev > 0) {
    if (specs.usl !== undefined && specs.lsl !== undefined) {
      cp = (specs.usl - specs.lsl) / (6 * stdDev);
      const cpu = (specs.usl - mean) / (3 * stdDev);
      const cpl = (mean - specs.lsl) / (3 * stdDev);
      cpk = Math.min(cpu, cpl);
    } else if (specs.usl !== undefined) {
      cpk = (specs.usl - mean) / (3 * stdDev);
    } else if (specs.lsl !== undefined) {
      cpk = (mean - specs.lsl) / (3 * stdDev);
    }
  }

  // Calculate out of spec percentage
  const outOfSpec = values.filter(v => {
    if (specs.usl !== undefined && v > specs.usl) return true;
    if (specs.lsl !== undefined && v < specs.lsl) return true;
    return false;
  });
  const outOfSpecPercentage = (outOfSpec.length / n) * 100;

  // Determine health
  const health = getChannelHealth(cpk);

  return {
    id: channelId,
    label: label || channelId,
    n,
    mean,
    stdDev,
    cp,
    cpk,
    min,
    max,
    health,
    outOfSpecPercentage,
    values,
  };
}

/**
 * Calculate performance analysis for all channels
 *
 * @param data - Array of data rows (wide format)
 * @param channelIds - Array of column names to analyze as channels
 * @param specs - Specification limits (applied to all channels)
 * @param labels - Optional map of channelId -> display label
 * @returns ChannelPerformanceData with all channel results and summary
 *
 * @example
 * const result = calculateChannelPerformance(
 *   data,
 *   ['V1', 'V2', 'V3', 'V4'],
 *   { lsl: 328, usl: 332, target: 330 }
 * );
 * console.log(result.summary.healthCounts.critical); // 2
 */
export function calculateChannelPerformance(
  data: DataRow[],
  channelIds: string[],
  specs: SpecLimits,
  labels?: Record<string, string>
): ChannelPerformanceData {
  // Calculate stats for each channel
  const channels: ChannelResult[] = [];

  for (const channelId of channelIds) {
    const label = labels?.[channelId];
    const result = calculateChannelStats(data, channelId, specs, label);
    if (result) {
      channels.push(result);
    }
  }

  // Calculate summary statistics
  const summary = calculatePerformanceSummary(channels);

  return {
    channels,
    summary,
    specs,
  };
}

/**
 * Calculate summary statistics across all channels
 */
function calculatePerformanceSummary(channels: ChannelResult[]): PerformanceSummary {
  const healthCounts: Record<ChannelHealth, number> = {
    critical: 0,
    warning: 0,
    capable: 0,
    excellent: 0,
  };

  const cpkValues: number[] = [];

  for (const channel of channels) {
    healthCounts[channel.health]++;
    if (channel.cpk !== undefined) {
      cpkValues.push(channel.cpk);
    }
  }

  // Calculate overall Cpk statistics
  const meanCpk = cpkValues.length > 0 ? d3.mean(cpkValues) || 0 : 0;
  const minCpk = cpkValues.length > 0 ? d3.min(cpkValues) || 0 : 0;
  const maxCpk = cpkValues.length > 0 ? d3.max(cpkValues) || 0 : 0;
  const stdDevCpk = cpkValues.length > 1 ? d3.deviation(cpkValues) || 0 : 0;

  return {
    totalChannels: channels.length,
    healthCounts,
    overall: {
      meanCpk,
      minCpk,
      maxCpk,
      stdDevCpk,
    },
    needsAttentionCount: healthCounts.critical + healthCounts.warning,
  };
}

// ============================================================================
// Sorting and Filtering
// ============================================================================

/**
 * Sort criteria for channels
 */
export type ChannelSortBy = 'cpk-asc' | 'cpk-desc' | 'name' | 'health';

/**
 * Sort channels by specified criteria
 *
 * @param channels - Array of channel results
 * @param sortBy - Sort criteria
 * @returns New sorted array (does not mutate original)
 *
 * @example
 * // Sort by Cpk ascending (worst first) for Pareto-style analysis
 * const sorted = sortChannels(channels, 'cpk-asc');
 */
export function sortChannels(
  channels: ChannelResult[],
  sortBy: ChannelSortBy = 'cpk-asc'
): ChannelResult[] {
  const sorted = [...channels];

  switch (sortBy) {
    case 'cpk-asc':
      // Worst (lowest Cpk) first - channels without Cpk go to the beginning
      sorted.sort((a, b) => {
        const aCpk = a.cpk ?? -Infinity;
        const bCpk = b.cpk ?? -Infinity;
        return aCpk - bCpk;
      });
      break;

    case 'cpk-desc':
      // Best (highest Cpk) first
      sorted.sort((a, b) => {
        const aCpk = a.cpk ?? -Infinity;
        const bCpk = b.cpk ?? -Infinity;
        return bCpk - aCpk;
      });
      break;

    case 'name':
      // Alphabetical by label, with numeric sorting for numbered channels
      sorted.sort((a, b) => {
        // Try to extract numbers for natural sorting
        const aNum = parseInt(a.label.replace(/\D/g, ''), 10);
        const bNum = parseInt(b.label.replace(/\D/g, ''), 10);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }

        return a.label.localeCompare(b.label);
      });
      break;

    case 'health':
      // By health severity: critical -> warning -> capable -> excellent
      const healthOrder: Record<ChannelHealth, number> = {
        critical: 0,
        warning: 1,
        capable: 2,
        excellent: 3,
      };
      sorted.sort((a, b) => {
        const diff = healthOrder[a.health] - healthOrder[b.health];
        if (diff !== 0) return diff;
        // Secondary sort by Cpk within same health
        return (a.cpk ?? 0) - (b.cpk ?? 0);
      });
      break;
  }

  return sorted;
}

/**
 * Filter channels by health classification
 *
 * @param channels - Array of channel results
 * @param healthLevels - Health levels to include
 * @returns Filtered array
 *
 * @example
 * // Get only channels needing attention
 * const needsAttention = filterChannelsByHealth(channels, ['critical', 'warning']);
 */
export function filterChannelsByHealth(
  channels: ChannelResult[],
  healthLevels: ChannelHealth[]
): ChannelResult[] {
  const healthSet = new Set(healthLevels);
  return channels.filter(c => healthSet.has(c.health));
}

/**
 * Get channels that need attention (critical + warning)
 *
 * @param channels - Array of channel results
 * @returns Channels with critical or warning health, sorted by Cpk ascending
 */
export function getChannelsNeedingAttention(channels: ChannelResult[]): ChannelResult[] {
  const needsAttention = filterChannelsByHealth(channels, ['critical', 'warning']);
  return sortChannels(needsAttention, 'cpk-asc');
}

/**
 * Get top N worst performing channels
 *
 * @param channels - Array of channel results
 * @param n - Number of channels to return
 * @returns Top N channels with lowest Cpk
 */
export function getWorstChannels(channels: ChannelResult[], n: number): ChannelResult[] {
  return sortChannels(channels, 'cpk-asc').slice(0, n);
}

/**
 * Get top N best performing channels
 *
 * @param channels - Array of channel results
 * @param n - Number of channels to return
 * @returns Top N channels with highest Cpk
 */
export function getBestChannels(channels: ChannelResult[], n: number): ChannelResult[] {
  return sortChannels(channels, 'cpk-desc').slice(0, n);
}

// ============================================================================
// Control Limits for Capability Metrics
// ============================================================================

/**
 * Control limit calculation result for capability metrics (Cp/Cpk)
 */
export interface CapabilityControlLimits {
  /** Mean of capability values across channels */
  mean: number;
  /** Standard deviation of capability values */
  stdDev: number;
  /** Upper Control Limit (mean + 3σ) */
  ucl: number;
  /** Lower Control Limit (mean - 3σ), clamped to 0 */
  lcl: number;
  /** Number of channels used in calculation */
  n: number;
}

/**
 * Calculate control limits for capability metrics (Cp or Cpk) across channels
 *
 * Uses standard control chart formula: UCL = mean + 3σ, LCL = mean - 3σ
 * LCL is clamped to 0 since negative capability values are meaningless.
 *
 * @param channels - Array of channel results
 * @param metric - Which capability metric to use: 'cp' or 'cpk'
 * @returns Control limits, or null if insufficient data
 *
 * @example
 * const limits = calculateCapabilityControlLimits(channels, 'cpk');
 * // { mean: 1.25, stdDev: 0.15, ucl: 1.70, lcl: 0.80, n: 12 }
 */
export function calculateCapabilityControlLimits(
  channels: ChannelResult[],
  metric: 'cp' | 'cpk' = 'cpk'
): CapabilityControlLimits | null {
  // Extract valid capability values
  const values = channels
    .map(c => c[metric])
    .filter((v): v is number => v !== undefined && !isNaN(v));

  // Need at least 2 values for meaningful statistics
  if (values.length < 2) {
    return null;
  }

  const n = values.length;
  const mean = d3.mean(values) || 0;
  const stdDev = d3.deviation(values) || 0;

  // Calculate control limits
  // LCL is clamped to 0 since negative capability is meaningless
  const ucl = mean + 3 * stdDev;
  const lcl = Math.max(0, mean - 3 * stdDev);

  return {
    mean,
    stdDev,
    ucl,
    lcl,
    n,
  };
}

/**
 * Result of control status check for a capability value
 */
export interface CapabilityControlStatus {
  /** Whether the value is within control limits */
  inControl: boolean;
  /** Whether this point is part of a Nelson Rule 2 violation (9+ consecutive on same side) */
  nelsonRule2Violation: boolean;
}

/**
 * Determine control status for each channel's capability value
 *
 * Checks:
 * 1. Basic control limits (within UCL/LCL)
 * 2. Nelson Rule 2: 9 or more consecutive points on same side of mean
 *
 * @param channels - Array of channel results
 * @param limits - Pre-calculated control limits
 * @param metric - Which capability metric to use: 'cp' or 'cpk'
 * @returns Map of channel ID to control status
 */
export function getCapabilityControlStatus(
  channels: ChannelResult[],
  limits: CapabilityControlLimits,
  metric: 'cp' | 'cpk' = 'cpk'
): Map<string, CapabilityControlStatus> {
  const statusMap = new Map<string, CapabilityControlStatus>();

  // First pass: check basic control limits
  const basicStatus = channels.map(channel => {
    const value = channel[metric];
    if (value === undefined) {
      return { id: channel.id, inControl: false, aboveMean: false };
    }
    const inControl = value >= limits.lcl && value <= limits.ucl;
    const aboveMean = value > limits.mean;
    return { id: channel.id, inControl, aboveMean };
  });

  // Second pass: check Nelson Rule 2 (9+ consecutive on same side of mean)
  const nelsonViolations = new Set<number>();
  let consecutiveCount = 1;
  let previousAboveMean = basicStatus[0]?.aboveMean;

  for (let i = 1; i < basicStatus.length; i++) {
    if (basicStatus[i].aboveMean === previousAboveMean) {
      consecutiveCount++;
    } else {
      // If we had 9+ consecutive, mark them all
      if (consecutiveCount >= 9) {
        for (let j = i - consecutiveCount; j < i; j++) {
          nelsonViolations.add(j);
        }
      }
      consecutiveCount = 1;
      previousAboveMean = basicStatus[i].aboveMean;
    }
  }

  // Check final run
  if (consecutiveCount >= 9) {
    for (let j = basicStatus.length - consecutiveCount; j < basicStatus.length; j++) {
      nelsonViolations.add(j);
    }
  }

  // Build result map
  basicStatus.forEach((status, index) => {
    statusMap.set(status.id, {
      inControl: status.inControl,
      nelsonRule2Violation: nelsonViolations.has(index),
    });
  });

  return statusMap;
}
