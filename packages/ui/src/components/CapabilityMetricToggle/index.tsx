/**
 * CapabilityMetricToggle - Segmented control to switch between
 * "Values" (raw measurements) and "Capability" (Cp/Cpk per subgroup)
 * on the standard I-Chart.
 *
 * Follows YamazumiIChartMetricToggle pattern — props-based, no context.
 */

import React from 'react';
import type { StandardIChartMetric } from '@variscout/core';

export interface CapabilityMetricToggleProps {
  /** Currently selected metric */
  metric: StandardIChartMetric;
  /** Callback when metric changes */
  onMetricChange: (metric: StandardIChartMetric) => void;
  /** Disabled when no specs are set */
  disabled?: boolean;
}

const OPTIONS: { value: StandardIChartMetric; label: string }[] = [
  { value: 'measurement', label: 'Values' },
  { value: 'capability', label: 'Capability' },
];

export const CapabilityMetricToggle: React.FC<CapabilityMetricToggleProps> = ({
  metric,
  onMetricChange,
  disabled = false,
}) => {
  return (
    <div
      className="flex items-center gap-0.5 bg-surface-secondary rounded-lg p-0.5"
      title={disabled ? 'Set specification limits to enable capability view' : undefined}
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => !disabled && onMetricChange(opt.value)}
          disabled={disabled}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            metric === opt.value
              ? 'bg-surface-primary text-content font-medium shadow-sm'
              : 'text-content-secondary hover:text-content'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
