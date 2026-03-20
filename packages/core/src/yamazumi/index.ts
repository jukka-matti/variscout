/**
 * Yamazumi Analysis Mode — barrel exports
 */

// Types
export type {
  ActivityType,
  YamazumiColumnMapping,
  YamazumiSegment,
  YamazumiBarData,
  YamazumiSummary,
  YamazumiIChartMetric,
  YamazumiParetoMode,
  YamazumiDetection,
} from './types';

export { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ORDER } from './types';

// Classification
export { classifyActivityType, isActivityTypeValue } from './classify';

// Aggregation
export { computeYamazumiData, computeYamazumiSummary } from './aggregation';

// Detection
export { detectYamazumiFormat } from './detection';
