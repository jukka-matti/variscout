/**
 * CapabilityGapTrendChart — Δ(Cp-Cpk) gap as a time series.
 *
 * Answers "is centering loss trending over snapshots?" by plotting the
 * per-snapshot gap (Cp − Cpk) as its own series. Target line at zero
 * represents perfect centering.
 *
 * Wraps IChartBase with capability-specific defaults (target=0, label
 * "Δ(Cp-Cpk)"). See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * top-right slot.
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { IChartBase } from './IChart';
import type { CapabilityGapTrendChartProps } from './types';

export const CapabilityGapTrendChartBase: React.FC<CapabilityGapTrendChartProps> = ({
  parentWidth,
  parentHeight,
  gapSeries,
  gapStats,
  yAxisLabel = 'Δ(Cp-Cpk)',
  targetLabel = '0',
  showBranding,
  brandingText,
}) => {
  return (
    <IChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={[...gapSeries]}
      stats={gapStats}
      specs={{ target: 0 }}
      yAxisLabel={yAxisLabel}
      targetLabel={targetLabel}
      showBranding={showBranding}
      brandingText={brandingText}
    />
  );
};

const CapabilityGapTrendChart = withParentSize(CapabilityGapTrendChartBase);
export default CapabilityGapTrendChart;
export { CapabilityGapTrendChart };
