import React, { useMemo } from 'react';
import type { StagedComparison, StagedComparisonDeltas, DeltaColor } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { useTranslation } from '@variscout/hooks';

// ============================================================================
// Color Scheme
// ============================================================================

export interface StagedComparisonColorScheme {
  container: string;
  header: string;
  stageLabel: string;
  metricLabel: string;
  metricValue: string;
  deltaRow: string;
}

export const defaultStagedComparisonColorScheme: StagedComparisonColorScheme = {
  container: 'space-y-3',
  header: 'text-xs font-medium text-content-secondary uppercase tracking-wider',
  stageLabel: 'text-xs font-medium text-content-secondary',
  metricLabel: 'text-[11px] text-content-muted',
  metricValue: 'text-sm font-mono font-bold text-white',
  deltaRow: 'text-xs font-mono font-medium',
};

// ============================================================================
// Props
// ============================================================================

export interface StagedComparisonCardProps {
  comparison: StagedComparison;
  cpkTarget?: number;
  colorScheme?: Partial<StagedComparisonColorScheme>;
}

// ============================================================================
// Helpers
// ============================================================================

const colorClasses: Record<DeltaColor, string> = {
  green: 'text-green-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
};

const arrowChar: Record<DeltaColor, string> = {
  green: '↑',
  red: '↓',
  amber: '→',
};

function formatDeltaValue(
  value: number | null,
  decimals: number = 2,
  fmt?: (v: number, d?: number) => string
): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  const formatted = fmt ? fmt(value, decimals) : formatStatistic(value, 'en', decimals);
  return `${sign}${formatted}`;
}

function formatRatio(value: number, fmt?: (v: number, d?: number) => string): string {
  const pct = (value - 1) * 100;
  const sign = pct > 0 ? '+' : '';
  const formatted = fmt ? fmt(pct, 0) : formatStatistic(pct, 'en', 0);
  return `${sign}${formatted}%`;
}

/** Get directionally-correct arrow: green could be up or down depending on metric */
function getArrow(
  key: keyof StagedComparisonDeltas,
  deltas: StagedComparisonDeltas,
  color: DeltaColor
): string {
  if (color === 'amber') return arrowChar.amber;
  const value = deltas[key];
  if (value === null) return arrowChar.amber;

  // For variationRatio, < 1 = improved (down arrow, green)
  if (key === 'variationRatio') {
    return (value as number) < 1 ? '↓' : '↑';
  }
  // For meanShift, smaller absolute is usually better but direction is neutral
  if (key === 'meanShift') {
    return (value as number) > 0 ? '↑' : '↓';
  }
  // For cpkDelta, passRateDelta, outOfSpecReduction: positive = improved
  return (value as number) > 0 ? '↑' : '↓';
}

// ============================================================================
// Metric definitions
// ============================================================================

interface MetricDef {
  label: string;
  getValue: (stats: {
    mean: number;
    stdDev: number;
    cpk?: number;
    outOfSpecPercentage: number;
  }) => string;
  deltaKey: keyof StagedComparisonDeltas;
  formatDelta: (deltas: StagedComparisonDeltas) => string;
  requiresSpecs?: boolean;
}

function buildMetrics(fmt: (v: number, d?: number) => string): MetricDef[] {
  return [
    {
      label: 'Mean',
      getValue: s => fmt(s.mean),
      deltaKey: 'meanShift',
      formatDelta: d => formatDeltaValue(d.meanShift, 2, fmt),
    },
    {
      label: 'Std Dev',
      getValue: s => fmt(s.stdDev),
      deltaKey: 'variationRatio',
      formatDelta: d => formatRatio(d.variationRatio, fmt),
    },
    {
      label: 'Cpk',
      getValue: s => (s.cpk !== undefined ? fmt(s.cpk) : '—'),
      deltaKey: 'cpkDelta',
      formatDelta: d => formatDeltaValue(d.cpkDelta, 2, fmt),
      requiresSpecs: true,
    },
    {
      label: 'In Spec %',
      getValue: s => `${fmt(100 - s.outOfSpecPercentage, 1)}%`,
      deltaKey: 'passRateDelta',
      formatDelta: d =>
        d.passRateDelta !== null ? `${formatDeltaValue(d.passRateDelta, 1, fmt)}%` : '—',
      requiresSpecs: true,
    },
  ];
}

// ============================================================================
// Component
// ============================================================================

const StagedComparisonCard: React.FC<StagedComparisonCardProps> = ({
  comparison,
  cpkTarget,
  colorScheme: csOverride,
}) => {
  const { formatStat } = useTranslation();
  const cs = { ...defaultStagedComparisonColorScheme, ...csOverride };
  const { stages, deltas, colorCoding } = comparison;
  const hasSpecs = deltas.cpkDelta !== null || deltas.passRateDelta !== null;
  const metrics = useMemo(() => buildMetrics(formatStat), [formatStat]);
  const activeMetrics = metrics.filter(m => !m.requiresSpecs || hasSpecs);

  const isTwoStage = stages.length === 2;

  // ------------------------------------------------------------------
  // 2-stage: compact card layout
  // ------------------------------------------------------------------
  if (isTwoStage) {
    const first = stages[0];
    const last = stages[1];

    return (
      <div className={cs.container} data-testid="staged-comparison-card">
        <div className={cs.header}>Stage Comparison</div>

        {/* Metric rows */}
        <div className="bg-surface-secondary/50 border border-edge/50 rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-edge/30">
            <div className={cs.metricLabel} />
            <div className={`${cs.stageLabel} text-center`}>{first.name}</div>
            <div className={`${cs.stageLabel} text-center`}>{last.name}</div>
            <div className={`${cs.stageLabel} text-center`}>Delta</div>
          </div>

          {activeMetrics.map(metric => {
            const color = colorCoding[metric.deltaKey];
            const arrow = getArrow(metric.deltaKey, deltas, color);

            return (
              <div
                key={metric.label}
                className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b border-edge/20 last:border-b-0"
              >
                <div className={cs.metricLabel}>{metric.label}</div>
                <div className={`${cs.metricValue} text-center text-xs`}>
                  {metric.getValue(first.stats)}
                </div>
                <div className={`${cs.metricValue} text-center text-xs`}>
                  {metric.getValue(last.stats)}
                </div>
                <div
                  className={`${cs.deltaRow} text-center ${colorClasses[color]}`}
                  data-testid={`delta-${metric.deltaKey}`}
                >
                  {arrow} {metric.formatDelta(deltas)}
                </div>
              </div>
            );
          })}
        </div>

        {cpkTarget !== undefined && deltas.cpkDelta !== null && (
          <div className="text-[10px] text-content-muted">Target Cpk: {formatStat(cpkTarget)}</div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 3+ stages: full table layout
  // ------------------------------------------------------------------
  return (
    <div className={cs.container} data-testid="staged-comparison-card">
      <div className={cs.header}>Stage Comparison</div>

      <div className="bg-surface-secondary/50 border border-edge/50 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-edge/30">
              <th className={`${cs.metricLabel} text-left px-3 py-2`} />
              {stages.map(stage => (
                <th key={stage.name} className={`${cs.stageLabel} text-center px-2 py-2`}>
                  {stage.name}
                </th>
              ))}
              <th className={`${cs.stageLabel} text-center px-2 py-2`}>Delta</th>
            </tr>
          </thead>
          <tbody>
            {activeMetrics.map(metric => {
              const color = colorCoding[metric.deltaKey];
              const arrow = getArrow(metric.deltaKey, deltas, color);

              return (
                <tr key={metric.label} className="border-b border-edge/20 last:border-b-0">
                  <td className={`${cs.metricLabel} px-3 py-1.5`}>{metric.label}</td>
                  {stages.map(stage => (
                    <td
                      key={stage.name}
                      className={`${cs.metricValue} text-center text-xs px-2 py-1.5`}
                    >
                      {metric.getValue(stage.stats)}
                    </td>
                  ))}
                  <td
                    className={`${cs.deltaRow} text-center px-2 py-1.5 ${colorClasses[color]}`}
                    data-testid={`delta-${metric.deltaKey}`}
                  >
                    {arrow} {metric.formatDelta(deltas)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cpkTarget !== undefined && deltas.cpkDelta !== null && (
        <div className="text-[10px] text-content-muted">Target Cpk: {formatStat(cpkTarget)}</div>
      )}
    </div>
  );
};

export { StagedComparisonCard };
