/**
 * YamazumiDisplayToggle - Chart display controls for Yamazumi mode
 *
 * Two sub-components:
 * 1. I-Chart metric segmented control (Total|VA|NVA|Waste|Wait)
 * 2. Pareto mode dropdown (5 options)
 *
 * Follows BoxplotDisplayToggle pattern — props-based, no context dependency.
 */

import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { YamazumiIChartMetric, YamazumiParetoMode } from '@variscout/core';

// ============================================================================
// I-Chart Metric Toggle
// ============================================================================

export interface YamazumiIChartMetricToggleProps {
  /** Currently selected metric */
  metric: YamazumiIChartMetric;
  /** Callback when metric changes */
  onMetricChange: (metric: YamazumiIChartMetric) => void;
}

const METRIC_OPTIONS: { value: YamazumiIChartMetric; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'va', label: 'VA' },
  { value: 'nva', label: 'NVA' },
  { value: 'waste', label: 'Waste' },
  { value: 'wait', label: 'Wait' },
];

export const YamazumiIChartMetricToggle: React.FC<YamazumiIChartMetricToggleProps> = ({
  metric,
  onMetricChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 bg-surface-secondary rounded-lg p-0.5">
      {METRIC_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onMetricChange(opt.value)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            metric === opt.value
              ? 'bg-surface-primary text-content font-medium shadow-sm'
              : 'text-content-secondary hover:text-content'
          }`}
        >
          {t?.(`yamazumi.metric.${opt.value}`) ?? opt.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Pareto Mode Dropdown
// ============================================================================

export interface YamazumiParetoModeDropdownProps {
  /** Currently selected mode */
  mode: YamazumiParetoMode;
  /** Callback when mode changes */
  onModeChange: (mode: YamazumiParetoMode) => void;
  /** Whether reason column is available */
  hasReasonColumn?: boolean;
  /** Whether activity column is available */
  hasActivityColumn?: boolean;
}

const PARETO_MODE_OPTIONS: {
  value: YamazumiParetoMode;
  label: string;
  requiresColumn?: 'reason' | 'activity';
}[] = [
  { value: 'steps-total', label: 'Steps by Total Time' },
  { value: 'steps-waste', label: 'Steps by Waste Time' },
  { value: 'steps-nva', label: 'Steps by NVA Time' },
  { value: 'activities', label: 'Activities by Time', requiresColumn: 'activity' },
  { value: 'reasons', label: 'Waste Reasons', requiresColumn: 'reason' },
];

export const YamazumiParetoModeDropdown: React.FC<YamazumiParetoModeDropdownProps> = ({
  mode,
  onModeChange,
  hasReasonColumn = false,
  hasActivityColumn = false,
}) => {
  const { t } = useTranslation();

  const availableOptions = PARETO_MODE_OPTIONS.filter(opt => {
    if (opt.requiresColumn === 'reason' && !hasReasonColumn) return false;
    if (opt.requiresColumn === 'activity' && !hasActivityColumn) return false;
    return true;
  });

  return (
    <select
      value={mode}
      onChange={e => onModeChange(e.target.value as YamazumiParetoMode)}
      className="px-2 py-1 text-xs bg-surface-secondary text-content border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {availableOptions.map(opt => (
        <option key={opt.value} value={opt.value}>
          {t?.(`yamazumi.pareto.${opt.value}`) ?? opt.label}
        </option>
      ))}
    </select>
  );
};
