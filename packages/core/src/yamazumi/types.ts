/**
 * Yamazumi Analysis Mode — Types and constants
 *
 * Yamazumi charts visualize cycle time composition by activity type
 * (VA/NVA Required/Waste/Wait) across process steps.
 */

// ============================================================================
// Activity Type System
// ============================================================================

/** Canonical activity type categories for lean time study analysis */
export type ActivityType = 'va' | 'nva-required' | 'waste' | 'wait';

/** Fixed semantic colors for activity types (never change by drill level) */
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  va: '#22c55e', // Green — Value-Adding
  'nva-required': '#f59e0b', // Amber — Necessary but non-value-adding
  waste: '#ef4444', // Red — Eliminable waste (muda)
  wait: '#94a3b8', // Grey — Queue/wait time
};

/** Human-readable labels for activity types */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  va: 'Value-Adding',
  'nva-required': 'NVA Required',
  waste: 'Waste',
  wait: 'Wait',
};

/** All activity types in stacking order (bottom to top) */
export const ACTIVITY_TYPE_ORDER: ActivityType[] = ['va', 'nva-required', 'waste', 'wait'];

// ============================================================================
// Column Mapping
// ============================================================================

/** Column role assignments for Yamazumi analysis */
export interface YamazumiColumnMapping {
  /** Required: column with VA/NVA/Waste/Wait values */
  activityTypeColumn: string;
  /** Required: numeric time column (= outcome) */
  cycleTimeColumn: string;
  /** Required: process step names */
  stepColumn: string;
  /** Optional: individual activity names */
  activityColumn?: string;
  /** Optional: waste reason/comment text */
  reasonColumn?: string;
  /** Optional: product type for comparison */
  productColumn?: string;
  /** Optional: separate wait-before-step column */
  waitTimeColumn?: string;
  /** User-entered reference takt time */
  taktTime?: number;
}

// ============================================================================
// Data Types
// ============================================================================

/** One segment within a Yamazumi bar */
export interface YamazumiSegment {
  /** Activity type for this segment */
  activityType: ActivityType;
  /** Total time for this activity type within the bar */
  totalTime: number;
  /** Percentage of the bar's total time */
  percentage: number;
  /** Number of rows contributing to this segment */
  count: number;
}

/** One Yamazumi bar (one process step or category) */
export interface YamazumiBarData {
  /** Step/category name */
  key: string;
  /** Stacked segments by activity type */
  segments: YamazumiSegment[];
  /** Sum of all segment times */
  totalTime: number;
}

/** Summary statistics for Yamazumi mode */
export interface YamazumiSummary {
  /** Total lead time across all steps */
  totalLeadTime: number;
  /** Total value-adding time */
  vaTime: number;
  /** Total NVA Required time */
  nvaTime: number;
  /** Total waste time */
  wasteTime: number;
  /** Total wait time */
  waitTime: number;
  /** VA / totalLeadTime (0-1) */
  vaRatio: number;
  /** VA / (VA + NVA Required) (0-1) */
  processEfficiency: number;
  /** Reference takt time (if set) */
  taktTime?: number;
  /** Step names that exceed takt time */
  stepsOverTakt: string[];
}

// ============================================================================
// I-Chart and Pareto Switching
// ============================================================================

/** Switchable metric for I-Chart in Yamazumi mode */
export type YamazumiIChartMetric = 'total' | 'va' | 'nva' | 'waste' | 'wait';

/** Switchable Pareto ranking mode */
export type YamazumiParetoMode =
  | 'steps-total'
  | 'steps-waste'
  | 'steps-nva'
  | 'activities'
  | 'reasons';

// ============================================================================
// Detection
// ============================================================================

/** Result of Yamazumi format auto-detection */
export interface YamazumiDetection {
  /** Whether data appears to be Yamazumi format */
  isYamazumiFormat: boolean;
  /** Detection confidence */
  confidence: 'high' | 'medium' | 'low';
  /** Suggested column mapping */
  suggestedMapping: Partial<YamazumiColumnMapping>;
  /** Reason for classification */
  reason: string;
}
