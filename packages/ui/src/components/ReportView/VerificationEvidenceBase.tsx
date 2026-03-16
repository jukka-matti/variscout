/**
 * VerificationEvidenceBase — Chip bar + chart stack for Step 5 staged evidence.
 *
 * Shared UI component following *Base + colorScheme pattern.
 * Renders toggle chips for each chart type and active charts in vertical stack.
 */

import React from 'react';

// ============================================================================
// Types (mirrored from hooks to avoid circular dependency)
// ============================================================================

export type VerificationChartId = 'stats' | 'ichart' | 'boxplot' | 'histogram' | 'pareto';

export interface VerificationChartOption {
  id: VerificationChartId;
  label: string;
  available: boolean;
}

// ============================================================================
// Color Scheme
// ============================================================================

export interface VerificationEvidenceColorScheme {
  container: string;
  chipBar: string;
  chipActive: string;
  chipAvailable: string;
  chipUnavailable: string;
  chartWrapper: string;
}

export const verificationEvidenceDefaultColorScheme: VerificationEvidenceColorScheme = {
  container: 'space-y-4',
  chipBar: 'flex flex-wrap gap-2',
  chipActive:
    'px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white cursor-pointer select-none transition-colors',
  chipAvailable:
    'px-3 py-1 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors',
  chipUnavailable:
    'px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 line-through opacity-50 pointer-events-none select-none',
  chartWrapper:
    'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden',
};

// ============================================================================
// Props
// ============================================================================

export interface VerificationEvidenceBaseProps {
  charts: VerificationChartOption[];
  activeCharts: Set<VerificationChartId>;
  onToggleChart: (id: VerificationChartId) => void;
  renderChart: (id: VerificationChartId) => React.ReactNode | null;
  colorScheme?: Partial<VerificationEvidenceColorScheme>;
}

// ============================================================================
// Component
// ============================================================================

export const VerificationEvidenceBase: React.FC<VerificationEvidenceBaseProps> = ({
  charts,
  activeCharts,
  onToggleChart,
  renderChart,
  colorScheme,
}) => {
  const cs: VerificationEvidenceColorScheme = {
    ...verificationEvidenceDefaultColorScheme,
    ...colorScheme,
  };

  return (
    <div className={cs.container} data-testid="verification-evidence">
      {/* Chip bar */}
      <div className={cs.chipBar} data-testid="verification-chip-bar">
        {charts.map(chart => {
          const isActive = activeCharts.has(chart.id);
          let chipClass: string;
          if (!chart.available) {
            chipClass = cs.chipUnavailable;
          } else if (isActive) {
            chipClass = cs.chipActive;
          } else {
            chipClass = cs.chipAvailable;
          }

          return (
            <button
              key={chart.id}
              className={chipClass}
              onClick={() => onToggleChart(chart.id)}
              disabled={!chart.available}
              aria-pressed={isActive}
              data-testid={`verification-chip-${chart.id}`}
            >
              {chart.label}
            </button>
          );
        })}
      </div>

      {/* Chart stack */}
      {charts
        .filter(c => c.available && activeCharts.has(c.id))
        .map(chart => {
          const content = renderChart(chart.id);
          if (!content) return null;
          return (
            <div
              key={chart.id}
              className={cs.chartWrapper}
              data-testid={`verification-chart-${chart.id}`}
            >
              {content}
            </div>
          );
        })}
    </div>
  );
};
