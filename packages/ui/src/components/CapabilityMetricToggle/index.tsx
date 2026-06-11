/**
 * CapabilityMetricToggle - Segmented control to switch between
 * "Measurements" (raw values) and "Capability over time" (Cpk per subgroup
 * plotted as a control chart — ADR-038).
 *
 * The labels match the story VariScout tells: you're either looking at
 * individual measurements or at whether capability itself is stable over
 * time / across subgroups. Rational-subgroup coaching lives in
 * `CapabilityCoachingPanel`.
 *
 * Props-based, no context.
 */

import React from 'react';
import type { StandardIChartMetric } from '@variscout/core';

export interface CapabilityMetricToggleProps {
  /** Currently selected metric */
  metric: StandardIChartMetric;
  /** Callback when metric changes */
  onMetricChange: (metric: StandardIChartMetric) => void;
  /** Legacy disabled flag; prefer disabledReason for a legible prerequisite label. */
  disabled?: boolean;
  /** When set, the capability lens is disabled and this text explains why. */
  disabledReason?: string;
}

const OPTIONS: { value: StandardIChartMetric; label: string }[] = [
  { value: 'measurement', label: 'Measurements' },
  { value: 'capability', label: 'Capability over time' },
];

export const CapabilityMetricToggle: React.FC<CapabilityMetricToggleProps> = ({
  metric,
  onMetricChange,
  disabled = false,
  disabledReason,
}) => {
  const capabilityDisabled = disabled || !!disabledReason;
  const reason = disabledReason ?? 'Set specs and choose a subgroup to view capability over time';
  return (
    <div className="flex items-center gap-0.5 bg-surface-secondary rounded-lg p-0.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => {
            if (opt.value === 'capability' && capabilityDisabled) return;
            onMetricChange(opt.value);
          }}
          aria-disabled={opt.value === 'capability' && capabilityDisabled ? 'true' : undefined}
          title={opt.value === 'capability' && capabilityDisabled ? reason : undefined}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            metric === opt.value
              ? 'bg-surface-primary text-content font-medium shadow-sm'
              : 'text-content-secondary hover:text-content'
          } ${opt.value === 'capability' && capabilityDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
